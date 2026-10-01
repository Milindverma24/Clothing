package com.clothing.dto;

import jakarta.validation.constraints.NotNull;

public class AiFeedbackRequestDTO {

    @NotNull(message = "Message ID is required")
    private Long messageId;

    private Long conversationId;

    @NotNull(message = "Feedback status (helpful true/false) is required")
    private Boolean helpful;

    private String comment;

    public AiFeedbackRequestDTO() {}

    public AiFeedbackRequestDTO(Long messageId, Long conversationId, Boolean helpful, String comment) {
        this.messageId = messageId;
        this.conversationId = conversationId;
        this.helpful = helpful;
        this.comment = comment;
    }

    public Long getMessageId() { return messageId; }
    public void setMessageId(Long messageId) { this.messageId = messageId; }

    public Long getConversationId() { return conversationId; }
    public void setConversationId(Long conversationId) { this.conversationId = conversationId; }

    public Boolean getHelpful() { return helpful; }
    public void setHelpful(Boolean helpful) { this.helpful = helpful; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
}
