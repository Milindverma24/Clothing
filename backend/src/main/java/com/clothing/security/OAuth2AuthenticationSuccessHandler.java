package com.clothing.security;

import com.clothing.entity.SecurityAuditLog;
import com.clothing.entity.User;
import com.clothing.entity.UserAuthProvider;
import com.clothing.repository.SecurityAuditLogRepository;
import com.clothing.repository.UserAuthProviderRepository;
import com.clothing.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private static final Logger log = LoggerFactory.getLogger(OAuth2AuthenticationSuccessHandler.class);

    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final UserAuthProviderRepository authProviderRepository;
    private final SecurityAuditLogRepository auditLogRepository;

    @Value("${app.oauth2.authorized-redirect-url:http://localhost:5173/login}")
    private String redirectUrl;

    public OAuth2AuthenticationSuccessHandler(
        JwtTokenProvider tokenProvider,
        UserRepository userRepository,
        UserAuthProviderRepository authProviderRepository,
        SecurityAuditLogRepository auditLogRepository
    ) {
        this.tokenProvider = tokenProvider;
        this.userRepository = userRepository;
        this.authProviderRepository = authProviderRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @Override
    public void onAuthenticationSuccess(
        HttpServletRequest request,
        HttpServletResponse response,
        Authentication authentication
    ) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email = oAuth2User.getAttribute("email");
        String googleId = oAuth2User.getAttribute("sub");
        String givenName = oAuth2User.getAttribute("given_name");
        String familyName = oAuth2User.getAttribute("family_name");
        String picture = oAuth2User.getAttribute("picture");

        if (email == null || email.isBlank()) {
            log.error("Google OAuth response missing email");
            getRedirectStrategy().sendRedirect(request, response, redirectUrl + "?error=" + URLEncoder.encode("Google account did not provide an email address", StandardCharsets.UTF_8));
            return;
        }

        // Account linking: check if user exists by email
        User user = userRepository.findByEmailIgnoreCase(email.trim()).orElse(null);

        if (user == null) {
            // Create new customer account
            user = new User();
            user.setEmail(email.toLowerCase().trim());
            user.setFirstName(givenName != null && !givenName.isBlank() ? givenName : "Customer");
            user.setLastName(familyName != null && !familyName.isBlank() ? familyName : "");
            user.setAvatarUrl(picture);
            user.setEmailVerified(true);
            user.setRole("CUSTOMER"); // Crucial: New Google users get CUSTOMER role, never admin
            user.setStatus("ACTIVE");
            user.setCreatedAt(LocalDateTime.now());
            user.setUpdatedAt(LocalDateTime.now());
            user.setLastLoginAt(LocalDateTime.now());
            user = userRepository.save(user);

            UserAuthProvider provider = new UserAuthProvider(user, "GOOGLE", googleId != null ? googleId : email, email);
            authProviderRepository.save(provider);

            auditLogRepository.save(new SecurityAuditLog(user.getId(), "ACCOUNT_CREATED", request.getRemoteAddr(), "Registered via Google OAuth"));
            auditLogRepository.save(new SecurityAuditLog(user.getId(), "GOOGLE_LOGIN_SUCCESS", request.getRemoteAddr(), "Initial Google Login"));
        } else {
            // Existing user: link Google provider if not yet linked
            user.setLastLoginAt(LocalDateTime.now());
            user.setEmailVerified(true);
            if (user.getAvatarUrl() == null && picture != null) {
                user.setAvatarUrl(picture);
            }
            userRepository.save(user);

            boolean hasGoogle = authProviderRepository.findByUserAndProvider(user, "GOOGLE").isPresent();
            if (!hasGoogle) {
                UserAuthProvider provider = new UserAuthProvider(user, "GOOGLE", googleId != null ? googleId : email, email);
                authProviderRepository.save(provider);
                auditLogRepository.save(new SecurityAuditLog(user.getId(), "GOOGLE_ACCOUNT_LINKED", request.getRemoteAddr(), "Linked Google account " + email));
            }
            auditLogRepository.save(new SecurityAuditLog(user.getId(), "GOOGLE_LOGIN_SUCCESS", request.getRemoteAddr(), "Logged in via Google OAuth"));
        }

        // Generate JWT for application session
        String token = tokenProvider.generateToken(user);

        // Redirect back to frontend
        String targetUrl = redirectUrl + "?oauth_token=" + token;
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
