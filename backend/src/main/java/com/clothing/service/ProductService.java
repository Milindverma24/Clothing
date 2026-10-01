package com.clothing.service;

import com.clothing.entity.Product;
import com.clothing.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public Page<Product> getProducts(int page, int size, String gender, String category, String sortBy) {
        Sort sort = Sort.by(Sort.Direction.DESC, "id");
        if ("price_asc".equalsIgnoreCase(sortBy)) {
            sort = Sort.by(Sort.Direction.ASC, "basePrice");
        } else if ("price_desc".equalsIgnoreCase(sortBy)) {
            sort = Sort.by(Sort.Direction.DESC, "basePrice");
        }

        PageRequest pageRequest = PageRequest.of(page, size, sort);

        if (gender != null && !gender.isBlank()) {
            return productRepository.findByGender(gender, pageRequest);
        }
        if (category != null && !category.isBlank()) {
            return productRepository.findByMasterCategory(category, pageRequest);
        }

        return productRepository.findAll(pageRequest);
    }

    public Optional<Product> getProductById(Long id) {
        return productRepository.findById(id);
    }

    public Optional<Product> getProductBySlug(String slug) {
        return productRepository.findBySlug(slug);
    }

    public Product saveProduct(Product product) {
        return productRepository.save(product);
    }
}
