package com.clothing.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * JWT authentication filter.
 *
 * Security model for the AI agent service-to-service path:
 *
 *   1. The AI agent sends `X-AI-Service-Key: <secret>` on every request.
 *   2. The secret is compared against the value from the environment variable
 *      AI_SERVICE_API_KEY (injected via @Value). No literal secret ever appears
 *      in source code.
 *   3. When the key matches AND the agent also sends `X-User-Bearer: <jwt>`,
 *      that JWT is verified with the same tokenProvider as the normal path —
 *      giving the authenticated customer identity.
 *   4. When the key matches but no customer JWT is present (guest / anonymous
 *      agent requests), the SecurityContext is left unauthenticated. Protected
 *      endpoints will return 401 as expected.
 *   5. There is NO fallback to any hardcoded email or developer account.
 *
 * IMPORTANT: Never add a "default user" fallback to this filter.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtTokenProvider tokenProvider;
    private final CustomUserDetailsService customUserDetailsService;

    /**
     * The AI agent service key. Loaded exclusively from the environment variable
     * AI_SERVICE_API_KEY. The application will fail fast at startup if the
     * variable is blank in a production environment (enforced in AiServiceKeyValidator).
     */
    @Value("${AI_SERVICE_API_KEY:${ai.service.api-key:}}")
    private String aiServiceApiKey;

    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider,
                                   CustomUserDetailsService customUserDetailsService) {
        this.tokenProvider = tokenProvider;
        this.customUserDetailsService = customUserDetailsService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        try {
            // --- Primary path: customer JWT in Authorization header ---
            String jwt = getJwtFromRequest(request);
            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
                authenticateViaJwt(jwt, request);
            } else {
                // --- Secondary path: AI agent service-to-service call ---
                authenticateViaServiceKey(request);
            }
        } catch (Exception ex) {
            // Log and continue; the downstream endpoint will return 401/403.
            log.error("Could not set user authentication in security context: {}", ex.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private void authenticateViaJwt(String jwt, HttpServletRequest request) {
        Long userId = tokenProvider.getUserIdFromToken(jwt);
        UserDetails userDetails = customUserDetailsService.loadUserById(userId);
        if (userDetails != null && userDetails.isEnabled()) {
            setAuthentication(userDetails, request);
        }
    }

    /**
     * Handles service-to-service calls from the AI agent microservice.
     *
     * <p>The agent may forward a customer's JWT in the {@code X-User-Bearer}
     * header when acting on behalf of an authenticated customer. That JWT is
     * re-verified here — the same cryptographic validation path as the primary
     * flow — so the agent cannot impersonate arbitrary users.
     *
     * <p>If no customer JWT is forwarded (guest or background calls) the
     * SecurityContext remains unauthenticated. <strong>No fallback user is
     * set.</strong>
     */
    private void authenticateViaServiceKey(HttpServletRequest request) {
        String incomingKey = request.getHeader("X-AI-Service-Key");
        if (!StringUtils.hasText(incomingKey)) {
            return; // Not a service-key request; leave context unauthenticated.
        }

        // Guard: reject if the environment variable was never configured.
        if (!StringUtils.hasText(aiServiceApiKey)) {
            log.warn("Received X-AI-Service-Key header but AI_SERVICE_API_KEY env var is not set. Rejecting.");
            return;
        }

        // Constant-time comparison to prevent timing attacks.
        if (!constantTimeEquals(aiServiceApiKey.trim(), incomingKey.trim())) {
            log.warn("Rejected request with invalid X-AI-Service-Key from {}", request.getRemoteAddr());
            return;
        }

        // The service key is valid. Now try to establish a customer identity.
        // The agent MUST forward the original customer JWT in X-User-Bearer.
        // We re-verify that JWT here — we do NOT trust any identity claim in a
        // plain header or request body.
        String forwardedBearer = request.getHeader("X-User-Bearer");
        if (StringUtils.hasText(forwardedBearer) && tokenProvider.validateToken(forwardedBearer)) {
            Long userId = tokenProvider.getUserIdFromToken(forwardedBearer);
            UserDetails userDetails = customUserDetailsService.loadUserById(userId);
            if (userDetails != null && userDetails.isEnabled()) {
                setAuthentication(userDetails, request);
                return;
            }
        }

        // No valid customer JWT forwarded → leave SecurityContext unauthenticated.
        // Protected endpoints will correctly return 401. This is intentional.
        log.debug("AI service-key request without a valid X-User-Bearer. SecurityContext remains unauthenticated.");
    }

    private void setAuthentication(UserDetails userDetails, HttpServletRequest request) {
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    /**
     * Constant-time string comparison that does not short-circuit on the first
     * mismatch, reducing the risk of timing-based side-channel attacks.
     */
    private static boolean constantTimeEquals(String a, String b) {
        if (a.length() != b.length()) {
            return false;
        }
        int result = 0;
        for (int i = 0; i < a.length(); i++) {
            result |= a.charAt(i) ^ b.charAt(i);
        }
        return result == 0;
    }
}
