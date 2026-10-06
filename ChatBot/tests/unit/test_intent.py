import pytest
from app.agent.intent import intent_detector
from app.core.constants import IntentType


def test_intent_product_search_with_price():
    result = intent_detector.detect("Show me black shirts under 1500")
    assert result.intent == IntentType.PRODUCT_SEARCH
    assert result.entities.get("color") == "Black"
    assert result.entities.get("max_price") == 1500.0


def test_intent_order_cancel():
    result = intent_detector.detect("I want to cancel order #98231")
    assert result.intent == IntentType.ORDER_CANCEL
    assert result.entities.get("order_id") == 98231


def test_intent_policy_question():
    result = intent_detector.detect("What is your return policy?")
    assert result.intent in [IntentType.RETURN_POLICY, IntentType.POLICY_QUESTION]


def test_intent_human_support():
    result = intent_detector.detect("I want to speak with a human support executive")
    assert result.intent == IntentType.HUMAN_SUPPORT


def test_intent_price_parsing_variations():
    res1 = intent_detector.detect("blue t-shirt below 2k")
    assert res1.entities.get("max_price") == 2000.0

    res2 = intent_detector.detect("shoes 3000 ke andar")
    assert res2.entities.get("max_price") == 3000.0


def test_intent_show_order():
    res1 = intent_detector.detect("Show order #ORD-10294")
    assert res1.intent == IntentType.ORDER_STATUS
    assert res1.entities.get("order_number") == "ORD-10294"

    res2 = intent_detector.detect("SHOW_ORDER_ORD-10294")
    assert res2.intent == IntentType.ORDER_STATUS
    assert res2.entities.get("order_number") == "ORD-10294"


def test_intent_return_order():
    res = intent_detector.detect("return order ORD-10294")
    assert res.intent in [IntentType.ORDER_RETURN_REFUND, IntentType.RETURN_REQUEST]
    assert res.entities.get("order_number") == "ORD-10294"


def test_intent_track_order():
    res = intent_detector.detect("track order")
    assert res.intent == IntentType.ORDER_TRACKING
