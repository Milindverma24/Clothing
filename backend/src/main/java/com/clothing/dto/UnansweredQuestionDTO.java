package com.clothing.dto;

import java.time.LocalDateTime;

public class UnansweredQuestionDTO {
    private Long id;
    private Long conversationId;
    private String userName;
    private String userEmail;
    private String userQuestion;
    private String aiResponse;
    private String reason;
    private LocalDateTime timestamp;

    public UnansweredQuestionDTO() {}

    public UnansweredQuestionDTO(Long id, Long conversationId, String userName, String userEmail, String userQuestion, String aiResponse, String reason, LocalDateTime timestamp) {
        this.id = id;
        this.conversationId = conversationId;
        this.userName = userName;
        this.userEmail = userEmail;
        this.userQuestion = userQuestion;
        this.aiResponse = aiResponse;
        this.reason = reason;
        this.timestamp = timestamp;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getConversationId() { return conversationId; }
    public void setConversationId(Long conversationId) { this.conversationId = conversationId; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getUserQuestion() { return userQuestion; }
    public void setUserQuestion(String userQuestion) { this.userQuestion = userQuestion; }

    public String getAiResponse() { return aiResponse; }
    public void setAiResponse(String aiResponse) { this.aiResponse = aiResponse; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
