package com.clothing.repository;

import com.clothing.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByOrderNumber(String orderNumber);
    Optional<Order> findByTrackingNumber(String trackingNumber);
    Optional<Order> findByOrderNumberAndUserId(String orderNumber, Long userId);
    Optional<Order> findByTrackingNumberAndUserId(String trackingNumber, Long userId);
    Optional<Order> findByReturnTrackingNumber(String returnTrackingNumber);
    Optional<Order> findByRefundReference(String refundReference);
    List<Order> findAllByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<Order> findByIdAndUserId(Long id, Long userId);
    List<Order> findAllByCustomerEmailOrderByCreatedAtDesc(String customerEmail);
    List<Order> findAllByOrderByCreatedAtDesc();
    org.springframework.data.domain.Page<Order> findAllByOrderByCreatedAtDesc(org.springframework.data.domain.Pageable pageable);
    long countByUserId(Long userId);

    @org.springframework.data.jpa.repository.Query("SELECT o FROM Order o WHERE o.user.id = :customerId AND (" +
           "o.status IN ('PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY') " +
           "OR (o.status = 'DELIVERED' AND o.createdAt >= :fourteenDaysAgo) " +
           "OR EXISTS (SELECT rr FROM ReturnRequest rr WHERE rr.order.id = o.id AND rr.customer.id = :customerId AND rr.status IN ('REQUESTED', 'APPROVED', 'PICKUP_SCHEDULED', 'PICKED_UP', 'PROCESSING')) " +
           "OR EXISTS (SELECT cr FROM CancellationRequest cr WHERE cr.order.id = o.id AND cr.customer.id = :customerId AND cr.status IN ('REQUESTED', 'PROCESSING'))" +
           ") ORDER BY o.createdAt DESC")
    List<Order> findTrackableOrders(
        @org.springframework.data.repository.query.Param("customerId") Long customerId,
        @org.springframework.data.repository.query.Param("fourteenDaysAgo") java.time.LocalDateTime fourteenDaysAgo
    );
}

