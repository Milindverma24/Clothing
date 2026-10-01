package com.clothing.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class AiMessageDTO {
    private Long id;
    private Long conversationId;
    private String senderType; // USER, ASSISTANT, SYSTEM
    private String content;
    private String intent;
    private String modelName;
    private Long processingTimeMs;
    private Integer tokenUsage;
    private String errorStatus;
    private Boolean isHelpful;
    private String feedbackComment;
    private Integer sequenceNumber;
    private LocalDateTime createdAt;
    private List<AiSourceDTO> sources = new ArrayList<>();
    private List<AiProductDTO> products = new ArrayList<>();

    public AiMessageDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getConversationId() { return conversationId; }
    public void setConversationId(Long conversationId) { this.conversationId = conversationId; }

    public String getSenderType() { return senderType; }
    public void setSenderType(String senderType) { this.senderType = senderType; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getIntent() { return intent; }
    public void setIntent(String intent) { this.intent = intent; }

    public String getModelName() { return modelName; }
    public void setModelName(String modelName) { this.modelName = modelName; }

    public Long getProcessingTimeMs() { return processingTimeMs; }
    public void setProcessingTimeMs(Long processingTimeMs) { this.processingTimeMs = processingTimeMs; }

    public Integer getTokenUsage() { return tokenUsage; }
    public void setTokenUsage(Integer tokenUsage) { this.tokenUsage = tokenUsage; }

    public String getErrorStatus() { return errorStatus; }
    public void setErrorStatus(String errorStatus) { this.errorStatus = errorStatus; }

    public Boolean getIsHelpful() { return isHelpful; }
    public void setIsHelpful(Boolean helpful) { isHelpful = helpful; }

    public String getFeedbackComment() { return feedbackComment; }
    public void setFeedbackComment(String feedbackComment) { this.feedbackComment = feedbackComment; }

    public Integer getSequenceNumber() { return sequenceNumber; }
    public void setSequenceNumber(Integer sequenceNumber) { this.sequenceNumber = sequenceNumber; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public List<AiSourceDTO> getSources() { return sources; }
    public void setSources(List<AiSourceDTO> sources) { this.sources = sources; }

    public List<AiProductDTO> getProducts() { return products; }
    public void setProducts(List<AiProductDTO> products) { this.products = products; }
}
