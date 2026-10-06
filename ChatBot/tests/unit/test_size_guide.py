import pytest
from unittest.mock import AsyncMock, patch
from app.agent.intent import intent_detector
from app.core.constants import IntentType
from app.agent.planner import planner
from app.tools.size_tools import (
    get_size_chart,
    get_product_size_chart,
    get_size_recommendation,
    convert_size_measurement
)
from app.schemas.chat import PageContext


def test_intent_size_guide_phrases():
    phrases = [
        "What size should I buy?",
        "Show size chart",
        "What is the size?",
        "Size guide",
        "Which size is M?",
        "Help me choose a size",
        "Find my size",
        "What size am I?",
        "What size should I get?"
    ]
    for p in phrases:
        res = intent_detector.detect(p)
        assert res.intent == IntentType.SIZE_GUIDE, f"Failed for phrase: {p}"
        assert res.confidence >= 0.9


def test_intent_size_measurements_extraction():
    res = intent_detector.detect("My chest is 39 inches")
    assert res.intent == IntentType.SIZE_GUIDE
    assert "measurements" in res.entities
    assert res.entities["measurements"].get("chest") == 39.0
    assert res.entities.get("unit") == "IN"

    res_waist = intent_detector.detect("Waist is 32 cm")
    assert res_waist.intent == IntentType.SIZE_GUIDE
    assert res_waist.entities["measurements"].get("waist") == 32.0
    assert res_waist.entities.get("unit") == "CM"


def test_planner_size_guide_conversational_and_recommendation():
    # 1. Generic question without gender: no tool step, initiates prompt
    plan1 = planner.plan(intent=IntentType.SIZE_GUIDE, entities={})
    assert len(plan1.steps) == 0

    # 2. Gender and audience known: plans get_size_chart
    plan2 = planner.plan(intent=IntentType.SIZE_GUIDE, entities={
        "size_gender": "MEN",
        "size_audience": "ADULT",
        "size_category": "SHIRT"
    })
    assert len(plan2.steps) == 1
    assert plan2.steps[0].tool_name == "get_size_chart"
    assert plan2.steps[0].arguments["gender"] == "MEN"

    # 3. Measurements provided: plans get_size_recommendation
    plan3 = planner.plan(intent=IntentType.SIZE_GUIDE, entities={
        "measurements": {"chest": 39.0},
        "size_gender": "MEN",
        "size_audience": "ADULT",
        "size_category": "SHIRT",
        "unit": "IN"
    })
    assert len(plan3.steps) == 1
    assert plan3.steps[0].tool_name == "get_size_recommendation"
    assert plan3.steps[0].arguments["measurements"] == {"chest": 39.0}

    # 4. Product page context: plans get_product_size_chart
    ctx = PageContext(page="PRODUCT_DETAIL", product_id=123)
    plan4 = planner.plan(intent=IntentType.SIZE_GUIDE, entities={}, context=ctx)
    assert len(plan4.steps) == 1
    assert plan4.steps[0].tool_name == "get_product_size_chart"
    assert plan4.steps[0].arguments["product_id"] == 123


@pytest.mark.asyncio
async def test_convert_size_measurement():
    res = await convert_size_measurement(value=38.0, from_unit="IN", to_unit="CM")
    assert res.success is True
    # 38 * 2.54 = 96.52 -> 96.5
    assert res.data["convertedValue"] == 96.5
    assert res.data["toUnit"] == "CM"


@pytest.mark.asyncio
async def test_get_size_chart_tool_mock():
    mock_chart = {
        "id": 1,
        "name": "Men's Shirts & Tops Size Guide",
        "gender": "MEN",
        "audience": "ADULT",
        "category": "SHIRT",
        "unit": "IN",
        "entries": [
            {"size": "M", "chestMin": 38.0, "chestMax": 40.0}
        ]
    }
    with patch("app.services.springboot_client.springboot_client.get_size_chart", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_chart
        res = await get_size_chart(gender="MEN", audience="ADULT", category="SHIRT", unit="IN")
        assert res.success is True
        assert res.data["name"] == "Men's Shirts & Tops Size Guide"
