from typing import Optional, List
from pydantic import BaseModel, Field


class OrderItemDTO(BaseModel):
    id: Optional[int] = None
    productId: Optional[int] = None
    productName: Optional[str] = None
    name: Optional[str] = None
    productImageUrl: Optional[str] = None
    imageUrl: Optional[str] = None
    image: Optional[str] = None
    size: Optional[str] = None
    color: Optional[str] = None
    quantity: int = 1
    unitPrice: Optional[float] = 0.0
    price: Optional[float] = 0.0
    totalPrice: Optional[float] = None
    finalPrice: Optional[float] = None


class OrderDTO(BaseModel):
    id: int
    orderNumber: str
    status: str  # PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED, RETURNED, REFUNDED
    totalAmount: float
    shippingFee: Optional[float] = 0.0
    placedAt: Optional[str] = None
    trackingNumber: Optional[str] = None
    returnStatus: Optional[str] = None
    approvalType: Optional[str] = None
    refundAmount: Optional[float] = None
    refundUpiId: Optional[str] = None
    refundReference: Optional[str] = None
    returnTrackingNumber: Optional[str] = None
    pickupDate: Optional[str] = None
    pickupAddress: Optional[str] = None
    canCancel: bool = False
    canReturn: bool = False
    items: List[OrderItemDTO] = Field(default_factory=list)


class CancellationEligibilityDTO(BaseModel):
    orderId: int
    eligible: bool
    status: str
    reason: Optional[str] = None
    totalRefundAmount: Optional[float] = None


class ReturnRequestDTO(BaseModel):
    orderId: int
    productId: int
    reason: str
    comments: Optional[str] = None
