import pytest
from app.services.springboot_client import springboot_client


@pytest.mark.asyncio
async def test_springboot_product_search():
    # Tests live connectivity to Spring Boot on port 8080
    products = await springboot_client.search_products(query="shirt", limit=3)
    assert isinstance(products, list)
    if products:
        assert products[0].id is not None
        assert products[0].name != ""
