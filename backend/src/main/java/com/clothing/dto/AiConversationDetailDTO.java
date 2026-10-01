package com.clothing.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class AiConversationDetailDTO {
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
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<AiMessageDTO> messages = new ArrayList<>();
    private List<AiSourceDTO> allSources = new ArrayList<>();
    private List<AiProductDTO> allProducts = new ArrayList<>();

    public AiConversationDetailDTO() {}

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

    public List<AiMessageDTO> getMessages() { return messages; }
    public void setMessages(List<AiMessageDTO> messages) { this.messages = messages; }

    public List<AiSourceDTO> getAllSources() { return allSources; }
    public void setAllSources(List<AiSourceDTO> allSources) { this.allSources = allSources; }

    public List<AiProductDTO> getAllProducts() { return allProducts; }
    public void setAllProducts(List<AiProductDTO> allProducts) { this.allProducts = allProducts; }
}
