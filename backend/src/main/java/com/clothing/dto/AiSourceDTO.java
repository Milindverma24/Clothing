package com.clothing.dto;

public class AiSourceDTO {
    private Long id;
    private Long documentId;
    private Long chunkId;
    private String documentName;
    private Integer pageNumber;
    private Double similarityScore;
    private String sourceExcerpt;

    public AiSourceDTO() {}

    public AiSourceDTO(Long id, Long documentId, Long chunkId, String documentName, Integer pageNumber, Double similarityScore, String sourceExcerpt) {
        this.id = id;
        this.documentId = documentId;
        this.chunkId = chunkId;
        this.documentName = documentName;
        this.pageNumber = pageNumber;
        this.similarityScore = similarityScore;
        this.sourceExcerpt = sourceExcerpt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getDocumentId() { return documentId; }
    public void setDocumentId(Long documentId) { this.documentId = documentId; }

    public Long getChunkId() { return chunkId; }
    public void setChunkId(Long chunkId) { this.chunkId = chunkId; }

    public String getDocumentName() { return documentName; }
    public void setDocumentName(String documentName) { this.documentName = documentName; }

    public Integer getPageNumber() { return pageNumber; }
    public void setPageNumber(Integer pageNumber) { this.pageNumber = pageNumber; }

    public Double getSimilarityScore() { return similarityScore; }
    public void setSimilarityScore(Double similarityScore) { this.similarityScore = similarityScore; }

    public String getSourceExcerpt() { return sourceExcerpt; }
    public void setSourceExcerpt(String sourceExcerpt) { this.sourceExcerpt = sourceExcerpt; }
}
