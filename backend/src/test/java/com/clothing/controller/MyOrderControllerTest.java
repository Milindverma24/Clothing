package com.clothing.controller;

import com.clothing.dto.*;
import com.clothing.exception.ResourceNotFoundException;
import com.clothing.security.UserPrincipal;
import com.clothing.service.OrderLifecycleService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class MyOrderControllerTest {

    @Mock
    private OrderLifecycleService orderLifecycleService;

    @InjectMocks
    private MyOrderController controller;

    private UserPrincipal customerA;
    private MyOrderDetailDTO sampleDetail;

    @BeforeEach
    void setUp() {
        customerA = new UserPrincipal(
            101L,
            "customer@example.com",
            "password",
            "Customer A",
            "CUSTOMER",
            true,
            Collections.singletonList(new SimpleGrantedAuthority("ROLE_CUSTOMER"))
        );

        sampleDetail = new MyOrderDetailDTO();
        sampleDetail.setId(1L);
        sampleDetail.setOrderId("ORD-10294");
        sampleDetail.setStatus("SHIPPED");
        sampleDetail.setTotal(new BigDecimal("1399.00"));
        sampleDetail.setOrderDate(LocalDateTime.now().minusDays(2));

        OrderTrackingDTO trk = new OrderTrackingDTO();
        trk.setAvailable(true);
        trk.setCarrier("BlueDart");
        trk.setTrackingNumber("TRK123456");
        trk.setCurrentStatus("IN_TRANSIT");
        sampleDetail.setTracking(trk);

        OrderCancellationDTO canc = new OrderCancellationDTO();
        canc.setEligible(false);
        sampleDetail.setCancellation(canc);

        OrderReturnDTO ret = new OrderReturnDTO();
        ret.setEligible(true);
        ret.setDaysRemaining(12);
        sampleDetail.setReturnDetails(ret);

        sampleDetail.setAvailableActions(List.of("TRACK_ORDER", "RETURN_ORDER", "VIEW_DETAILS", "CONTACT_SUPPORT"));
    }

    @Test
    @DisplayName("GET /api/my/orders/trackable: Returns trackable orders for authenticated customer")
    void testGetTrackableOrders() {
        when(orderLifecycleService.getTrackableOrders(101L)).thenReturn(List.of(sampleDetail));

        ResponseEntity<ApiResponse<List<MyOrderDetailDTO>>> response = controller.getTrackableOrders(customerA);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals(1, response.getBody().getData().size());
        assertEquals("ORD-10294", response.getBody().getData().get(0).getOrderId());
    }

    @Test
    @DisplayName("GET /api/my/orders/{orderId}: Returns live order details")
    void testGetOrderDetail() {
        when(orderLifecycleService.getOrderDetail(101L, "ORD-10294")).thenReturn(sampleDetail);

        ResponseEntity<ApiResponse<MyOrderDetailDTO>> response = controller.getOrderDetail("ORD-10294", customerA);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("ORD-10294", response.getBody().getData().getOrderId());
        assertEquals("SHIPPED", response.getBody().getData().getStatus());
        assertTrue(response.getBody().getData().getReturnDetails().isEligible());
    }

    @Test
    @DisplayName("GET /api/my/orders/{orderId}: 404 NOT FOUND when order belongs to another customer (IDOR prevention)")
    void testGetOrderDetailIdorProtection() {
        when(orderLifecycleService.getOrderDetail(101L, "ORD-99999"))
            .thenThrow(new ResourceNotFoundException("Order", "reference", "ORD-99999"));

        assertThrows(ResourceNotFoundException.class, () -> {
            controller.getOrderDetail("ORD-99999", customerA);
        });
    }

    @Test
    @DisplayName("POST /api/my/orders/{orderId}/cancel: Cancels order and returns updated status")
    void testCancelOrder() {
        CancelOrderResponseDTO cancelRes = new CancelOrderResponseDTO();
        cancelRes.setSuccess(true);
        cancelRes.setMessage("Order cancelled successfully.");
        cancelRes.setOrderId("ORD-10294");
        cancelRes.setStatus("CANCELLED");

        sampleDetail.setStatus("CANCELLED");
        cancelRes.setOrder(sampleDetail);

        when(orderLifecycleService.cancelOrder(eq(101L), eq("ORD-10294"), any(), any()))
            .thenReturn(cancelRes);

        CancelOrderRequestDTO req = new CancelOrderRequestDTO("Changed my mind", "token-xyz");
        ResponseEntity<ApiResponse<CancelOrderResponseDTO>> response =
            controller.cancelOrder("ORD-10294", req, "idemp-cancel-123", customerA);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals("CANCELLED", response.getBody().getData().getStatus());
        assertEquals("Order cancelled successfully.", response.getBody().getMessage());
    }

    @Test
    @DisplayName("POST /api/my/orders/{orderId}/return: Submits return request within 14 days")
    void testReturnOrder() {
        ReturnOrderResponseDTO returnRes = new ReturnOrderResponseDTO();
        returnRes.setSuccess(true);
        returnRes.setMessage("Return request submitted successfully.");
        returnRes.setOrderId("ORD-10294");
        returnRes.setStatus("RETURN_REQUESTED");
        returnRes.setReturnRequest(java.util.Map.of("status", "REQUESTED"));

        when(orderLifecycleService.returnOrder(eq(101L), eq("ORD-10294"), any(), any()))
            .thenReturn(returnRes);

        ReturnOrderRequestDTO req = new ReturnOrderRequestDTO();
        req.setReason("Product does not fit");
        ResponseEntity<ApiResponse<ReturnOrderResponseDTO>> response =
            controller.returnOrder("ORD-10294", req, "idemp-return-123", customerA);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals("RETURN_REQUESTED", response.getBody().getData().getStatus());
    }

    @Test
    @DisplayName("Unauthorized: 401 UNAUTHORIZED if principal is null")
    void testUnauthorizedWithoutPrincipal() {
        ResponseEntity<ApiResponse<List<MyOrderDetailDTO>>> res = controller.getTrackableOrders(null);
        assertEquals(HttpStatus.UNAUTHORIZED, res.getStatusCode());
    }
}
