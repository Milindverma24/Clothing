import pytest
from unittest.mock import AsyncMock, patch
from app.tools.order_tools import order_product, track_order, show_order, cancel_order, return_order
from app.schemas.product import ProductDTO


@pytest.mark.asyncio
async def test_order_product_success():
    mock_product = ProductDTO(
        id=101,
        name="United Colors of Benetton Black Shirt",
        basePrice=1499.0,
        imageUrl="/images/101.jpg"
    )

    mock_order_res = {
        "id": 501,
        "orderNumber": "ORD-501",
        "trackingNumber": "TRK-501",
        "total": 1499.0,
        "status": "CONFIRMED",
        "carrier": "BlueDart Express"
    }

    with patch("app.services.springboot_client.springboot_client.get_product", new=AsyncMock(return_value=mock_product)), \
         patch("app.services.springboot_client.springboot_client.create_order", new=AsyncMock(return_value=mock_order_res)):

        result = await order_product(product_id=101, size="L", quantity=1, customer_token="valid_token")

        assert result.success is True
        assert result.tool_name == "order_product"
        assert "ORD-501" in result.message
        assert result.cards is not None
        assert len(result.cards) == 1
        assert result.cards[0]["card_type"] == "ORDER_CONFIRMATION"
        assert result.cards[0]["data"]["trackingNumber"] == "TRK-501"


@pytest.mark.asyncio
async def test_track_order_fetches_trackable():
    mock_trackable = [
        {
            "id": 1,
            "orderId": "ORD-10294",
            "status": "SHIPPED",
            "total": 1499.0,
            "items": [
                {
                    "productName": "Black Casual Shirt",
                    "quantity": 1,
                    "price": 1499.0,
                    "productImageUrlSnapshot": "/images/101.jpg"
                }
            ],
            "tracking": {
                "available": True,
                "carrier": "BlueDart",
                "trackingNumber": "TRK123456",
                "estimatedDeliveryDate": "2026-10-12"
            }
        }
    ]

    with patch("app.services.springboot_client.springboot_client.get_trackable_orders", new=AsyncMock(return_value=mock_trackable)):
        res = await track_order(customer_token="token_alice")
        assert res.success is True
        assert len(res.cards) == 1
        assert "ORD-10294" in res.message
        assert any("SHOW_ORDER_ORD-10294" in a["action"] for a in res.actions)


@pytest.mark.asyncio
async def test_show_order_fetches_live_state():
    mock_order_detail = {
        "id": 1,
        "orderId": "ORD-10294",
        "orderDate": "2026-10-01T14:30:00",
        "status": "SHIPPED",
        "subtotal": 1299.0,
        "shippingFee": 100.0,
        "total": 1399.0,
        "items": [
            {
                "productName": "Black Casual Shirt",
                "quantity": 1,
                "price": 1299.0,
                "productImageUrlSnapshot": "/images/101.jpg"
            }
        ],
        "tracking": {
            "available": True,
            "carrier": "Example Express",
            "trackingNumber": "TRK123456",
            "currentStatus": "IN_TRANSIT",
            "estimatedDeliveryDate": "2026-10-12"
        },
        "cancellation": {
            "eligible": False,
            "status": None
        },
        "return": {
            "eligible": True,
            "status": None,
            "daysRemaining": 8
        },
        "availableActions": [
            "TRACK_ORDER",
            "RETURN_ORDER",
            "VIEW_DETAILS",
            "CONTACT_SUPPORT"
        ]
    }

    with patch("app.services.springboot_client.springboot_client.get_raw_order_detail", new=AsyncMock(return_value=mock_order_detail)):
        res = await show_order(order_id="ORD-10294", customer_token="token_alice")
        assert res.success is True
        assert res.tool_name == "show_order"
        assert "ORD-10294" in res.message
        assert "8 days remaining" in res.message
        assert any("RETURN_ORD-10294" in a["action"] for a in res.actions)
        assert any("TRACK_ORD-10294" in a["action"] for a in res.actions)
        # Cancel order is not eligible, so it shouldn't be in actions
        assert not any("CANCEL_ORD-10294" in a["action"] for a in res.actions)


@pytest.mark.asyncio
async def test_cancel_order_success():
    cancelled_detail = {
        "id": 1,
        "orderId": "ORD-10294",
        "status": "CANCELLED",
        "total": 1399.0,
        "cancellation": {
            "status": "COMPLETED",
            "reason": "Changed my mind"
        },
        "availableActions": ["VIEW_DETAILS", "CONTACT_SUPPORT"]
    }

    with patch("app.services.springboot_client.springboot_client.cancel_order", new=AsyncMock(return_value={"orderId": "ORD-10294", "status": "CANCELLED"})), \
         patch("app.services.springboot_client.springboot_client.get_raw_order_detail", new=AsyncMock(return_value=cancelled_detail)):

        res = await cancel_order(order_id="ORD-10294", reason="Changed my mind", customer_token="token_alice")
        assert res.success is True
        assert res.tool_name == "cancel_order"
        assert "CANCELLED" in res.message
        assert res.cards[0]["subtitle"] == "CANCELLED"


@pytest.mark.asyncio
async def test_return_order_success():
    return_detail = {
        "id": 1,
        "orderId": "ORD-10294",
        "status": "RETURN_REQUESTED",
        "total": 1399.0,
        "return": {
            "status": "REQUESTED",
            "reason": "Product does not fit"
        }
    }

    with patch("app.services.springboot_client.springboot_client.request_return", new=AsyncMock(return_value={"orderId": "ORD-10294", "status": "RETURN_REQUESTED"})), \
         patch("app.services.springboot_client.springboot_client.get_raw_order_detail", new=AsyncMock(return_value=return_detail)):

        res = await return_order(order_id="ORD-10294", reason="Product does not fit", customer_token="token_alice")
        assert res.success is True
        assert res.tool_name == "return_order"
        assert "RETURN_REQUESTED" in res.message
        assert "REQUESTED" in res.message
