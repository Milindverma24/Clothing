package com.clothing.service;

import com.clothing.entity.OrderAuditLog;
import com.clothing.repository.OrderAuditLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderAuditService {

    private final OrderAuditLogRepository auditLogRepository;

    public OrderAuditService(OrderAuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(propagation = Propagation.REQUIRED)
    public void logMutation(Long customerId, Long orderId, String action, String actorType, String requestId, String metadata) {
        try {
            OrderAuditLog log = new OrderAuditLog(
                customerId != null ? customerId : 0L,
                orderId != null ? orderId : 0L,
                action,
                actorType != null ? actorType : "CUSTOMER",
                requestId,
                metadata
            );
            auditLogRepository.save(log);
        } catch (Exception e) {
            // Do not break critical flows on audit log failure
            org.slf4j.LoggerFactory.getLogger(OrderAuditService.class).error("Failed to write order audit log: {}", e.getMessage());
        }
    }
}
