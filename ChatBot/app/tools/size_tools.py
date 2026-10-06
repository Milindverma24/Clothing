from typing import Optional, Dict, Any
from app.services.springboot_client import springboot_client
from app.schemas.tool import ToolResult
from app.core.logging import logger

INCH_TO_CM = 2.54


async def get_size_chart(
    gender: str = "MEN",
    audience: str = "ADULT",
    category: str = "SHIRT",
    unit: str = "IN",
    **kwargs
) -> ToolResult:
    """Fetches configured authoritative size chart from Spring Boot / PostgreSQL."""
    try:
        chart = await springboot_client.get_size_chart(
            gender=gender,
            audience=audience,
            category=category,
            unit=unit
        )
        if chart:
            return ToolResult(
                success=True,
                tool_name="get_size_chart",
                status="COMPLETED",
                data=chart,
                message=f"Size guide retrieved for {gender} ({audience}) {category}."
            )
        return ToolResult(
            success=False,
            tool_name="get_size_chart",
            status="FAILED",
            message="I don't have a size chart for this category yet. Please contact customer support."
        )
    except Exception as e:
        logger.error(f"Error in get_size_chart tool: {e}")
        return ToolResult(
            success=False,
            tool_name="get_size_chart",
            status="FAILED",
            error=str(e),
            message="Could not load the size chart right now."
        )


async def get_product_size_chart(
    product_id: int,
    unit: str = "IN",
    **kwargs
) -> ToolResult:
    """Fetches product-specific or product-aware size guide."""
    try:
        chart = await springboot_client.get_product_size_chart(product_id=product_id, unit=unit)
        if chart:
            return ToolResult(
                success=True,
                tool_name="get_product_size_chart",
                status="COMPLETED",
                data=chart,
                message=f"Retrieved size guide for product #{product_id}."
            )
        return ToolResult(
            success=False,
            tool_name="get_product_size_chart",
            status="FAILED",
            message=f"I don't have a specific size chart for product #{product_id} yet."
        )
    except Exception as e:
        logger.error(f"Error in get_product_size_chart tool: {e}")
        return ToolResult(
            success=False,
            tool_name="get_product_size_chart",
            status="FAILED",
            error=str(e),
            message="Could not load product size guide."
        )


async def get_size_recommendation(
    measurements: Dict[str, float],
    product_id: Optional[int] = None,
    gender: Optional[str] = "MEN",
    audience: Optional[str] = "ADULT",
    category: Optional[str] = "SHIRT",
    unit: str = "IN",
    **kwargs
) -> ToolResult:
    """Calculates size recommendation based strictly on Spring Boot PostgreSQL ranges."""
    try:
        rec = await springboot_client.recommend_size(
            product_id=product_id,
            gender=gender,
            audience=audience,
            category=category,
            measurements=measurements,
            unit=unit
        )
        if rec and rec.get("recommendedSize"):
            return ToolResult(
                success=True,
                tool_name="get_size_recommendation",
                status="COMPLETED",
                data=rec,
                message=f"Recommended size: {rec.get('recommendedSize')} based on configured size ranges."
            )
        return ToolResult(
            success=False,
            tool_name="get_size_recommendation",
            status="FAILED",
            message="Could not calculate size recommendation with the provided measurements."
        )
    except Exception as e:
        logger.error(f"Error in get_size_recommendation tool: {e}")
        return ToolResult(
            success=False,
            tool_name="get_size_recommendation",
            status="FAILED",
            error=str(e),
            message="Could not calculate size recommendation."
        )


async def convert_size_measurement(
    value: float,
    from_unit: str = "IN",
    to_unit: str = "CM",
    **kwargs
) -> ToolResult:
    """Accurately converts measurement between inches and centimeters."""
    from_u = from_unit.upper().strip()
    to_u = to_unit.upper().strip()
    if from_u == to_u:
        converted = value
    elif from_u == "IN" and to_u == "CM":
        converted = round(value * INCH_TO_CM, 1)
    elif from_u == "CM" and to_u == "IN":
        converted = round(value / INCH_TO_CM, 1)
    else:
        converted = value

    return ToolResult(
        success=True,
        tool_name="convert_size_measurement",
        status="COMPLETED",
        data={
            "originalValue": value,
            "fromUnit": from_u,
            "convertedValue": converted,
            "toUnit": to_u
        },
        message=f"{value} {from_u} is approximately {converted} {to_u}."
    )
