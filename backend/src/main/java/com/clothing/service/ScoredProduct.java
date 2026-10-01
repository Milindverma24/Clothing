package com.clothing.service;

import com.clothing.entity.Product;

public class ScoredProduct {
    public final Product product;
    public final double score;

    public ScoredProduct(Product product, double score) {
        this.product = product;
        this.score = score;
    }
}
