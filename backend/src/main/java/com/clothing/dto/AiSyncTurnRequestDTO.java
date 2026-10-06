package com.clothing.dto;

import java.util.List;

public class AiSyncTurnRequestDTO {

    private Long conversationId;
    private String sessionId;
    private String userName;
    private String userEmail;
    private String userMessage;
    private String assistantMessage;
    private String intent;
    private long latencyMs;
    private String modelName;
    private String errorStatus;
    private List<Long> productIds;
    private List<CitationSource> sources;

    public AiSyncTurnRequestDTO() {}

    public Long getConversationId() { return conversationId; }
    public void setConversationId(Long conversationId) { this.conversationId = conversationId; }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getUserMessage() { return userMessage; }
    public void setUserMessage(String userMessage) { this.userMessage = userMessage; }

    public String getAssistantMessage() { return assistantMessage; }
    public void setAssistantMessage(String assistantMessage) { this.assistantMessage = assistantMessage; }

    public String getIntent() { return intent; }
    public void setIntent(String intent) { this.intent = intent; }

    public long getLatencyMs() { return latencyMs; }
    public void setLatencyMs(long latencyMs) { this.latencyMs = latencyMs; }

    public String getModelName() { return modelName; }
    public void setModelName(String modelName) { this.modelName = modelName; }

    public String getErrorStatus() { return errorStatus; }
    public void setErrorStatus(String errorStatus) { this.errorStatus = errorStatus; }

    public List<Long> getProductIds() { return productIds; }
    public void setProductIds(List<Long> productIds) { this.productIds = productIds; }

    public List<CitationSource> getSources() { return sources; }
    public void setSources(List<CitationSource> sources) { this.sources = sources; }
}
