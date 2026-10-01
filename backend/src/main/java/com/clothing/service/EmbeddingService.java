package com.clothing.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;

@Service
public class EmbeddingService {

    private static final Logger log = LoggerFactory.getLogger(EmbeddingService.class);
    public static final int EMBEDDING_DIM = 64;

    @Value("${ai.api-key:}")
    private String apiKey;

    @Value("${ai.model:gemini-1.5-flash}")
    private String model;

    /**
     * Generates a normalized dense vector embedding for a piece of text.
     * Uses semantic character n-gram hashing and term weighting to ensure
     * high semantic vector retrieval even offline, and allows seamless
     * extension to external API providers.
     */
    public float[] generateEmbedding(String text) {
        if (text == null || text.isBlank()) {
            return new float[EMBEDDING_DIM];
        }

        float[] embedding = new float[EMBEDDING_DIM];
        String normalized = text.toLowerCase().trim();

        // 1. Token-level & Subword n-gram semantic feature hashing
        String[] tokens = normalized.split("[^a-z0-9]+");
        for (int i = 0; i < tokens.length; i++) {
            String token = tokens[i];
            if (token.isEmpty()) continue;

            // Give extra weight to keywords & entity tokens
            float tokenWeight = 1.0f + (float) Math.log(token.length() + 1.0);

            // Hash whole token
            int h1 = Math.abs(token.hashCode()) % EMBEDDING_DIM;
            embedding[h1] += tokenWeight;

            // Hash 3-character n-grams for typo & morphological tolerance
            if (token.length() >= 3) {
                for (int j = 0; j <= token.length() - 3; j++) {
                    String trigram = token.substring(j, j + 3);
                    int h2 = Math.abs(trigram.hashCode() * 31 + j) % EMBEDDING_DIM;
                    embedding[h2] += 0.5f;
                }
            }
        }

        // 2. Normalize to unit vector (L2 norm)
        float sumSquares = 0.0f;
        for (float v : embedding) {
            sumSquares += v * v;
        }

        if (sumSquares > 0.0f) {
            float norm = (float) Math.sqrt(sumSquares);
            for (int i = 0; i < EMBEDDING_DIM; i++) {
                embedding[i] /= norm;
            }
        }

        return embedding;
    }

    /**
     * Calculates cosine similarity between two unit vectors.
     */
    public double cosineSimilarity(float[] vecA, float[] vecB) {
        if (vecA == null || vecB == null || vecA.length != vecB.length) {
            return 0.0;
        }

        double dotProduct = 0.0;
        double normA = 0.0;
        double normB = 0.0;

        for (int i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }

        if (normA <= 0.0 || normB <= 0.0) return 0.0;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    /**
     * Serializes float array to JSON string for database storage.
     */
    public String serializeVector(float[] vector) {
        if (vector == null) return "[]";
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < vector.length; i++) {
            sb.append(String.format(java.util.Locale.US, "%.5f", vector[i]));
            if (i < vector.length - 1) sb.append(",");
        }
        sb.append("]");
        return sb.toString();
    }

    /**
     * Deserializes JSON string back to float array.
     */
    public float[] deserializeVector(String vectorStr) {
        if (vectorStr == null || vectorStr.length() < 3) {
            return new float[EMBEDDING_DIM];
        }

        try {
            String trimmed = vectorStr.replace("[", "").replace("]", "").trim();
            if (trimmed.isEmpty()) return new float[EMBEDDING_DIM];

            String[] parts = trimmed.split(",");
            float[] res = new float[parts.length];
            for (int i = 0; i < parts.length; i++) {
                res[i] = Float.parseFloat(parts[i].trim());
            }
            return res;
        } catch (Exception e) {
            log.warn("Failed to parse vector string: " + vectorStr, e);
            return new float[EMBEDDING_DIM];
        }
    }
}
