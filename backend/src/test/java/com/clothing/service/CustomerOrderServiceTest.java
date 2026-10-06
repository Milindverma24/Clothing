package com.clothing.service;

import com.clothing.dto.ReturnOrderRequest;
import com.clothing.entity.Order;
import com.clothing.entity.OrderItem;
import com.clothing.entity.User;
import com.clothing.exception.ApiException;
import com.clothing.repository.OrderRepository;
import com.clothing.repository.ProductRepository;
import com.clothing.repository.UserNotificationRepository;
import com.clothing.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomerOrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private UserNotificationRepository notificationRepository;

    @Mock
    private CouponService couponService;

    @InjectMocks
    private CustomerOrderService orderService;

    private User testUser;
    private Order deliveredOrder;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("alice@nova.demo");
        testUser.setFirstName("Alice");

        deliveredOrder = new Order();
        deliveredOrder.setId(101L);
        deliveredOrder.setOrderNumber("ORD-1001");
        deliveredOrder.setTrackingNumber("TRK-1001");
        deliveredOrder.setUser(testUser);
        deliveredOrder.setStatus("DELIVERED");
        deliveredOrder.setTotal(new BigDecimal("1499.00"));
        deliveredOrder.setShippingAddress("123 Fashion Street, Mumbai, 400001");
        deliveredOrder.setCreatedAt(LocalDateTime.now().minusDays(5));

        OrderItem item = new OrderItem();
        item.setId(201L);
        item.setProductName("Heavyweight Cotton Tee");
        item.setUnitPrice(new BigDecimal("1499.00"));
        item.setFinalPrice(new BigDecimal("1499.00"));
        item.setQuantity(1);
        deliveredOrder.setItems(new ArrayList<>(List.of(item)));
    }

    @Test
    @DisplayName("Under ₹5,000 threshold: Autonomous approval, assigns RF and RET-TRK references")
    void testAutonomousReturnApproval_WhenAmountUnderThreshold() {
        when(orderRepository.findByIdAndUserId(101L, 1L)).thenReturn(Optional.of(deliveredOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ReturnOrderRequest req = new ReturnOrderRequest("Doesn't fit", "Requested size L instead");
        req.setUpiId("alice@okhdfcbank");

        Order result = orderService.requestReturn(1L, 101L, req);

        assertNotNull(result);
        assertEquals("APPROVED", result.getReturnStatus());
        assertEquals("AUTONOMOUS", result.getApprovalType());
        assertNotNull(result.getRefundReference());
        assertTrue(result.getRefundReference().startsWith("RF-"));
        assertNotNull(result.getReturnTrackingNumber());
        assertTrue(result.getReturnTrackingNumber().startsWith("RET-TRK-"));
        assertEquals("alice@okhdfcbank", result.getRefundUpiId());
        assertEquals(new BigDecimal("1499.00"), result.getRefundAmount());
        assertNotNull(result.getPickupDate());
    }

    @Test
    @DisplayName("Over ₹5,000 threshold: Escalates to Admin Pending queue, assigns RF-PENDING")
    void testAdminApprovalRequired_WhenAmountOverThreshold() {
        deliveredOrder.setTotal(new BigDecimal("12999.00"));
        when(orderRepository.findByIdAndUserId(101L, 1L)).thenReturn(Optional.of(deliveredOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ReturnOrderRequest req = new ReturnOrderRequest("Changed mind", "High value overcoat return");
        req.setUpiId("bob@upi");

        Order result = orderService.requestReturn(1L, 101L, req);

        assertNotNull(result);
        assertEquals("AWAITING_APPROVAL", result.getReturnStatus());
        assertEquals("ADMIN_PENDING", result.getApprovalType());
        assertTrue(result.getRefundReference().startsWith("RF-PENDING-"));
        assertTrue(result.getReturnTrackingNumber().startsWith("RET-PENDING-"));
        assertEquals("bob@upi", result.getRefundUpiId());
    }

    @Test
    @DisplayName("Reject return when order was placed outside 14-day window")
    void testReturnRejected_WhenOrderOlderThan30Days() {
        deliveredOrder.setCreatedAt(LocalDateTime.now().minusDays(20));
        when(orderRepository.findByIdAndUserId(101L, 1L)).thenReturn(Optional.of(deliveredOrder));

        ReturnOrderRequest req = new ReturnOrderRequest("Doesn't fit", "Late return");

        ApiException ex = assertThrows(ApiException.class, () -> orderService.requestReturn(1L, 101L, req));
        assertTrue(ex.getMessage().contains("14 days"));
    }

    @Test
    @DisplayName("Reject return when UPI ID format is invalid")
    void testReturnRejected_WhenInvalidUpiIdFormat() {
        when(orderRepository.findByIdAndUserId(101L, 1L)).thenReturn(Optional.of(deliveredOrder));

        ReturnOrderRequest req = new ReturnOrderRequest("Damaged", "Torn seam");
        req.setUpiId("invalid_upi_without_at_symbol");

        ApiException ex = assertThrows(ApiException.class, () -> orderService.requestReturn(1L, 101L, req));
        assertTrue(ex.getMessage().contains("Invalid UPI ID"));
    }

    @Test
    @DisplayName("Lookup order by Carrier Tracking Number and process return")
    void testReturnLookup_ByTrackingNumber() {
        when(orderRepository.findByTrackingNumberAndUserId("TRK-1001", 1L)).thenReturn(Optional.of(deliveredOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ReturnOrderRequest req = new ReturnOrderRequest("Wrong item", "Received blue instead of black");
        req.setTrackingOrOrderNumber("TRK-1001");
        req.setUpiId("charlie@axisbank");

        Order result = orderService.requestReturn(1L, null, req);

        assertNotNull(result);
        assertEquals("APPROVED", result.getReturnStatus());
        assertEquals("AUTONOMOUS", result.getApprovalType());
        assertEquals("charlie@axisbank", result.getRefundUpiId());
    }

    @Test
    @DisplayName("Reject return on non-returnable intimate/sleepwear category")
    void testNonReturnableItem_Rejected() {
        OrderItem sleepItem = new OrderItem();
        sleepItem.setProductName("Silk Sleepwear Lounge Set");
        deliveredOrder.setItems(new ArrayList<>(List.of(sleepItem)));

        when(orderRepository.findByIdAndUserId(101L, 1L)).thenReturn(Optional.of(deliveredOrder));

        ReturnOrderRequest req = new ReturnOrderRequest("Changed mind", "Not needed");

        ApiException ex = assertThrows(ApiException.class, () -> orderService.requestReturn(1L, 101L, req));
        assertTrue(ex.getMessage().contains("hygiene"));
    }
}
