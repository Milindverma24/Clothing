package com.clothing.service;

import com.clothing.dto.ReturnOrderRequest;
import com.clothing.entity.Order;
import com.clothing.entity.OrderItem;
import com.clothing.entity.Product;
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

@Service
public class CustomerOrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final UserNotificationRepository notificationRepository;

    public CustomerOrderService(
        OrderRepository orderRepository,
        UserRepository userRepository,
        ProductRepository productRepository,
        UserNotificationRepository notificationRepository
    ) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.notificationRepository = notificationRepository;
    }

    @Transactional(readOnly = true)
    public List<Order> getUserOrders(Long userId) {
        return orderRepository.findAllByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public Order getOrderDetails(Long userId, Long orderId) {
        return orderRepository.findByIdAndUserId(orderId, userId)
            .orElseThrow(() -> new ApiException("Order not found or access denied"));
    }

    @Transactional(readOnly = true)
    public Order trackOrderByNumber(String trackingOrOrderNumber) {
        return orderRepository.findByTrackingNumber(trackingOrOrderNumber.trim())
            .or(() -> orderRepository.findByOrderNumber(trackingOrOrderNumber.trim()))
            .orElseThrow(() -> new ApiException("No order found with tracking or order number: " + trackingOrOrderNumber));
    }

    @Transactional
    public Order requestReturn(Long userId, Long orderId, ReturnOrderRequest request) {
        Order order = orderRepository.findByIdAndUserId(orderId, userId)
            .orElseThrow(() -> new ApiException("Order not found or access denied"));

        if (!"DELIVERED".equalsIgnoreCase(order.getStatus()) && !"CONFIRMED".equalsIgnoreCase(order.getStatus()) && !"SHIPPED".equalsIgnoreCase(order.getStatus())) {
            throw new ApiException("Order is not currently eligible for return request");
        }

        order.setReturnStatus("REQUESTED");
        order.setReturnReason(request.getReason());
        order.setReturnComment(request.getComment());
        order = orderRepository.save(order);

        // Notify user
        notificationRepository.save(new UserNotification(
            order.getUser(),
            "Return Request Received",
            "Your return request for Order #" + order.getOrderNumber() + " has been received and is being processed by our atelier team.",
            "ORDER",
            "/account/orders/" + order.getId()
        ));

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

                Product product = productRepository.findById(productId).orElse(null);
                BigDecimal price = product != null ? product.getBasePrice() : new BigDecimal(1499);
                BigDecimal itemTotal = price.multiply(BigDecimal.valueOf(qty));
                subtotal = subtotal.add(itemTotal);

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
                oi.setImageUrl(product != null && product.getImages() != null && !product.getImages().isEmpty()
                    ? product.getImages().get(0).getImageUrl()
                    : "/images/hero-campaign.jpg");

                order.getItems().add(oi);
            }
        }

        BigDecimal discount = BigDecimal.ZERO;
        if (order.getCouponCode() != null && !order.getCouponCode().isBlank()) {
            discount = subtotal.multiply(new BigDecimal("0.10")); // 10% demo coupon
        }

        BigDecimal shipping = subtotal.compareTo(new BigDecimal(1499)) >= 0 ? BigDecimal.ZERO : new BigDecimal(99);
        BigDecimal total = subtotal.subtract(discount).add(shipping);

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
}
