from app.services.rag_service import rag_service
from app.schemas.tool import ToolResult


async def search_knowledge_base(query: str, **kwargs) -> ToolResult:
    """Searches official store policies, shipping guides, return terms, and FAQs."""
    try:
        docs = await rag_service.search_knowledge_base(query, top_k=2)
        citations = rag_service.extract_sources(docs)

        if docs:
            combined_text = "\n\n".join(d["content"] for d in docs)
            return ToolResult(
                success=True,
                tool_name="search_knowledge_base",
                status="COMPLETED",
                data={
                    "content": combined_text,
                    "sources": [c.model_dump() for c in citations]
                },
                message=combined_text
            )
        return ToolResult(
            success=False,
            tool_name="search_knowledge_base",
            status="FAILED",
            message="I don't have enough verified store policy information to answer that accurately."
        )
    except Exception as e:
        return ToolResult(
            success=False,
            tool_name="search_knowledge_base",
            status="FAILED",
            error=str(e),
            message="Could not search store documentation."
        )
