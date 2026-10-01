package com.clothing.dto;

import java.time.LocalDateTime;

public class AiConversationSummaryDTO {
    private Long id;
    private Long userId;
    private String sessionId;
    private String userName;
    private String userEmail;
    private String title;
    private String status;
    private LocalDateTime startedAt;
    private LocalDateTime lastActivityAt;
    private Integer messageCount;
    private Integer ragQueriesCount;
    private Integer productSearchesCount;
    private Boolean hasUnanswered;
    private String lastMessageText;
    private String lastSenderType;
    private LocalDateTime lastMessageCreatedAt;
    private String primaryIntent;

    public AiConversationSummaryDTO() {}

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

    public String getLastMessageText() { return lastMessageText; }
    public void setLastMessageText(String lastMessageText) { this.lastMessageText = lastMessageText; }

    public String getLastSenderType() { return lastSenderType; }
    public void setLastSenderType(String lastSenderType) { this.lastSenderType = lastSenderType; }

    public LocalDateTime getLastMessageCreatedAt() { return lastMessageCreatedAt; }
    public void setLastMessageCreatedAt(LocalDateTime lastMessageCreatedAt) { this.lastMessageCreatedAt = lastMessageCreatedAt; }

    public String getPrimaryIntent() { return primaryIntent; }
    public void setPrimaryIntent(String primaryIntent) { this.primaryIntent = primaryIntent; }
}
