import time
from typing import Dict, Any, List, Optional
from app.schemas.agent import AgentPlan, ExecutionPlanStep
from app.schemas.tool import ToolResult
from app.core.security import AuthenticationContext
from app.agent.guardrails import guardrails
from app.tools import registry
from app.core.config import settings
from app.core.logging import logger
from app.core.exceptions import ToolExecutionError


class Executor:
    """Executes planned tool steps with guardrails and loop protection."""

    async def execute_plan(
        self,
        plan: AgentPlan,
        auth_context: AuthenticationContext,
        customer_token: Optional[str] = None,
        has_user_confirmed: Optional[bool] = None,
        pending_action: Optional[Dict[str, Any]] = None
    ) -> List[ToolResult]:
        results: List[ToolResult] = []
        tool_call_count = 0

        for step in plan.steps:
            if tool_call_count >= settings.MAX_TOOL_CALLS:
                logger.warning(f"Exceeded MAX_TOOL_CALLS ({settings.MAX_TOOL_CALLS}). Halting execution.")
                break

            tool_name = step.tool_name
            definition = registry.get_definition(tool_name)
            if not definition:
                raise ToolExecutionError(f"No handler registered for tool '{tool_name}'")

            # Friendly guest handling for tools requiring customer sign-in
            if definition.requires_auth and not auth_context.authenticated:
                results.append(ToolResult(
                    success=False,
                    tool_name=tool_name,
                    status="AUTH_REQUIRED",
                    message="Please sign in to view and track your orders. Once logged in, I will be able to display your live order history and delivery updates!"
                ))
                break

            # Step 1: Validate permissions & auth
            guardrails.validate_tool_permission(tool_name, auth_context)

            # Step 2: Validate confirmation if required
            if step.requires_confirmation:
                guardrails.validate_confirmation(tool_name, has_user_confirmed, pending_action)

            # Step 3: Fetch handler
            handler = registry.get_handler(tool_name)
            if not handler:
                raise ToolExecutionError(f"No handler registered for tool '{tool_name}'")

            # Step 4: Execute handler
            start_time = time.time()
            try:
                # Pass customer token and arguments
                tool_args = dict(step.arguments)
                tool_args["customer_token"] = customer_token
                tool_args["auth_context"] = auth_context

                result: ToolResult = await handler(**tool_args)
                latency = round((time.time() - start_time) * 1000, 2)
                results.append(result)
                tool_call_count += 1
            except Exception as e:
                logger.error(f"Execution failed for tool '{tool_name}': {e}", exc_info=True)
                results.append(ToolResult(
                    success=False,
                    tool_name=tool_name,
                    status="FAILED",
                    error=str(e),
                    message=f"Action failed while executing {tool_name}."
                ))

        return results


executor = Executor()
