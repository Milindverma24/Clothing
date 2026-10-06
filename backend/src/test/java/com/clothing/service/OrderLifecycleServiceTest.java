package com.clothing.service;

import com.clothing.dto.*;
import com.clothing.entity.*;
import com.clothing.exception.ApiException;
import com.clothing.exception.ResourceNotFoundException;
import com.clothing.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@org.mockito.junit.jupiter.MockitoSettings(strictness = org.mockito.quality.Strictness.LENIENT)
public class OrderLifecycleServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private CancellationRequestRepository cancellationRequestRepository;

    @Mock
    private ReturnRequestRepository returnRequestRepository;

    @Mock
    private OrderAuditService auditService;

    @Mock
    private IdempotencyService idempotencyService;

    @Mock
    private UserNotificationRepository notificationRepository;

    private ObjectMapper objectMapper;
    private OrderLifecycleService service;

    private User customerA;
    private User customerB;
    private Order orderA;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        service = new OrderLifecycleService(
            orderRepository,
            cancellationRequestRepository,
            returnRequestRepository,
            auditService,
            idempotencyService,
            notificationRepository,
            objectMapper
        );

        customerA = new User();
        customerA.setId(101L);
        customerA.setEmail("customera@example.com");

        customerB = new User();
        customerB.setId(202L);
        customerB.setEmail("customerb@example.com");

        orderA = new Order();
        orderA.setId(1001L);
        orderA.setOrderNumber("ORD-1001");
        orderA.setUser(customerA);
        orderA.setStatus("CONFIRMED");
        orderA.setTotal(new BigDecimal("1499.00"));
        orderA.setCreatedAt(LocalDateTime.now().minusDays(3));
    }

    @Test
    @DisplayName("14-Day rule: Order placed 5 days ago is eligible, 16 days ago is expired")
    void testFourteenDayEligibilityRule() {
        LocalDateTime recentOrder = LocalDateTime.now().minusDays(5);
        assertTrue(service.isWithin14Days(recentOrder));
        assertTrue(service.calculateDaysRemaining(recentOrder) >= 8);

        LocalDateTime oldOrder = LocalDateTime.now().minusDays(16);
        assertFalse(service.isWithin14Days(oldOrder));
        assertEquals(0, service.calculateDaysRemaining(oldOrder));
    }

    @Test
    @DisplayName("Ownership Privacy: Customer B cannot access Customer A's order (404 NOT FOUND)")
    void testOrderOwnershipEnforcement() {
        when(orderRepository.findByIdAndUserId(1001L, 202L)).thenReturn(Optional.empty());
        when(orderRepository.findByOrderNumberAndUserId("1001", 202L)).thenReturn(Optional.empty());
        when(orderRepository.findByTrackingNumberAndUserId("1001", 202L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            service.findUserOrder(202L, "1001");
        });
    }

    @Test
    @DisplayName("Cancel Order: Eligible confirmed order is cancelled and state is updated")
    void testCancelOrderSuccess() {
        when(orderRepository.findByIdAndUserId(1001L, 101L)).thenReturn(Optional.of(orderA));
        when(cancellationRequestRepository.existsByOrderIdAndCustomerIdAndStatusIn(anyLong(), anyLong(), any()))
            .thenReturn(false);
        when(returnRequestRepository.existsByOrderIdAndCustomerIdAndStatusIn(anyLong(), anyLong(), any()))
            .thenReturn(false);
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CancelOrderRequestDTO req = new CancelOrderRequestDTO("Changed mind", "token-123");
        CancelOrderResponseDTO res = service.cancelOrder(101L, "1001", req, "idemp-key-1");

        assertTrue(res.isSuccess());
        assertEquals("CANCELLED", res.getStatus());
        assertEquals("CANCELLED", orderA.getStatus());
        verify(cancellationRequestRepository, times(1)).save(any(CancellationRequest.class));
        verify(orderRepository, times(1)).save(orderA);
        verify(auditService, times(1)).logMutation(eq(101L), eq(1001L), eq("ORDER_CANCELLED"), eq("CUSTOMER"), any(), any());
    }

    @Test
    @DisplayName("Return Order: Delivered order within 14 days submits return request")
    void testReturnOrderSuccess() {
        orderA.setStatus("DELIVERED");
        when(orderRepository.findByIdAndUserId(1001L, 101L)).thenReturn(Optional.of(orderA));
        when(returnRequestRepository.existsByOrderIdAndCustomerIdAndStatusIn(anyLong(), anyLong(), any()))
            .thenReturn(false);
        when(returnRequestRepository.save(any(ReturnRequest.class))).thenAnswer(invocation -> {
            ReturnRequest rr = invocation.getArgument(0);
            rr.setId(55L);
            return rr;
        });
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ReturnOrderRequestDTO req = new ReturnOrderRequestDTO();
        req.setReason("Product does not fit");
        ReturnOrderResponseDTO res = service.returnOrder(101L, "1001", req, "idemp-key-ret");

        assertTrue(res.isSuccess());
        assertEquals("RETURN_REQUESTED", res.getStatus());
        assertEquals("RETURN_REQUESTED", orderA.getStatus());
        verify(returnRequestRepository, times(1)).save(any(ReturnRequest.class));
        verify(orderRepository, times(1)).save(orderA);
        verify(auditService, times(1)).logMutation(eq(101L), eq(1001L), eq("RETURN_REQUESTED"), eq("CUSTOMER"), any(), any());
    }

    @Test
    @DisplayName("Return Order: Blocked if 14-day window from ORDER DATE has expired")
    void testReturnOrderExpiredWindow() {
        orderA.setStatus("DELIVERED");
        orderA.setCreatedAt(LocalDateTime.now().minusDays(18));
        when(orderRepository.findByIdAndUserId(1001L, 101L)).thenReturn(Optional.of(orderA));

        ReturnOrderRequestDTO req = new ReturnOrderRequestDTO();
        req.setReason("Product does not fit");

        assertThrows(ApiException.class, () -> {
            service.returnOrder(101L, "1001", req, null);
        });
    }
}
