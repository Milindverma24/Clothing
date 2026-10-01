package com.clothing.service;

import com.clothing.dto.CitationSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

@Service
public class AiService {

    private static final Logger log = LoggerFactory.getLogger(AiService.class);

    @Value("${ai.api-key:}")
    private String apiKey;

    @Value("${ai.model:gemini-1.5-flash}")
    private String modelName;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    /**
     * Generates a grounded, hallucination-controlled answer using only retrieved context.
     */
    public GroundedResult generateGroundedAnswer(String userQuestion, List<RetrievedChunk> chunks) {
        // Strict grounding rule: If no chunks retrieved, do not hallucinate!
        if (chunks == null || chunks.isEmpty()) {
            return new GroundedResult(
                    "I couldn't find that information in our official knowledge base. For further assistance with custom inquiries, please reach out to our customer support team.",
                    Collections.emptyList()
            );
        }

        List<CitationSource> sources = new ArrayList<>();
        StringBuilder contextText = new StringBuilder();

        for (RetrievedChunk chunk : chunks) {
            String snippet = chunk.getContent().length() > 120
                    ? chunk.getContent().substring(0, 117) + "..."
                    : chunk.getContent();
            sources.add(new CitationSource(
                    chunk.getDocumentName(),
                    chunk.getPageNumber(),
                    snippet
            ));
            contextText.append("Source: ").append(chunk.getDocumentName())
                       .append(" (Page ").append(chunk.getPageNumber()).append("):\n")
                       .append(chunk.getContent()).append("\n\n");
        }

        // If an external AI API key is configured, invoke external LLM
        if (apiKey != null && !apiKey.isBlank() && !apiKey.startsWith("your_")) {
            try {
                String externalAnswer = callExternalLlm(userQuestion, contextText.toString());
                if (externalAnswer != null && !externalAnswer.isBlank()) {
                    return new GroundedResult(externalAnswer, sources);
                }
            } catch (Exception e) {
                log.warn("External LLM call failed, falling back to local synthesis: " + e.getMessage());
            }
        }

        // Contextual synthesis strictly extracted from the retrieved text
        String synthesizedAnswer = synthesizeGroundedResponse(userQuestion, chunks);
        return new GroundedResult(synthesizedAnswer, sources);
    }

    /**
     * Calls external Gemini/OpenAI API if key is present.
     */
    private String callExternalLlm(String question, String context) throws Exception {
        String systemPrompt = "You are the premium clothing store customer assistant.\n"
                + "Answer questions using ONLY the retrieved knowledge-base context below.\n"
                + "Do not invent policies, prices, delivery times, return rules, or discounts.\n"
                + "If the answer is not present in the context, state that it is not available in the knowledge base.\n\n"
                + "Context:\n" + context;

        // OpenAI-compatible endpoint
        String jsonPayload = String.format(
                "{\"model\":\"%s\",\"messages\":[{\"role\":\"system\",\"content\":%s},{\"role\":\"user\",\"content\":%s}],\"temperature\":0.2}",
                modelName,
                escapeJson(systemPrompt),
                escapeJson(question)
        );

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.openai.com/v1/chat/completions"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .timeout(Duration.ofSeconds(15))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() == 200) {
            // Extract content from choices[0].message.content
            String body = response.body();
            int contentIdx = body.indexOf("\"content\":");
            if (contentIdx != -1) {
                int start = body.indexOf("\"", contentIdx + 10) + 1;
                int end = body.indexOf("\"", start);
                if (end > start) {
                    return body.substring(start, end).replace("\\n", "\n").replace("\\\"", "\"");
                }
            }
        }
        return null;
    }

    /**
     * Intelligent local grounded response synthesizer strictly using passage contents.
     */
    private String synthesizeGroundedResponse(String question, List<RetrievedChunk> chunks) {
        String q = question.toLowerCase();

        // Check topic intent to format the most direct and helpful answer
        boolean isReturn = q.contains("return") || q.contains("refund") || q.contains("exchange") || q.contains("replace");
        boolean isShipping = q.contains("ship") || q.contains("deliver") || q.contains("cod") || q.contains("cash on delivery") || q.contains("track");
        boolean isSize = q.contains("size") || q.contains("fit") || q.contains("chart") || q.contains("measurement") || q.contains("chest");

        StringBuilder answer = new StringBuilder();

        if (isReturn) {
            answer.append("According to our Return & Refund Policy:\n\n");
        } else if (isShipping) {
            answer.append("Here are our Shipping & Delivery details:\n\n");
        } else if (isSize) {
            answer.append("According to our Garment Size & Fit Guide:\n\n");
        } else {
            answer.append("Based on our store knowledge base:\n\n");
        }

        // Collect key bullet points from the highest-ranked chunks
        Set<String> addedSentences = new LinkedHashSet<>();
        for (RetrievedChunk chunk : chunks) {
            String[] sentences = chunk.getContent().split("(?<=[.!?])\\s+");
            for (String s : sentences) {
                String clean = s.trim();
                if (clean.length() > 25 && !addedSentences.contains(clean)) {
                    addedSentences.add(clean);
                    answer.append("• ").append(clean).append("\n");
                    if (addedSentences.size() >= 4) break;
                }
            }
            if (addedSentences.size() >= 4) break;
        }

        return answer.toString().trim();
    }

    private String escapeJson(String s) {
        return "\"" + s.replace("\\", "\\\\")
                       .replace("\"", "\\\"")
                       .replace("\n", "\\n")
                       .replace("\r", "\\r")
                       .replace("\t", "\\t") + "\"";
    }

    public static class GroundedResult {
        public final String answer;
        public final List<CitationSource> sources;

        public GroundedResult(String answer, List<CitationSource> sources) {
            this.answer = answer;
            this.sources = sources;
        }
    }
}
