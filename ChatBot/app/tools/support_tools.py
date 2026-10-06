from typing import Optional
from app.schemas.tool import ToolResult
from app.core.logging import logger


async def create_support_ticket(
    summary: str,
    issue: str,
    order_id: Optional[int] = None,
    customer_token: Optional[str] = None,
    **kwargs
) -> ToolResult:
    """Creates a support ticket for customer care follow-up."""
    ticket_id = f"TICK-{abs(hash(summary)) % 100000}"
    logger.info(f"Created support ticket {ticket_id}: {summary}")
    return ToolResult(
        success=True,
        tool_name="create_support_ticket",
        status="COMPLETED",
        data={"ticketId": ticket_id, "summary": summary, "orderId": order_id},
        message=f"I've created support ticket #{ticket_id}. Our team will contact you shortly."
    )


async def escalate_to_human(reason: str, **kwargs) -> ToolResult:
    """Escalates conversation to live customer support."""
    return ToolResult(
        success=True,
        tool_name="escalate_to_human",
        status="COMPLETED",
        data={"escalated": True, "reason": reason},
        message="I can connect you with customer support and include our conversation so you don't have to repeat anything."
    )
