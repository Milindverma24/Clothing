from typing import Dict, Any, List
from app.services.springboot_client import springboot_client
from app.schemas.tool import ToolResult
from app.core.logging import logger


async def search_products(
    query: str = "",
    category: str = None,
    color: str = None,
    max_price: float = None,
    limit: int = 6,
    **kwargs
) -> ToolResult:
    """Searches live products matching natural language search criteria."""
    try:
        products = await springboot_client.search_products(
            query=query,
            limit=limit,
            category=category,
            color=color,
            max_price=max_price
        )
        return ToolResult(
            success=True,
            tool_name="search_products",
            status="COMPLETED",
            data=[p.model_dump() for p in products],
            message=f"Found {len(products)} products matching your request."
        )
    except Exception as e:
        logger.error(f"Error in search_products tool: {e}")
        return ToolResult(
            success=False,
            tool_name="search_products",
            status="FAILED",
            error=str(e),
            message="Could not search products right now."
        )


async def get_product(product_id: int, **kwargs) -> ToolResult:
    """Retrieves authoritative product details and variant availability."""
    try:
        product = await springboot_client.get_product(product_id)
        if product:
            return ToolResult(
                success=True,
                tool_name="get_product",
                status="COMPLETED",
                data=product.model_dump(),
                message=f"Retrieved details for {product.name}."
            )
        return ToolResult(
            success=False,
            tool_name="get_product",
            status="FAILED",
            message=f"Product #{product_id} not found."
        )
    except Exception as e:
        return ToolResult(
            success=False,
            tool_name="get_product",
            status="FAILED",
            error=str(e),
            message="Could not load product details."
        )
