from typing import Optional, List
from pydantic import BaseModel, Field


class VariantDTO(BaseModel):
    id: int
    sku: Optional[str] = None
    size: str
    color: Optional[str] = None
    price: float
    stock: int = 0
    status: str = "ACTIVE"


class ProductImageDTO(BaseModel):
    id: Optional[int] = None
    imageUrl: str
    sortOrder: int = 0


class ProductDTO(BaseModel):
    id: int
    externalProductId: Optional[int] = None
    name: str
    slug: Optional[str] = None
    description: Optional[str] = None
    gender: Optional[str] = None
    masterCategory: Optional[str] = None
    subCategory: Optional[str] = None
    articleType: Optional[str] = None
    baseColour: Optional[str] = None
    season: Optional[str] = None
    usageCategory: Optional[str] = None
    basePrice: float
    compareAtPrice: Optional[float] = None
    status: str = "ACTIVE"
    badge: Optional[str] = None
    imageUrl: Optional[str] = None
    images: List[str] = Field(default_factory=list)
    availableSizes: List[str] = Field(default_factory=list)
    variants: List[VariantDTO] = Field(default_factory=list)
    inventory: Optional[int] = None


class ProductSearchCriteria(BaseModel):
    query: Optional[str] = None
    category: Optional[str] = None
    article_type: Optional[str] = None
    color: Optional[str] = None
    gender: Optional[str] = None
    size: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    limit: int = 10
