package com.clothing.dto;

import java.util.List;

public class SearchResponseDTO {
    private List<ProductSearchDTO> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean last;
    private boolean fallback = false;
    private String correctedQuery;

    public SearchResponseDTO() {}

    public SearchResponseDTO(List<ProductSearchDTO> content, int page, int size, long totalElements, int totalPages, boolean last) {
        this.content = content;
        this.page = page;
        this.size = size;
        this.totalElements = totalElements;
        this.totalPages = totalPages;
        this.last = last;
    }

    public List<ProductSearchDTO> getContent() { return content; }
    public void setContent(List<ProductSearchDTO> content) { this.content = content; }

    public int getPage() { return page; }
    public void setPage(int page) { this.page = page; }

    public int getSize() { return size; }
    public void setSize(int size) { this.size = size; }

    public long getTotalElements() { return totalElements; }
    public void setTotalElements(long totalElements) { this.totalElements = totalElements; }

    public int getTotalPages() { return totalPages; }
    public void setTotalPages(int totalPages) { this.totalPages = totalPages; }

    public boolean isLast() { return last; }
    public void setLast(boolean last) { this.last = last; }

    public boolean isFallback() { return fallback; }
    public void setFallback(boolean fallback) { this.fallback = fallback; }

    public String getCorrectedQuery() { return correctedQuery; }
    public void setCorrectedQuery(String correctedQuery) { this.correctedQuery = correctedQuery; }
}
