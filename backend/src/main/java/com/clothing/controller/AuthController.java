package com.clothing.controller;

import com.clothing.dto.*;
import com.clothing.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    @Value("${GOOGLE_CLIENT_ID:}")
    private String googleClientId;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
        @Valid @RequestBody RegisterRequest request,
        HttpServletRequest httpRequest
    ) {
        AuthResponse response = authService.register(request, httpRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.ok(response, "Account registered successfully"));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
        @Valid @RequestBody LoginRequest request,
        HttpServletRequest httpRequest
    ) {
        AuthResponse response = authService.login(request, httpRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.ok(response, "Logged in successfully"));
    }

    @PostMapping("/google")
    public ResponseEntity<ApiResponse<AuthResponse>> loginWithGoogle(
        @Valid @RequestBody GoogleAuthRequest request,
        HttpServletRequest httpRequest
    ) {
        AuthResponse response = authService.loginWithGoogle(request, httpRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.ok(response, "Authenticated via Google"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<String>> forgotPassword(
        @Valid @RequestBody ForgotPasswordRequest request,
        HttpServletRequest httpRequest
    ) {
        String msg = authService.forgotPassword(request.getEmail(), httpRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.ok(msg, msg));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<String>> resetPassword(
        @Valid @RequestBody ResetPasswordRequest request,
        HttpServletRequest httpRequest
    ) {
        authService.resetPassword(request, httpRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.ok("Password reset successfully. You can now sign in.", "Password reset successfully"));
    }

    @GetMapping("/config")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAuthConfig() {
        boolean googleEnabled = googleClientId != null && !googleClientId.isBlank() && !googleClientId.contains("dummy");
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
            "googleOAuthEnabled", true, // Google OAuth supported in both direct and GCP mode
            "googleClientId", googleClientId != null ? googleClientId : "",
            "passwordMinLength", 6
        )));
    }
}
