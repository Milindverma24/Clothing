package com.clothing.service;

public class RetrievedChunk {
    private final String content;
    private final String documentName;
    private final Integer pageNumber;
    private final double score;

    public RetrievedChunk(String content, String documentName, Integer pageNumber, double score) {
        this.content = content;
        this.documentName = documentName;
        this.pageNumber = pageNumber;
        this.score = score;
    }

    public String getContent() { return content; }
    public String getDocumentName() { return documentName; }
    public Integer getPageNumber() { return pageNumber; }
    public double getScore() { return score; }
}
