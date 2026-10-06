package com.clothing.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "order_audit_logs", indexes = {
    @Index(name = "idx_order_audit_logs_order_id", columnList = "order_id"),
    @Index(name = "idx_order_audit_logs_customer_id", columnList = "customer_id"),
    @Index(name = "idx_order_audit_logs_action", columnList = "action")
})
public class OrderAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(nullable = false)
    private String action; // ORDER_VIEWED, ORDER_CANCEL_REQUESTED, ORDER_CANCELLED, RETURN_REQUESTED, RETURN_APPROVED, RETURN_REJECTED, RETURN_COMPLETED

    @Column(name = "actor_type", nullable = false)
    private String actorType; // CUSTOMER, ADMIN, SYSTEM

    @Column(name = "request_id")
    private String requestId;

    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public OrderAuditLog() {}

    public OrderAuditLog(Long customerId, Long orderId, String action, String actorType, String requestId, String metadata) {
        this.customerId = customerId;
        this.orderId = orderId;
        this.action = action;
        this.actorType = actorType;
        this.requestId = requestId;
        this.metadata = metadata;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getActorType() { return actorType; }
    public void setActorType(String actorType) { this.actorType = actorType; }

    public String getRequestId() { return requestId; }
    public void setRequestId(String requestId) { this.requestId = requestId; }

    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
