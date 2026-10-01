package com.clothing.dto;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class AiConversationStatsDTO {
    private long totalConversations;
    private long todayConversations;
    private long activeConversations;
    private long totalMessages;
    private long totalRagQueries;
    private long totalProductSearches;
    private long unansweredCount;
    private double avgMessagesPerConversation;
    private double avgResponseLatencyMs;
    private long helpfulCount;
    private long notHelpfulCount;
    private double satisfactionRate;
    private Map<String, Long> intentBreakdown = new HashMap<>();
    private List<Map<String, Object>> topCitedDocuments = new ArrayList<>();
    private List<Map<String, Object>> topRecommendedProducts = new ArrayList<>();

    public AiConversationStatsDTO() {}

    public long getTotalConversations() { return totalConversations; }
    public void setTotalConversations(long totalConversations) { this.totalConversations = totalConversations; }

    public long getTodayConversations() { return todayConversations; }
    public void setTodayConversations(long todayConversations) { this.todayConversations = todayConversations; }

    public long getActiveConversations() { return activeConversations; }
    public void setActiveConversations(long activeConversations) { this.activeConversations = activeConversations; }

    public long getTotalMessages() { return totalMessages; }
    public void setTotalMessages(long totalMessages) { this.totalMessages = totalMessages; }

    public long getTotalRagQueries() { return totalRagQueries; }
    public void setTotalRagQueries(long totalRagQueries) { this.totalRagQueries = totalRagQueries; }

    public long getTotalProductSearches() { return totalProductSearches; }
    public void setTotalProductSearches(long totalProductSearches) { this.totalProductSearches = totalProductSearches; }

    public long getUnansweredCount() { return unansweredCount; }
    public void setUnansweredCount(long unansweredCount) { this.unansweredCount = unansweredCount; }

    public double getAvgMessagesPerConversation() { return avgMessagesPerConversation; }
    public void setAvgMessagesPerConversation(double avgMessagesPerConversation) { this.avgMessagesPerConversation = avgMessagesPerConversation; }

    public double getAvgResponseLatencyMs() { return avgResponseLatencyMs; }
    public void setAvgResponseLatencyMs(double avgResponseLatencyMs) { this.avgResponseLatencyMs = avgResponseLatencyMs; }

    public long getHelpfulCount() { return helpfulCount; }
    public void setHelpfulCount(long helpfulCount) { this.helpfulCount = helpfulCount; }

    public long getNotHelpfulCount() { return notHelpfulCount; }
    public void setNotHelpfulCount(long notHelpfulCount) { this.notHelpfulCount = notHelpfulCount; }

    public double getSatisfactionRate() { return satisfactionRate; }
    public void setSatisfactionRate(double satisfactionRate) { this.satisfactionRate = satisfactionRate; }

    public Map<String, Long> getIntentBreakdown() { return intentBreakdown; }
    public void setIntentBreakdown(Map<String, Long> intentBreakdown) { this.intentBreakdown = intentBreakdown; }

    public List<Map<String, Object>> getTopCitedDocuments() { return topCitedDocuments; }
    public void setTopCitedDocuments(List<Map<String, Object>> topCitedDocuments) { this.topCitedDocuments = topCitedDocuments; }

    public List<Map<String, Object>> getTopRecommendedProducts() { return topRecommendedProducts; }
    public void setTopRecommendedProducts(List<Map<String, Object>> topRecommendedProducts) { this.topRecommendedProducts = topRecommendedProducts; }
}
