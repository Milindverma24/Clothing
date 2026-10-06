from typing import Generic, TypeVar, Optional, List, Any
from pydantic import BaseModel, Field

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = "Success"
    data: Optional[T] = None
    error: Optional[dict] = None


class PaginationMeta(BaseModel):
    page: int = 0
    size: int = 20
    total_elements: int = 0
    total_pages: int = 0
    last: bool = True


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T] = Field(default_factory=list)
    meta: PaginationMeta
