package com.clothing.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ai_conversations", indexes = {
        @Index(name = "idx_ai_conv_user_id", columnList = "user_id"),
        @Index(name = "idx_ai_conv_session_id", columnList = "session_id"),
        @Index(name = "idx_ai_conv_status", columnList = "status"),
        @Index(name = "idx_ai_conv_last_activity", columnList = "last_activity_at"),
        @Index(name = "idx_ai_conv_created_at", columnList = "created_at")
})
public class AiConversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "session_id", length = 120)
    private String sessionId;

    @Column(name = "user_name", length = 120)
    private String userName = "Guest Shopper";

    @Column(name = "user_email", length = 150)
    private String userEmail;

    @Column(name = "title", length = 200)
    private String title = "Customer Inquiry";

    @Column(name = "status", nullable = false, length = 30)
    private String status = "ACTIVE"; // ACTIVE, CLOSED, ARCHIVED

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt = LocalDateTime.now();

    @Column(name = "last_activity_at", nullable = false)
    private LocalDateTime lastActivityAt = LocalDateTime.now();

    @Column(name = "message_count", nullable = false)
    private Integer messageCount = 0;

    @Column(name = "rag_queries_count", nullable = false)
    private Integer ragQueriesCount = 0;

    @Column(name = "product_searches_count", nullable = false)
    private Integer productSearchesCount = 0;

    @Column(name = "has_unanswered", nullable = false)
    private Boolean hasUnanswered = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("sequenceNumber ASC")
    @JsonManagedReference
    private List<AiMessage> messages = new ArrayList<>();

    public AiConversation() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }

    public LocalDateTime getLastActivityAt() { return lastActivityAt; }
    public void setLastActivityAt(LocalDateTime lastActivityAt) { this.lastActivityAt = lastActivityAt; }

    public Integer getMessageCount() { return messageCount; }
    public void setMessageCount(Integer messageCount) { this.messageCount = messageCount; }

    public Integer getRagQueriesCount() { return ragQueriesCount; }
    public void setRagQueriesCount(Integer ragQueriesCount) { this.ragQueriesCount = ragQueriesCount; }

    public Integer getProductSearchesCount() { return productSearchesCount; }
    public void setProductSearchesCount(Integer productSearchesCount) { this.productSearchesCount = productSearchesCount; }

    public Boolean getHasUnanswered() { return hasUnanswered; }
    public void setHasUnanswered(Boolean hasUnanswered) { this.hasUnanswered = hasUnanswered; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public List<AiMessage> getMessages() { return messages; }
    public void setMessages(List<AiMessage> messages) { this.messages = messages; }

    public void addMessage(AiMessage message) {
        messages.add(message);
        message.setConversation(this);
        this.messageCount = messages.size();
        this.lastActivityAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
}
