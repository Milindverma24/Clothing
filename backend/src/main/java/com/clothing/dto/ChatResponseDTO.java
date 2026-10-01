package com.clothing.dto;

import java.util.ArrayList;
import java.util.List;

public class ChatResponseDTO {
    private String answer;
    private List<CitationSource> sources = new ArrayList<>();
    private List<ProductSearchDTO> products = new ArrayList<>();
    private String intent = "KNOWLEDGE";
    private Long conversationId;
    private Long messageId;
    private Long userMessageId;
    private Long processingTimeMs = 0L;
    private String modelName;

    public ChatResponseDTO() {}

    public ChatResponseDTO(String answer) {
        this.answer = answer;
    }

    public ChatResponseDTO(String answer, List<CitationSource> sources, List<ProductSearchDTO> products, String intent) {
        this.answer = answer;
        this.sources = sources != null ? sources : new ArrayList<>();
        this.products = products != null ? products : new ArrayList<>();
        this.intent = intent;
    }

    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }

    public List<CitationSource> getSources() { return sources; }
    public void setSources(List<CitationSource> sources) { this.sources = sources; }

    public List<ProductSearchDTO> getProducts() { return products; }
    public void setProducts(List<ProductSearchDTO> products) { this.products = products; }

    public String getIntent() { return intent; }
    public void setIntent(String intent) { this.intent = intent; }

    public Long getConversationId() { return conversationId; }
    public void setConversationId(Long conversationId) { this.conversationId = conversationId; }

    public Long getMessageId() { return messageId; }
    public void setMessageId(Long messageId) { this.messageId = messageId; }

    public Long getUserMessageId() { return userMessageId; }
    public void setUserMessageId(Long userMessageId) { this.userMessageId = userMessageId; }

    public Long getProcessingTimeMs() { return processingTimeMs; }
    public void setProcessingTimeMs(Long processingTimeMs) { this.processingTimeMs = processingTimeMs; }

    public String getModelName() { return modelName; }
    public void setModelName(String modelName) { this.modelName = modelName; }
}

