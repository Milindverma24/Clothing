package com.clothing.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ai_messages", indexes = {
        @Index(name = "idx_ai_msg_conv_id", columnList = "conversation_id"),
        @Index(name = "idx_ai_msg_sender_type", columnList = "sender_type"),
        @Index(name = "idx_ai_msg_created_at", columnList = "created_at"),
        @Index(name = "idx_ai_msg_intent", columnList = "intent")
})
public class AiMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    @JsonBackReference
    private AiConversation conversation;

    @Column(name = "sender_type", nullable = false, length = 30)
    private String senderType; // USER, ASSISTANT, SYSTEM

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "intent", length = 50)
    private String intent; // KNOWLEDGE, PRODUCT_SEARCH, HYBRID, GENERAL

    @Column(name = "model_name", length = 100)
    private String modelName = "local-rag-synthesizer";

    @Column(name = "processing_time_ms")
    private Long processingTimeMs = 0L;

    @Column(name = "token_usage")
    private Integer tokenUsage = 0;

    @Column(name = "error_status", length = 100)
    private String errorStatus; // e.g. INSUFFICIENT_KNOWLEDGE_CONTEXT, RAG_RETRIEVAL_FAILED, null

    @Column(name = "is_helpful")
    private Boolean isHelpful; // true = 👍, false = 👎, null = unrated

    @Column(name = "feedback_comment", length = 500)
    private String feedbackComment;

    @Column(name = "sequence_number", nullable = false)
    private Integer sequenceNumber = 1;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "message", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<AiMessageSource> sources = new ArrayList<>();

    @OneToMany(mappedBy = "message", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<AiMessageProduct> products = new ArrayList<>();

    public AiMessage() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public AiConversation getConversation() { return conversation; }
    public void setConversation(AiConversation conversation) { this.conversation = conversation; }

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

    public List<AiMessageSource> getSources() { return sources; }
    public void setSources(List<AiMessageSource> sources) { this.sources = sources; }

    public List<AiMessageProduct> getProducts() { return products; }
    public void setProducts(List<AiMessageProduct> products) { this.products = products; }

    public void addSource(AiMessageSource source) {
        sources.add(source);
        source.setMessage(this);
    }

    public void addProduct(AiMessageProduct product) {
        products.add(product);
        product.setMessage(this);
    }
}
