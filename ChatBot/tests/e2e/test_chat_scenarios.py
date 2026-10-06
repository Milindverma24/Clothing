import pytest
from app.agent.agent import commerce_agent
from app.schemas.chat import ChatRequest
from app.core.security import AuthenticationContext
from app.db.database import AsyncSessionLocal, init_db
from app.core.constants import MessageType, IntentType


@pytest.mark.asyncio
async def test_e2e_policy_rag():
    await init_db()
    async with AsyncSessionLocal() as db:
        guest = AuthenticationContext(authenticated=False)
        req = ChatRequest(message="What is your return policy?")
        res = await commerce_agent.process_chat(req, guest, db)

        assert res.message != ""
        assert res.intent in [IntentType.RETURN_POLICY, IntentType.POLICY_QUESTION]
        assert len(res.sources) > 0
        assert "7-day" in res.message or "return" in res.message.lower()


@pytest.mark.asyncio
async def test_e2e_product_search():
    await init_db()
    async with AsyncSessionLocal() as db:
        guest = AuthenticationContext(authenticated=False)
        req = ChatRequest(message="Show me black shirts under 2000")
        res = await commerce_agent.process_chat(req, guest, db)

        assert res.message != ""
        assert res.intent == IntentType.PRODUCT_SEARCH
        assert res.type in [MessageType.PRODUCT_LIST, MessageType.TEXT]


@pytest.mark.asyncio
async def test_e2e_human_escalation():
    await init_db()
    async with AsyncSessionLocal() as db:
        guest = AuthenticationContext(authenticated=False)
        req = ChatRequest(message="I want to talk to customer care")
        res = await commerce_agent.process_chat(req, guest, db)

        assert res.type == MessageType.ESCALATION
        assert res.intent == IntentType.HUMAN_SUPPORT
