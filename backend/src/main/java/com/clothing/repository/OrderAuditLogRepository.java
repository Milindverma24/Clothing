package com.clothing.repository;

import com.clothing.entity.OrderAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderAuditLogRepository extends JpaRepository<OrderAuditLog, Long> {

    List<OrderAuditLog> findAllByOrderIdOrderByCreatedAtDesc(Long orderId);

    List<OrderAuditLog> findAllByCustomerIdOrderByCreatedAtDesc(Long customerId);
}
