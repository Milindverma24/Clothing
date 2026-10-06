package com.clothing.service;

import com.clothing.dto.CouponValidationRequest;
import com.clothing.dto.CouponValidationResponse;
import com.clothing.dto.ReturnOrderRequest;
import com.clothing.entity.Order;
import com.clothing.entity.OrderItem;
import com.clothing.entity.Product;
import com.clothing.entity.ProductVariant;
import com.clothing.entity.User;
import com.clothing.entity.UserNotification;
import com.clothing.exception.ApiException;
import com.clothing.repository.OrderRepository;
import com.clothing.repository.ProductRepository;
import com.clothing.repository.UserNotificationRepository;
import com.clothing.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class CustomerOrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final UserNotificationRepository notificationRepository;
    private final CouponService couponService;

    public CustomerOrderService(
        OrderRepository orderRepository,
        UserRepository userRepository,
        ProductRepository productRepository,
        UserNotificationRepository notificationRepository,
        CouponService couponService
    ) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.notificationRepository = notificationRepository;
        this.couponService = couponService;
    }

    @Transactional(readOnly = true)
    public List<Order> getUserOrders(Long userId) {
        return orderRepository.findAllByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public List<Order> getAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public Order getOrderDetails(Long userId, Long orderId) {
        return orderRepository.findByIdAndUserId(orderId, userId)
            .orElseThrow(() -> new ApiException("Order not found or access denied"));
    }

    @Transactional(readOnly = true)
    public Order getOrderById(Long orderId) {
        return orderRepository.findById(orderId)
            .orElseThrow(() -> new ApiException("Order not found"));
    }

    @Transactional(readOnly = true)
    public Order findOrderByIdOrReference(String idOrReference) {
        if (idOrReference == null || idOrReference.isBlank()) {
            throw new ApiException("Order identifier is required");
        }
        String search = idOrReference.trim();
        try {
            Long numericId = Long.parseLong(search);
            java.util.Optional<Order> byId = orderRepository.findById(numericId);
            if (byId.isPresent()) {
                return byId.get();
            }
        } catch (NumberFormatException ignored) {}

        return orderRepository.findByOrderNumber(search)
            .or(() -> orderRepository.findByTrackingNumber(search))
            .orElseThrow(() -> new ApiException("Order not found with reference: " + search));
    }

    @Transactional
    public Order updateOrderStatus(Long orderId, String newStatus) {
        return updateOrderStatus(String.valueOf(orderId), newStatus);
    }

    @Transactional
    public Order updateOrderStatus(String idOrOrderNumber, String newStatus) {
        Order order = findOrderByIdOrReference(idOrOrderNumber);
        String cleanStatus = newStatus.trim().toUpperCase();
        order.setStatus(cleanStatus);
        order = orderRepository.save(order);

        if (order.getUser() != null) {
            notificationRepository.save(new UserNotification(
                order.getUser(),
                "Order Status Updated #" + order.getOrderNumber(),
                "Your order status is now: " + cleanStatus,
                "ORDER",
                "/account/orders/" + order.getId()
            ));
        }

        return order;
    }

    @Transactional
    public Order updateOrderReturnStatus(Long orderId, String newReturnStatus) {
        return updateOrderReturnStatus(String.valueOf(orderId), newReturnStatus);
    }

    @Transactional
    public Order updateOrderReturnStatus(String idOrOrderNumber, String newReturnStatus) {
        Order order = findOrderByIdOrReference(idOrOrderNumber);

        String cleanStatus = newReturnStatus.trim().toUpperCase();
        order.setReturnStatus(cleanStatus);

        if ("APPROVED".equalsIgnoreCase(cleanStatus) || "RETURNED".equalsIgnoreCase(cleanStatus) || "REFUNDED".equalsIgnoreCase(cleanStatus)) {
            order.setStatus(cleanStatus.equalsIgnoreCase("APPROVED") ? "RETURNED" : cleanStatus);
            if ("ADMIN_PENDING".equalsIgnoreCase(order.getApprovalType()) || "NONE".equalsIgnoreCase(order.getApprovalType()) || order.getApprovalType() == null) {
                order.setApprovalType("ADMIN_APPROVED");
            }
            if (order.getRefundReference() == null || order.getRefundReference().startsWith("RF-PENDING")) {
                order.setRefundReference("RF-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            }
            if (order.getReturnTrackingNumber() == null || order.getReturnTrackingNumber().startsWith("RET-PENDING")) {
                order.setReturnTrackingNumber("RET-TRK-" + (System.currentTimeMillis() % 1000000));
            }
        } else if ("REJECTED".equalsIgnoreCase(cleanStatus)) {
            order.setApprovalType("REJECTED");
        }

        order = orderRepository.save(order);

        if (order.getUser() != null) {
            notificationRepository.save(new UserNotification(
                order.getUser(),
                "Return Request Update #" + order.getOrderNumber(),
                "Your return status for order #" + order.getOrderNumber() + " has been updated to: " + cleanStatus + (order.getRefundReference() != null ? " (Refund Ref: " + order.getRefundReference() + ")" : ""),
                "ORDER",
                "/account/orders/" + order.getId()
            ));
        }

        return order;
    }

    @Transactional(readOnly = true)
    public Order trackOrderByNumber(String trackingOrOrderNumber) {
        return orderRepository.findByTrackingNumber(trackingOrOrderNumber.trim())
            .or(() -> orderRepository.findByOrderNumber(trackingOrOrderNumber.trim()))
            .orElseThrow(() -> new ApiException("No order found with tracking or order number: " + trackingOrOrderNumber));
    }

    @Transactional
    public Order requestReturn(Long userId, Long orderId, ReturnOrderRequest request) {
        Order order = (orderId != null)
            ? orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new ApiException("Order not found or access denied"))
            : (request.getTrackingOrOrderNumber() != null
                ? orderRepository.findByTrackingNumberAndUserId(request.getTrackingOrOrderNumber().trim(), userId)
                    .or(() -> orderRepository.findByOrderNumberAndUserId(request.getTrackingOrOrderNumber().trim(), userId))
                    .orElseThrow(() -> new ApiException("No order found matching " + request.getTrackingOrOrderNumber() + " on your account"))
                : null);

        if (order == null) {
            throw new ApiException("Order reference is required to initiate a return");
        }

        if (!"DELIVERED".equalsIgnoreCase(order.getStatus()) && !"CONFIRMED".equalsIgnoreCase(order.getStatus()) && !"SHIPPED".equalsIgnoreCase(order.getStatus())) {
            throw new ApiException("Order is not currently eligible for return request (Status: " + order.getStatus() + ")");
        }

        // 1. Enforce 14-day return window in code
        if (order.getCreatedAt() != null && order.getCreatedAt().isBefore(LocalDateTime.now().minusDays(14))) {
            throw new ApiException("Return window has expired. Orders can only be returned within 14 days of purchase.");
        }

        // 2. Validate non-returnable categories (hygiene, sleepwear, intimate apparel)
        if (order.getItems() != null && !order.getItems().isEmpty()) {
            boolean hasNonReturnable = order.getItems().stream().anyMatch(item -> {
                String name = item.getProductName() != null ? item.getProductName().toLowerCase() : "";
                return name.contains("sleep") || name.contains("intimate") || name.contains("mask");
            });
            if (hasNonReturnable && order.getItems().size() == 1) {
                throw new ApiException("This item is marked non-returnable due to intimate garment and hygiene policies.");
            }
        }

        // 3. Validate UPI ID format if provided
        if (request.getUpiId() != null && !request.getUpiId().isBlank()) {
            String cleanUpi = request.getUpiId().trim();
            if (!cleanUpi.matches("^[\\w.-]+@[\\w.-]+$")) {
                throw new ApiException("Invalid UPI ID format. Please provide a valid UPI ID like username@bank or mobile@upi.");
            }
            order.setRefundUpiId(cleanUpi);
        }

        // 4. Compute refund amount
        BigDecimal refundAmt = (request.getRefundAmount() != null && request.getRefundAmount().compareTo(BigDecimal.ZERO) > 0)
            ? request.getRefundAmount()
            : (order.getTotal() != null ? order.getTotal() : BigDecimal.ZERO);
        order.setRefundAmount(refundAmt);

        order.setReturnReason(request.getReason());
        order.setReturnComment(request.getComment());
        if (request.getReturnSource() != null && !request.getReturnSource().isBlank()) {
            order.setReturnSource(request.getReturnSource().trim());
        } else {
            order.setReturnSource("WEB_PORTAL");
        }

        // 5. Pickup address and schedule
        if (request.getPickupAddress() != null && !request.getPickupAddress().isBlank()) {
            order.setPickupAddress(request.getPickupAddress().trim());
        } else {
            order.setPickupAddress(order.getShippingAddress() != null ? order.getShippingAddress() : "Customer Address on File");
        }

        if (request.getPickupDate() != null) {
            order.setPickupDate(request.getPickupDate());
        } else {
            order.setPickupDate(LocalDateTime.now().plusDays(1).withHour(11).withMinute(0));
        }

        // 6. Hard safety check: Enforce ₹5,000 threshold in plain code
        BigDecimal THRESHOLD = new BigDecimal("5000.00");
        if (refundAmt.compareTo(THRESHOLD) <= 0) {
            order.setReturnStatus("APPROVED");
            order.setApprovalType("AUTONOMOUS");
            order.setRefundReference("RF-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            order.setReturnTrackingNumber("RET-TRK-" + (System.currentTimeMillis() % 1000000));

            notificationRepository.save(new UserNotification(
                order.getUser(),
                "Return & Refund Approved",
                "Your return for Order #" + order.getOrderNumber() + " has been autonomously approved! Refund of ₹" + refundAmt + " will be credited to " + (order.getRefundUpiId() != null ? order.getRefundUpiId() : "original payment method") + ". Courier pickup scheduled.",
                "ORDER",
                "/account/orders/" + order.getId()
            ));
        } else {
            order.setReturnStatus("AWAITING_APPROVAL");
            order.setApprovalType("ADMIN_PENDING");
            order.setRefundReference("RF-PENDING-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
            order.setReturnTrackingNumber("RET-PENDING-" + (System.currentTimeMillis() % 1000000));

            notificationRepository.save(new UserNotification(
                order.getUser(),
                "Return Under Atelier Review",
                "Your return request of ₹" + refundAmt + " for Order #" + order.getOrderNumber() + " has been received and routed to our supervisor team for high-value authorization.",
                "ORDER",
                "/account/orders/" + order.getId()
            ));
        }

        return orderRepository.save(order);
    }

    @Transactional
    public Order requestReturnByTrackingOrOrder(Long userId, String trackingOrOrderNumber, ReturnOrderRequest request) {
        if (trackingOrOrderNumber == null || trackingOrOrderNumber.isBlank()) {
            throw new ApiException("Tracking number or order number is required");
        }
        request.setTrackingOrOrderNumber(trackingOrOrderNumber.trim());
        return requestReturn(userId, null, request);
    }

    @Transactional
    public Order adminApproveReturn(Long orderId) {
        return adminApproveReturn(String.valueOf(orderId));
    }

    @Transactional
    public Order adminApproveReturn(String idOrOrderNumber) {
        Order order = findOrderByIdOrReference(idOrOrderNumber);
        order.setReturnStatus("APPROVED");
        order.setApprovalType("ADMIN_APPROVED");
        order.setStatus("RETURNED");
        if (order.getRefundReference() == null || order.getRefundReference().startsWith("RF-PENDING")) {
            order.setRefundReference("RF-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }
        if (order.getReturnTrackingNumber() == null || order.getReturnTrackingNumber().startsWith("RET-PENDING")) {
            order.setReturnTrackingNumber("RET-TRK-" + (System.currentTimeMillis() % 1000000));
        }
        order = orderRepository.save(order);

        if (order.getUser() != null) {
            notificationRepository.save(new UserNotification(
                order.getUser(),
                "Return & Refund Authorized #" + order.getOrderNumber(),
                "Your return request for Order #" + order.getOrderNumber() + " has been approved! Refund of ₹" + (order.getRefundAmount() != null ? order.getRefundAmount() : order.getTotal()) + " is authorized (Refund Ref: " + order.getRefundReference() + "). Courier pickup tracking: " + order.getReturnTrackingNumber() + ".",
                "ORDER",
                "/account/orders/" + order.getId()
            ));
        }

        return order;
    }

    @Transactional
    public Order adminRejectReturn(Long orderId, String rejectionReason) {
        return adminRejectReturn(String.valueOf(orderId), rejectionReason);
    }

    @Transactional
    public Order adminRejectReturn(String idOrOrderNumber, String rejectionReason) {
        Order order = findOrderByIdOrReference(idOrOrderNumber);
        order.setReturnStatus("REJECTED");
        order.setApprovalType("REJECTED");
        String note = rejectionReason != null && !rejectionReason.isBlank() ? rejectionReason.trim() : "Return policy requirements not met";
        order.setReturnComment((order.getReturnComment() != null ? order.getReturnComment() + " | " : "") + "Rejected by admin: " + note);
        order = orderRepository.save(order);

        if (order.getUser() != null) {
            notificationRepository.save(new UserNotification(
                order.getUser(),
                "Return Request Not Approved #" + order.getOrderNumber(),
                "Your return request for Order #" + order.getOrderNumber() + " was not approved. Reason: " + note,
                "ORDER",
                "/account/orders/" + order.getId()
            ));
        }

        return order;
    }

    @Transactional
    public Order createOrderForUser(Long userId, Map<String, Object> payload) {
        if (userId == null) {
            throw new ApiException("Authentication required. Please sign in to place an order.");
        }
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ApiException("User account not found"));

        Order order = new Order();
        order.setUser(user);
        order.setOrderNumber("ORD-" + (System.currentTimeMillis() % 1000000));
        order.setCustomerName((String) payload.getOrDefault("name", user != null ? user.getFullName() : "Customer"));
        order.setCustomerEmail((String) payload.getOrDefault("email", user != null ? user.getEmail() : "guest@example.com"));
        order.setCustomerPhone((String) payload.getOrDefault("phone", user != null ? user.getPhone() : ""));
        order.setShippingAddress((String) payload.getOrDefault("address", ""));
        order.setCity((String) payload.getOrDefault("city", ""));
        order.setState((String) payload.getOrDefault("state", ""));
        order.setPostalCode((String) payload.getOrDefault("postalCode", ""));
        order.setCountry((String) payload.getOrDefault("country", "India"));
        order.setPaymentMethod((String) payload.getOrDefault("paymentMethod", "UPI"));
        order.setCouponCode((String) payload.get("couponCode"));
        order.setOrderSource((String) payload.getOrDefault("orderSource", "STOREFRONT"));
        order.setStatus("CONFIRMED");
        order.setTrackingNumber("TRK-" + (100000000L + (long)(Math.random() * 899999999L)));
        order.setCarrier("BlueDart Express");
        order.setEstimatedDelivery(LocalDateTime.now().plusDays(4));
        order.setCreatedAt(LocalDateTime.now());

        // Process items
        List<Map<String, Object>> rawItems = (List<Map<String, Object>>) payload.get("items");
        BigDecimal subtotal = BigDecimal.ZERO;

        if (rawItems != null) {
            for (Map<String, Object> rawItem : rawItems) {
                Long productId = Long.valueOf(rawItem.get("productId").toString());
                int qty = Integer.parseInt(rawItem.getOrDefault("quantity", 1).toString());
                String size = (String) rawItem.getOrDefault("size", "M");
                String color = (String) rawItem.getOrDefault("color", "Black");

                Product product = productRepository.findById(productId)
                    .or(() -> productRepository.findByExternalProductId(productId))
                    .orElse(null);

                BigDecimal price = product != null ? product.getBasePrice() : new BigDecimal(1499);
                BigDecimal itemTotal = price.multiply(BigDecimal.valueOf(qty));
                subtotal = subtotal.add(itemTotal);

                // Variant inventory stock decrement
                if (product != null && product.getVariants() != null && !product.getVariants().isEmpty()) {
                    ProductVariant matchedVariant = product.getVariants().stream()
                        .filter(v -> size.equalsIgnoreCase(v.getSize()))
                        .findFirst()
                        .orElse(product.getVariants().get(0));

                    if (matchedVariant != null) {
                        int stock = matchedVariant.getStock() != null ? matchedVariant.getStock() : 0;
                        if (stock >= qty) {
                            matchedVariant.setStock(stock - qty);
                            if (matchedVariant.getStock() == 0) {
                                matchedVariant.setStatus("OUT_OF_STOCK");
                            }
                        }
                    }
                }

                // Image snapshotting
                String itemImageUrl = null;
                if (rawItem.containsKey("imageUrl") && rawItem.get("imageUrl") != null && !rawItem.get("imageUrl").toString().isBlank()) {
                    itemImageUrl = rawItem.get("imageUrl").toString();
                } else if (rawItem.containsKey("image") && rawItem.get("image") != null && !rawItem.get("image").toString().isBlank()) {
                    itemImageUrl = rawItem.get("image").toString();
                } else if (product != null && product.getImages() != null && !product.getImages().isEmpty()) {
                    itemImageUrl = product.getImages().get(0).getImageUrl();
                } else {
                    itemImageUrl = "/images/" + productId + ".jpg";
                }

                OrderItem oi = new OrderItem();
                oi.setOrder(order);
                oi.setProductId(productId);
                oi.setProductName(product != null ? product.getName() : "Atelier Garment");
                oi.setSku("SKU-" + productId + "-" + size);
                oi.setSize(size);
                oi.setColor(color);
                oi.setQuantity(qty);
                oi.setUnitPrice(price);
                oi.setDiscount(BigDecimal.ZERO);
                oi.setFinalPrice(itemTotal);
                oi.setImageUrl(itemImageUrl);

                order.getItems().add(oi);
            }
        }

        // Real coupon validation
        BigDecimal discount = BigDecimal.ZERO;
        String couponCode = order.getCouponCode();
        if (couponCode != null && !couponCode.isBlank()) {
            CouponValidationResponse couponResp = couponService.validateCoupon(
                new CouponValidationRequest(couponCode, subtotal)
            );
            if (couponResp.isValid()) {
                discount = couponResp.getDiscountAmount();
                order.setCouponCode(couponResp.getCode());
            } else {
                order.setCouponCode(null);
            }
        }

        BigDecimal shipping = subtotal.compareTo(new BigDecimal(1499)) >= 0 ? BigDecimal.ZERO : new BigDecimal(99);
        BigDecimal total = subtotal.subtract(discount).add(shipping).max(BigDecimal.ZERO);

        order.setSubtotal(subtotal);
        order.setDiscount(discount);
        order.setShipping(shipping);
        order.setTotal(total);

        order = orderRepository.save(order);

        if (user != null) {
            notificationRepository.save(new UserNotification(
                user,
                "Order Confirmed #" + order.getOrderNumber(),
                "Thank you for your order. We are preparing your pieces for shipment with " + order.getCarrier() + ".",
                "ORDER",
                "/account/orders/" + order.getId()
            ));
        }

        return order;
    }

    @Transactional
    public Order cancelOrder(Long userId, String idOrOrderNumber) {
        if (idOrOrderNumber == null || idOrOrderNumber.isBlank()) {
            throw new ApiException("Order identifier is required");
        }

        String searchId = idOrOrderNumber.trim();
        Order order = null;

        // Try numeric ID first
        try {
            Long numericId = Long.parseLong(searchId);
            order = orderRepository.findByIdAndUserId(numericId, userId).orElse(null);
        } catch (NumberFormatException ignored) {}

        // If not found by numeric ID, try finding by order number or tracking number
        if (order == null) {
            order = orderRepository.findByOrderNumber(searchId)
                .or(() -> orderRepository.findByTrackingNumber(searchId))
                .filter(o -> o.getUser() != null && o.getUser().getId().equals(userId))
                .orElse(null);
        }

        if (order == null) {
            throw new ApiException("Order not found or does not belong to you: " + searchId);
        }

        String currentStatus = order.getStatus() != null ? order.getStatus().trim().toUpperCase() : "";
        if ("CANCELLED".equals(currentStatus)) {
            throw new ApiException("Order #" + order.getOrderNumber() + " has already been cancelled.");
        }

        if (!"PENDING".equals(currentStatus) && !"PROCESSING".equals(currentStatus) && !"CONFIRMED".equals(currentStatus)) {
            throw new ApiException("Order cannot be cancelled. Current status is " + currentStatus);
        }

        // Enforce 14-day policy on cancellation
        if (order.getCreatedAt() != null && order.getCreatedAt().isBefore(LocalDateTime.now().minusDays(14))) {
            throw new ApiException("Cancellation window has expired. Orders can only be cancelled within 14 days of purchase.");
        }

        order.setStatus("CANCELLED");
        order = orderRepository.save(order);

        if (order.getUser() != null) {
            notificationRepository.save(new UserNotification(
                order.getUser(),
                "Order Cancelled #" + order.getOrderNumber(),
                "Your order #" + order.getOrderNumber() + " has been successfully cancelled.",
                "ORDER",
                "/account/orders/" + order.getId()
            ));
        }

        return order;
    }

    @Transactional(readOnly = true)
    public List<Order> getTrackableOrders(Long userId) {
        List<Order> all = orderRepository.findAllByUserIdOrderByCreatedAtDesc(userId);
        LocalDateTime fourteenDaysAgo = LocalDateTime.now().minusDays(14);
        return all.stream().filter(o -> {
            String st = o.getStatus() != null ? o.getStatus().toUpperCase() : "";
            String retSt = o.getReturnStatus() != null ? o.getReturnStatus().toUpperCase() : "NONE";
            boolean within14Days = o.getCreatedAt() == null || !o.getCreatedAt().isBefore(fourteenDaysAgo);

            if (java.util.List.of("PENDING", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY").contains(st)) {
                return true;
            }
            if (!"NONE".equals(retSt) && !"COMPLETED".equals(retSt)) {
                return true;
            }
            if ("DELIVERED".equals(st) && within14Days) {
                return true;
            }
            return false;
        }).collect(java.util.stream.Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getOrderActions(Long userId, String idOrOrderNumber) {
        Order order = findUserOrder(userId, idOrOrderNumber);
        String st = order.getStatus() != null ? order.getStatus().toUpperCase() : "";
        String retSt = order.getReturnStatus() != null ? order.getReturnStatus().toUpperCase() : "NONE";
        LocalDateTime fourteenDaysAgo = LocalDateTime.now().minusDays(14);
        boolean within14Days = order.getCreatedAt() == null || !order.getCreatedAt().isBefore(fourteenDaysAgo);

        List<String> actions = new java.util.ArrayList<>();
        actions.add("TRACK_ORDER");
        actions.add("VIEW_DETAILS");

        boolean canCancel = java.util.List.of("PENDING", "CONFIRMED", "PROCESSING").contains(st) && within14Days;
        if (canCancel) {
            actions.add("CANCEL_ORDER");
        }

        boolean canReturn = java.util.List.of("DELIVERED", "SHIPPED").contains(st) && "NONE".equals(retSt) && within14Days;
        if (canReturn) {
            actions.add("RETURN_ORDER");
            actions.add("EXCHANGE_ORDER");
        }

        actions.add("CONTACT_SUPPORT");

        Map<String, Object> res = new java.util.HashMap<>();
        res.put("orderId", order.getOrderNumber());
        res.put("id", order.getId());
        res.put("status", order.getStatus());
        res.put("within14Days", within14Days);
        res.put("cancelEligible", canCancel);
        res.put("returnEligible", canReturn);
        res.put("actions", actions);
        return res;
    }

    private Order findUserOrder(Long userId, String searchId) {
        try {
            Long numericId = Long.parseLong(searchId.trim());
            java.util.Optional<Order> byId = orderRepository.findByIdAndUserId(numericId, userId);
            if (byId.isPresent()) {
                return byId.get();
            }
        } catch (NumberFormatException ignored) {}

        return orderRepository.findByOrderNumber(searchId.trim())
            .or(() -> orderRepository.findByTrackingNumber(searchId.trim()))
            .filter(o -> o.getUser() != null && o.getUser().getId().equals(userId))
            .orElseThrow(() -> new ApiException("Order not found or does not belong to you: " + searchId));
    }
}
