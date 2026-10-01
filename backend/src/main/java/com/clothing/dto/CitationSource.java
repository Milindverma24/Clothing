package com.clothing.dto;

public class CitationSource {
    private String documentName;
    private Integer pageNumber;
    private String snippet;

    public CitationSource() {}

    public CitationSource(String documentName, Integer pageNumber, String snippet) {
        this.documentName = documentName;
        this.pageNumber = pageNumber;
        this.snippet = snippet;
    }

    public String getDocumentName() { return documentName; }
    public void setDocumentName(String documentName) { this.documentName = documentName; }

    public Integer getPageNumber() { return pageNumber; }
    public void setPageNumber(Integer pageNumber) { this.pageNumber = pageNumber; }

    public String getSnippet() { return snippet; }
    public void setSnippet(String snippet) { this.snippet = snippet; }
}
