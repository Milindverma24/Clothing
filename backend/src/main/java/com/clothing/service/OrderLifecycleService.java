package com.clothing.service;

import com.clothing.dto.*;
import com.clothing.entity.*;
import com.clothing.exception.ApiException;
import com.clothing.exception.ResourceNotFoundException;
import com.clothing.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class OrderLifecycleService {

    private static final Logger log = LoggerFactory.getLogger(OrderLifecycleService.class);

    private final OrderRepository orderRepository;
    private final CancellationRequestRepository cancellationRequestRepository;
    private final ReturnRequestRepository returnRequestRepository;
    private final OrderAuditService auditService;
    private final IdempotencyService idempotencyService;
    private final UserNotificationRepository notificationRepository;
    private final ObjectMapper objectMapper;

    public OrderLifecycleService(
        OrderRepository orderRepository,
        CancellationRequestRepository cancellationRequestRepository,
        ReturnRequestRepository returnRequestRepository,
        OrderAuditService auditService,
        IdempotencyService idempotencyService,
        UserNotificationRepository notificationRepository,
        ObjectMapper objectMapper
    ) {
        this.orderRepository = orderRepository;
        this.cancellationRequestRepository = cancellationRequestRepository;
        this.returnRequestRepository = returnRequestRepository;
        this.auditService = auditService;
        this.idempotencyService = idempotencyService;
        this.notificationRepository = notificationRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Finds order strictly verifying customer ownership.
     * Never leaks whether an order belongs to another customer.
     */
    @Transactional(readOnly = true)
    public Order findUserOrder(Long customerId, String idOrOrderNumber) {
        if (idOrOrderNumber == null || idOrOrderNumber.isBlank() || customerId == null) {
            throw new ResourceNotFoundException("Order", "id", idOrOrderNumber);
        }

        String search = idOrOrderNumber.trim();

        // 1. Try numeric ID strictly scoped to customer
        try {
            Long numericId = Long.parseLong(search);
            Optional<Order> byNumericId = orderRepository.findByIdAndUserId(numericId, customerId);
            if (byNumericId.isPresent()) {
                return byNumericId.get();
            }
        } catch (NumberFormatException ignored) {}

        if (search.toUpperCase().startsWith("ORD-")) {
            String suffix = search.substring(4);
            try {
                Long numericId = Long.parseLong(suffix);
                Optional<Order> byNumericId = orderRepository.findByIdAndUserId(numericId, customerId);
                if (byNumericId.isPresent()) {
                    return byNumericId.get();
                }
            } catch (NumberFormatException ignored) {}

            Optional<Order> bySuffix = orderRepository.findByOrderNumberAndUserId(suffix, customerId);
            if (bySuffix.isPresent()) {
                return bySuffix.get();
            }
        }

        // 2. Try order number or tracking number strictly scoped to customer
        return orderRepository.findByOrderNumberAndUserId(search, customerId)
            .or(() -> orderRepository.findByTrackingNumberAndUserId(search, customerId))
            .or(() -> orderRepository.findByOrderNumberAndUserId("ORD-" + search, customerId))
            .orElseThrow(() -> new ResourceNotFoundException("Order", "reference", search));
    }

    /**
     * Centralized 14-day calculation from ORDER DATE / PURCHASE DATE.
     */
    public boolean isWithin14Days(LocalDateTime orderDate) {
        if (orderDate == null) return true;
        LocalDateTime returnDeadline = orderDate.plusDays(14);
        return !LocalDateTime.now().isAfter(returnDeadline);
    }

    public int calculateDaysRemaining(LocalDateTime orderDate) {
        if (orderDate == null) return 14;
        LocalDateTime returnDeadline = orderDate.plusDays(14);
        LocalDateTime now = LocalDateTime.now();
        if (now.isAfter(returnDeadline)) return 0;
        return Math.max(0, (int) ChronoUnit.DAYS.between(now.toLocalDate(), returnDeadline.toLocalDate()));
    }

    public LocalDateTime calculateReturnDeadline(LocalDateTime orderDate) {
        if (orderDate == null) return LocalDateTime.now().plusDays(14);
        return orderDate.plusDays(14);
    }

    /**
     * 1. TRACK ORDER FLOW: Fetch only trackable orders belonging to the authenticated customer.
     */
    @Transactional(readOnly = true)
    public List<MyOrderDetailDTO> getTrackableOrders(Long customerId) {
        if (customerId == null) {
            return Collections.emptyList();
        }

        LocalDateTime fourteenDaysAgo = LocalDateTime.now().minusDays(14);
        List<Order> orders = orderRepository.findTrackableOrders(customerId, fourteenDaysAgo);

        return orders.stream()
            .map(order -> mapToOrderDetail(order, customerId))
            .collect(Collectors.toList());
    }

    /**
     * 3. SHOW ORDER: Fetch latest order from database with live tracking and eligibility.
     */
    @Transactional(readOnly = true)
    public MyOrderDetailDTO getOrderDetail(Long customerId, String idOrOrderNumber) {
        Order order = findUserOrder(customerId, idOrOrderNumber);
        auditService.logMutation(customerId, order.getId(), "ORDER_VIEWED", "CUSTOMER", null, "Order details requested");
        return mapToOrderDetail(order, customerId);
    }

    /**
     * 13. ORDER ACTIONS: Calculate dynamic available actions based on live DB state.
     */
    @Transactional(readOnly = true)
    public OrderActionsResponseDTO getOrderActions(Long customerId, String idOrOrderNumber) {
        Order order = findUserOrder(customerId, idOrOrderNumber);
        String status = order.getStatus() != null ? order.getStatus().trim().toUpperCase() : "CONFIRMED";
        LocalDateTime orderDate = order.getCreatedAt() != null ? order.getCreatedAt() : LocalDateTime.now();

        boolean within14Days = isWithin14Days(orderDate);
        int daysRemaining = calculateDaysRemaining(orderDate);

        boolean hasCompletedCancellation = cancellationRequestRepository
            .existsByOrderIdAndCustomerIdAndStatusIn(order.getId(), customerId, List.of("COMPLETED", "APPROVED"));
        boolean hasActiveCancellation = cancellationRequestRepository
            .existsByOrderIdAndCustomerIdAndStatusIn(order.getId(), customerId, List.of("REQUESTED", "PROCESSING"));
        boolean hasActiveReturn = returnRequestRepository
            .existsByOrderIdAndCustomerIdAndStatusIn(order.getId(), customerId,
                List.of("REQUESTED", "APPROVED", "PICKUP_SCHEDULED", "PICKED_UP", "PROCESSING", "COMPLETED"));

        List<OrderActionItemDTO> actions = new ArrayList<>();

        // TRACK_ORDER
        boolean canTrack = !"CANCELLED".equals(status);
        actions.add(new OrderActionItemDTO("TRACK_ORDER", canTrack, canTrack ? null : "Order is cancelled", null));

        // CANCEL_ORDER
        boolean statusAllowsCancel = List.of("PENDING", "CONFIRMED", "PROCESSING").contains(status);
        boolean canCancel = statusAllowsCancel && within14Days && !hasCompletedCancellation && !hasActiveCancellation && !hasActiveReturn;
        String cancelReason = null;
        if (!statusAllowsCancel) {
            cancelReason = "CANCELLED".equals(status) ? "Order is already cancelled" : "Order has already been processed or shipped";
        } else if (!within14Days) {
            cancelReason = "Cancellation window (14 days) has expired";
        } else if (hasCompletedCancellation || hasActiveCancellation) {
            cancelReason = "Cancellation has already been initiated";
        } else if (hasActiveReturn) {
            cancelReason = "Return workflow is already in progress";
        }
        actions.add(new OrderActionItemDTO("CANCEL_ORDER", canCancel, canCancel ? null : cancelReason, null));

        // RETURN_ORDER
        boolean statusAllowsReturn = List.of("DELIVERED", "SHIPPED").contains(status);
        boolean canReturn = statusAllowsReturn && within14Days && !hasActiveReturn && !"CANCELLED".equals(status);
        String returnReason = null;
        if (!statusAllowsReturn) {
            returnReason = "Order must be delivered before initiating a return";
        } else if (!within14Days) {
            returnReason = "The 14-day return window has expired";
        } else if (hasActiveReturn) {
            returnReason = "Return request has already been submitted";
        } else if ("CANCELLED".equals(status)) {
            returnReason = "Cancelled orders cannot be returned";
        }
        actions.add(new OrderActionItemDTO("RETURN_ORDER", canReturn, canReturn ? null : returnReason, within14Days ? daysRemaining : 0));

        // VIEW_DETAILS
        actions.add(new OrderActionItemDTO("VIEW_DETAILS", true));

        // CONTACT_SUPPORT
        actions.add(new OrderActionItemDTO("CONTACT_SUPPORT", true));

        return new OrderActionsResponseDTO(order.getOrderNumber(), actions);
    }

    /**
     * 5. CANCEL ORDER: Transactional cancellation with 14-day rule and DB persistence.
     */
    @Transactional
    public CancelOrderResponseDTO cancelOrder(Long customerId, String idOrOrderNumber, CancelOrderRequestDTO request, String idempotencyKey) {
        // Idempotency verification
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            Optional<IdempotencyRecord> existing = idempotencyService.findRecord(idempotencyKey, customerId);
            if (existing.isPresent()) {
                try {
                    return objectMapper.readValue(existing.get().getResponsePayload(), CancelOrderResponseDTO.class);
                } catch (Exception ignored) {}
            }
        }

        Order order = findUserOrder(customerId, idOrOrderNumber);
        String currentStatus = order.getStatus() != null ? order.getStatus().trim().toUpperCase() : "CONFIRMED";

        if ("CANCELLED".equals(currentStatus)) {
            throw new ApiException("Order #" + order.getOrderNumber() + " has already been cancelled.");
        }

        if (!List.of("PENDING", "CONFIRMED", "PROCESSING").contains(currentStatus)) {
            throw new ApiException("Order cannot be cancelled. Current status is " + currentStatus + ". Only orders in PENDING, CONFIRMED, or PROCESSING status are cancellable.");
        }

        LocalDateTime orderDate = order.getCreatedAt() != null ? order.getCreatedAt() : LocalDateTime.now();
        if (!isWithin14Days(orderDate)) {
            throw new ApiException("Cancellation window has expired. Orders can only be cancelled within 14 days of purchase.");
        }

        boolean hasActiveReturn = returnRequestRepository
            .existsByOrderIdAndCustomerIdAndStatusIn(order.getId(), customerId,
                List.of("REQUESTED", "APPROVED", "PICKUP_SCHEDULED", "PICKED_UP", "PROCESSING", "COMPLETED"));
        if (hasActiveReturn) {
            throw new ApiException("Cannot cancel order with active return workflow.");
        }

        // 9. Create/update cancellation request
        String reason = (request != null && request.getReason() != null && !request.getReason().isBlank())
            ? request.getReason().trim()
            : "Customer changed mind";

        CancellationRequest cr = new CancellationRequest(
            order,
            order.getUser(),
            reason,
            "COMPLETED",
            order.getTotal() != null ? order.getTotal() : BigDecimal.ZERO,
            "PROCESSING"
        );
        cancellationRequestRepository.save(cr);

        // 10. Update order status in DB
        order.setStatus("CANCELLED");
        order = orderRepository.save(order);

        // 24. Audit logging
        auditService.logMutation(customerId, order.getId(), "ORDER_CANCELLED", "CUSTOMER", idempotencyKey, "Reason: " + reason);

        // Notification
        if (order.getUser() != null) {
            notificationRepository.save(new UserNotification(
                order.getUser(),
                "Order Cancelled #" + order.getOrderNumber(),
                "Your order #" + order.getOrderNumber() + " has been cancelled successfully. Refund is being processed.",
                "ORDER",
                "/account/orders/" + order.getId()
            ));
        }

        MyOrderDetailDTO updatedDetail = mapToOrderDetail(order, customerId);

        Map<String, Object> cancellationSummary = new HashMap<>();
        cancellationSummary.put("status", "COMPLETED");
        cancellationSummary.put("reason", reason);
        cancellationSummary.put("refundAmount", order.getTotal());
        cancellationSummary.put("refundStatus", "PROCESSING");

        CancelOrderResponseDTO response = new CancelOrderResponseDTO(
            true,
            "Your order " + order.getOrderNumber() + " has been cancelled successfully.",
            order.getOrderNumber(),
            "CANCELLED",
            updatedDetail,
            cancellationSummary
        );

        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            try {
                idempotencyService.saveRecord(idempotencyKey, customerId, "ORDER_CANCEL", order.getOrderNumber(), objectMapper.writeValueAsString(response));
            } catch (Exception ignored) {}
        }

        return response;
    }

    /**
     * 9. RETURN ORDER: Transactional return workflow with 14-day calculation from ORDER DATE.
     */
    @Transactional
    public ReturnOrderResponseDTO returnOrder(Long customerId, String idOrOrderNumber, ReturnOrderRequestDTO request, String idempotencyKey) {
        // Idempotency verification
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            Optional<IdempotencyRecord> existing = idempotencyService.findRecord(idempotencyKey, customerId);
            if (existing.isPresent()) {
                try {
                    return objectMapper.readValue(existing.get().getResponsePayload(), ReturnOrderResponseDTO.class);
                } catch (Exception ignored) {}
            }
        }

        Order order = findUserOrder(customerId, idOrOrderNumber);
        String currentStatus = order.getStatus() != null ? order.getStatus().trim().toUpperCase() : "CONFIRMED";

        if ("CANCELLED".equals(currentStatus)) {
            throw new ApiException("Order #" + order.getOrderNumber() + " is cancelled and cannot be returned.");
        }

        if (!List.of("DELIVERED", "SHIPPED").contains(currentStatus)) {
            throw new ApiException("Order cannot be returned. Only delivered or shipped orders are eligible for return (Current status: " + currentStatus + ").");
        }

        // Section 10: 14-day return period starts from ORDER DATE / PURCHASE DATE
        LocalDateTime orderDate = order.getCreatedAt() != null ? order.getCreatedAt() : LocalDateTime.now();
        if (!isWithin14Days(orderDate)) {
            throw new ApiException("The 14-day return window has expired. Orders can only be returned within 14 days of order purchase date.");
        }

        boolean hasActiveReturn = returnRequestRepository
            .existsByOrderIdAndCustomerIdAndStatusIn(order.getId(), customerId,
                List.of("REQUESTED", "APPROVED", "PICKUP_SCHEDULED", "PICKED_UP", "PROCESSING", "COMPLETED"));
        if (hasActiveReturn) {
            throw new ApiException("A return request has already been submitted for Order #" + order.getOrderNumber() + ".");
        }

        String reason = (request != null && request.getReason() != null && !request.getReason().isBlank())
            ? request.getReason().trim()
            : "Size/fit issue";

        ReturnRequest rr = new ReturnRequest(
            order,
            order.getUser(),
            reason,
            "REQUESTED",
            order.getTotal() != null ? order.getTotal() : BigDecimal.ZERO,
            "PENDING"
        );
        if (request != null) {
            rr.setComment(request.getComment());
            rr.setUpiId(request.getUpiId());
            rr.setPickupAddress(request.getPickupAddress() != null && !request.getPickupAddress().isBlank()
                ? request.getPickupAddress()
                : order.getShippingAddress());
        }

        // Attach items to return request
        if (request != null && request.getItems() != null && !request.getItems().isEmpty()) {
            for (ReturnOrderItemRequestDTO itReq : request.getItems()) {
                OrderItem matchedItem = order.getItems().stream()
                    .filter(oi -> oi.getId().equals(itReq.getOrderItemId()))
                    .findFirst()
                    .orElse(null);

                if (matchedItem != null) {
                    int qty = itReq.getQuantity() != null && itReq.getQuantity() > 0 ? itReq.getQuantity() : 1;
                    if (qty > matchedItem.getQuantity()) {
                        qty = matchedItem.getQuantity();
                    }
                    ReturnRequestItem rri = new ReturnRequestItem(rr, matchedItem, qty, itReq.getReason() != null ? itReq.getReason() : reason);
                    rr.addItem(rri);
                }
            }
        } else if (order.getItems() != null) {
            for (OrderItem oi : order.getItems()) {
                ReturnRequestItem rri = new ReturnRequestItem(rr, oi, oi.getQuantity(), reason);
                rr.addItem(rri);
            }
        }

        rr = returnRequestRepository.save(rr);

        // 12. Update order status in DB
        order.setStatus("RETURN_REQUESTED");
        order.setReturnStatus("REQUESTED");
        order.setReturnReason(reason);
        order = orderRepository.save(order);

        // 24. Audit logging
        auditService.logMutation(customerId, order.getId(), "RETURN_REQUESTED", "CUSTOMER", idempotencyKey, "Reason: " + reason);

        // Notification
        if (order.getUser() != null) {
            notificationRepository.save(new UserNotification(
                order.getUser(),
                "Return Request Submitted #" + order.getOrderNumber(),
                "Your return request for Order #" + order.getOrderNumber() + " has been received. Our concierge team is processing pickup.",
                "ORDER",
                "/account/orders/" + order.getId()
            ));
        }

        MyOrderDetailDTO updatedDetail = mapToOrderDetail(order, customerId);

        Map<String, Object> returnSummary = new HashMap<>();
        returnSummary.put("id", rr.getId());
        returnSummary.put("status", "REQUESTED");
        returnSummary.put("reason", reason);
        returnSummary.put("refundStatus", "PENDING");
        returnSummary.put("requestedAt", rr.getRequestedAt());

        ReturnOrderResponseDTO response = new ReturnOrderResponseDTO(
            true,
            "Your return request has been submitted successfully.",
            order.getOrderNumber(),
            "RETURN_REQUESTED",
            updatedDetail,
            returnSummary
        );

        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            try {
                idempotencyService.saveRecord(idempotencyKey, customerId, "ORDER_RETURN", order.getOrderNumber(), objectMapper.writeValueAsString(response));
            } catch (Exception ignored) {}
        }

        return response;
    }

    /**
     * Maps database Order entity into clean, non-stale MyOrderDetailDTO.
     */
    private MyOrderDetailDTO mapToOrderDetail(Order order, Long customerId) {
        MyOrderDetailDTO dto = new MyOrderDetailDTO();
        dto.setOrderId(order.getOrderNumber());
        dto.setId(order.getId());
        dto.setOrderDate(order.getCreatedAt());
        dto.setStatus(order.getStatus());
        dto.setSubtotal(order.getSubtotal() != null ? order.getSubtotal() : order.getTotal());
        dto.setShippingFee(order.getShipping() != null ? order.getShipping() : BigDecimal.ZERO);
        dto.setTotal(order.getTotal() != null ? order.getTotal() : BigDecimal.ZERO);

        // Order Items snapshot
        List<MyOrderItemDTO> items = new ArrayList<>();
        if (order.getItems() != null) {
            for (OrderItem oi : order.getItems()) {
                items.add(new MyOrderItemDTO(
                    oi.getId(),
                    oi.getProductId(),
                    oi.getProductName(),
                    oi.getQuantity(),
                    oi.getUnitPrice(),
                    oi.getFinalPrice(),
                    oi.getSize(),
                    oi.getColor(),
                    oi.getImageUrl()
                ));
            }
        }
        dto.setItems(items);

        // Live Tracking
        boolean hasTracking = order.getTrackingNumber() != null && !order.getTrackingNumber().isBlank();
        OrderTrackingDTO tracking = new OrderTrackingDTO(
            hasTracking,
            order.getCarrier() != null ? order.getCarrier() : "BlueDart Express",
            order.getTrackingNumber(),
            order.getStatus(),
            order.getEstimatedDelivery()
        );
        dto.setTracking(tracking);

        // Live Cancellation state & eligibility
        LocalDateTime orderDate = order.getCreatedAt() != null ? order.getCreatedAt() : LocalDateTime.now();
        boolean within14Days = isWithin14Days(orderDate);
        int daysRemaining = calculateDaysRemaining(orderDate);

        Optional<CancellationRequest> latestCancel = cancellationRequestRepository
            .findFirstByOrderIdAndCustomerIdOrderByCreatedAtDesc(order.getId(), customerId);

        boolean canCancel = List.of("PENDING", "CONFIRMED", "PROCESSING").contains(order.getStatus())
            && within14Days
            && latestCancel.isEmpty();

        String cancelStatus = latestCancel.map(CancellationRequest::getStatus).orElse("CANCELLED".equals(order.getStatus()) ? "COMPLETED" : null);
        String cancelReason = latestCancel.map(CancellationRequest::getReason).orElse(null);
        dto.setCancellation(new OrderCancellationDTO(canCancel, cancelStatus, cancelReason));

        // Live Return state & eligibility
        Optional<ReturnRequest> latestReturn = returnRequestRepository
            .findFirstByOrderIdAndCustomerIdOrderByCreatedAtDesc(order.getId(), customerId);

        boolean canReturn = List.of("DELIVERED", "SHIPPED").contains(order.getStatus())
            && within14Days
            && latestReturn.isEmpty();

        String retStatus = latestReturn.map(ReturnRequest::getStatus).orElse(!"NONE".equals(order.getReturnStatus()) ? order.getReturnStatus() : null);
        String retReason = latestReturn.map(ReturnRequest::getReason).orElse(order.getReturnReason());
        dto.setReturnDetails(new OrderReturnDTO(
            canReturn,
            retStatus,
            within14Days ? daysRemaining : 0,
            calculateReturnDeadline(orderDate),
            retReason
        ));

        // Available actions dynamically
        List<String> actions = new ArrayList<>();
        if (!"CANCELLED".equals(order.getStatus())) {
            actions.add("TRACK_ORDER");
        }
        if (canCancel) {
            actions.add("CANCEL_ORDER");
        }
        if (canReturn) {
            actions.add("RETURN_ORDER");
        }
        actions.add("VIEW_DETAILS");
        actions.add("CONTACT_SUPPORT");
        dto.setAvailableActions(actions);

        return dto;
    }
}
