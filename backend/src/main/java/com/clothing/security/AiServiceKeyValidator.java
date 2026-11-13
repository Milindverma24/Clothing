package com.clothing.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Validates that security-critical environment variables are configured
 * before the application begins serving requests.
 *
 * <p>In production, missing or default-placeholder values are fatal.
 * In development the check is advisory (logs a warning).
 */
@Component
public class AiServiceKeyValidator {

    private static final Logger log = LoggerFactory.getLogger(AiServiceKeyValidator.class);

    @Value("${AI_SERVICE_API_KEY:${ai.service.api-key:}}")
    private String aiServiceApiKey;

    @Value("${spring.profiles.active:dev}")
    private String activeProfile;

    @Value("${jwt.secret:}")
    private String jwtSecret;

    @EventListener(ApplicationReadyEvent.class)
    public void validateOnStartup() {
        boolean isProduction = activeProfile.contains("prod");

        // --- AI_SERVICE_API_KEY check ---
        if (!StringUtils.hasText(aiServiceApiKey)) {
            String msg = "AI_SERVICE_API_KEY environment variable is not set. " +
                    "The AI agent microservice will not be able to authenticate. " +
                    "Set this to a strong random secret (min 32 characters).";
            if (isProduction) {
                throw new IllegalStateException("[SECURITY] " + msg);
            } else {
                log.warn("[SECURITY WARNING] {}", msg);
            }
        } else if (aiServiceApiKey.equalsIgnoreCase("ai-agent-internal-secret-key")
                || aiServiceApiKey.equalsIgnoreCase("change-me")
                || aiServiceApiKey.length() < 32) {
            String msg = "AI_SERVICE_API_KEY appears to be a default/weak placeholder value. " +
                    "Replace it with a cryptographically random secret of at least 32 characters " +
                    "before deploying to production.";
            if (isProduction) {
                throw new IllegalStateException("[SECURITY] " + msg);
            } else {
                log.warn("[SECURITY WARNING] {}", msg);
            }
        }

        // --- JWT_SECRET check ---
        if (!StringUtils.hasText(jwtSecret)) {
            String msg = "jwt.secret (JWT_SECRET) environment variable is not set.";
            if (isProduction) {
                throw new IllegalStateException("[SECURITY] " + msg);
            } else {
                log.warn("[SECURITY WARNING] {}", msg);
            }
        } else if (jwtSecret.contains("clothing_super_secret") || jwtSecret.contains("change_in_production")) {
            String msg = "jwt.secret appears to be a default development placeholder. " +
                    "Replace it with a strong random secret before deploying to production.";
            if (isProduction) {
                throw new IllegalStateException("[SECURITY] " + msg);
            } else {
                log.warn("[SECURITY WARNING] {}", msg);
            }
        }

        if (!isProduction) {
            log.info("Security startup checks passed (dev mode — warnings above are advisory).");
        } else {
            log.info("Security startup checks passed.");
        }
    }
}

