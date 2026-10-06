from typing import Optional
from app.services.springboot_client import springboot_client
from app.schemas.tool import ToolResult
from app.core.logging import logger


async def get_cart(customer_token: Optional[str] = None, **kwargs) -> ToolResult:
    """Retrieves customer's active shopping cart."""
    if not customer_token:
        return ToolResult(
            success=False,
            tool_name="get_cart",
            status="FAILED",
            message="Please sign in to view your bag."
        )

    try:
        cart = await springboot_client.get_cart(customer_token)
        return ToolResult(
            success=True,
            tool_name="get_cart",
            status="COMPLETED",
            data=cart,
            message="Retrieved current shopping bag."
        )
    except Exception as e:
        logger.error(f"Error in get_cart tool: {e}")
        return ToolResult(
            success=False,
            tool_name="get_cart",
            status="FAILED",
            error=str(e),
            message="Could not load your shopping bag."
        )


async def add_to_cart(variant_id: int, quantity: int = 1, customer_token: Optional[str] = None, **kwargs) -> ToolResult:
    """Adds a product variant to the customer's cart."""
    if not customer_token:
        return ToolResult(
            success=False,
            tool_name="add_to_cart",
            status="FAILED",
            message="Please sign in to add items to your cart."
        )

    try:
        success = await springboot_client.add_to_cart(variant_id, quantity, customer_token)
        if success:
            return ToolResult(
                success=True,
                tool_name="add_to_cart",
                status="COMPLETED",
                message="Added item to your bag."
            )
        return ToolResult(
            success=False,
            tool_name="add_to_cart",
            status="FAILED",
            message="Could not add item to bag. It might be out of stock."
        )
    except Exception as e:
        return ToolResult(
            success=False,
            tool_name="add_to_cart",
            status="FAILED",
            error=str(e),
            message="Could not update your bag right now."
        )
