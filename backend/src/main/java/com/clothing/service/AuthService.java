package com.clothing.service;

import com.clothing.dto.*;
import com.clothing.entity.SecurityAuditLog;
import com.clothing.entity.User;
import com.clothing.entity.UserAuthProvider;
import com.clothing.entity.UserNotification;
import com.clothing.exception.ApiException;
import com.clothing.repository.SecurityAuditLogRepository;
import com.clothing.repository.UserAuthProviderRepository;
import com.clothing.repository.UserNotificationRepository;
import com.clothing.repository.UserRepository;
import com.clothing.security.JwtTokenProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final UserAuthProviderRepository authProviderRepository;
    private final SecurityAuditLogRepository auditLogRepository;
    private final UserNotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(
        UserRepository userRepository,
        UserAuthProviderRepository authProviderRepository,
        SecurityAuditLogRepository auditLogRepository,
        UserNotificationRepository notificationRepository,
        PasswordEncoder passwordEncoder,
        JwtTokenProvider jwtTokenProvider
    ) {
        this.userRepository = userRepository;
        this.authProviderRepository = authProviderRepository;
        this.auditLogRepository = auditLogRepository;
        this.notificationRepository = notificationRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request, String ipAddress) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new ApiException("Passwords do not match");
        }

        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ApiException("An account with this email address already exists. Please sign in.");
        }

        User user = new User();
        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone());
        user.setRole("CUSTOMER");
        user.setStatus("ACTIVE");
        user.setEmailVerified(true); // Enabled by default for smooth UX while verification token is recorded
        user.setVerificationToken(UUID.randomUUID().toString());
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        user.setLastLoginAt(LocalDateTime.now());

        user = userRepository.save(user);

        // Record LOCAL auth provider
        UserAuthProvider localProvider = new UserAuthProvider(user, "LOCAL", email, email);
        authProviderRepository.save(localProvider);

        // Welcome notification
        notificationRepository.save(new UserNotification(
            user,
            "Welcome to Nova",
            "Welcome to Nova. Enjoy complimentary delivery on orders over ₹1,499.",
            "ACCOUNT",
            "/account"
        ));

        // Audit log
        auditLogRepository.save(new SecurityAuditLog(user.getId(), "REGISTER", ipAddress, "Account registered with email " + email));
        auditLogRepository.save(new SecurityAuditLog(user.getId(), "LOGIN_SUCCESS", ipAddress, "Initial login upon registration"));

        String token = jwtTokenProvider.generateToken(user);
        return new AuthResponse(token, UserDto.fromEntity(user));
    }

    @Transactional
    public AuthResponse login(LoginRequest request, String ipAddress) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(email)
            .orElseThrow(() -> {
                auditLogRepository.save(new SecurityAuditLog(null, "LOGIN_FAILURE", ipAddress, "Failed login attempt for " + email));
                return new ApiException("Invalid email or password");
            });

        if ("DEACTIVATED".equalsIgnoreCase(user.getStatus())) {
            throw new ApiException("This account has been deactivated. Please contact support to reactivate.");
        }
        if ("SUSPENDED".equalsIgnoreCase(user.getStatus())) {
            throw new ApiException("This account is currently suspended. Please contact customer support.");
        }

        if (!user.hasPassword() || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            auditLogRepository.save(new SecurityAuditLog(user.getId(), "LOGIN_FAILURE", ipAddress, "Incorrect password for " + email));
            throw new ApiException("Invalid email or password");
        }

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        auditLogRepository.save(new SecurityAuditLog(user.getId(), "LOGIN_SUCCESS", ipAddress, "Logged in via Email/Password"));

        String token = jwtTokenProvider.generateToken(user);
        return new AuthResponse(token, UserDto.fromEntity(user));
    }

    @Transactional
    public AuthResponse loginWithGoogle(GoogleAuthRequest request, String ipAddress) {
        String email = request.getEmail().trim().toLowerCase();
        if (email.isBlank()) {
            throw new ApiException("Google authentication did not provide an email");
        }

        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);

        if (user == null) {
            // Create new customer account
            user = new User();
            user.setEmail(email);
            user.setFirstName(request.getGivenName() != null && !request.getGivenName().isBlank()
                ? request.getGivenName()
                : (request.getName() != null ? request.getName() : "Customer"));
            user.setLastName(request.getFamilyName() != null ? request.getFamilyName() : "");
            user.setAvatarUrl(request.getPicture());
            user.setEmailVerified(true);
            user.setRole("CUSTOMER"); // Important: always customer
            user.setStatus("ACTIVE");
            user.setCreatedAt(LocalDateTime.now());
            user.setUpdatedAt(LocalDateTime.now());
            user.setLastLoginAt(LocalDateTime.now());
            user = userRepository.save(user);

            UserAuthProvider provider = new UserAuthProvider(
                user,
                "GOOGLE",
                request.getGoogleId() != null ? request.getGoogleId() : email,
                email
            );
            authProviderRepository.save(provider);

            notificationRepository.save(new UserNotification(
                user,
                "Welcome to Nova",
                "Your account was created via Google Sign-In. Welcome to Nova.",
                "ACCOUNT",
                "/account"
            ));

            auditLogRepository.save(new SecurityAuditLog(user.getId(), "ACCOUNT_CREATED", ipAddress, "Created via Google OAuth"));
            auditLogRepository.save(new SecurityAuditLog(user.getId(), "GOOGLE_LOGIN_SUCCESS", ipAddress, "Initial login via Google"));
        } else {
            // Existing user: link Google provider if missing
            user.setLastLoginAt(LocalDateTime.now());
            user.setEmailVerified(true);
            if (user.getAvatarUrl() == null && request.getPicture() != null) {
                user.setAvatarUrl(request.getPicture());
            }
            userRepository.save(user);

            boolean hasGoogle = authProviderRepository.findByUserAndProvider(user, "GOOGLE").isPresent();
            if (!hasGoogle) {
                UserAuthProvider provider = new UserAuthProvider(
                    user,
                    "GOOGLE",
                    request.getGoogleId() != null ? request.getGoogleId() : email,
                    email
                );
                authProviderRepository.save(provider);
                auditLogRepository.save(new SecurityAuditLog(user.getId(), "GOOGLE_ACCOUNT_LINKED", ipAddress, "Linked Google account " + email));
            }
            auditLogRepository.save(new SecurityAuditLog(user.getId(), "GOOGLE_LOGIN_SUCCESS", ipAddress, "Logged in via Google"));
        }

        String token = jwtTokenProvider.generateToken(user);
        return new AuthResponse(token, UserDto.fromEntity(user));
    }

    @Transactional
    public String forgotPassword(String email, String ipAddress) {
        String cleanEmail = email.trim().toLowerCase();
        userRepository.findByEmailIgnoreCase(cleanEmail).ifPresent(user -> {
            String token = UUID.randomUUID().toString();
            user.setResetPasswordToken(token);
            user.setResetPasswordExpiry(LocalDateTime.now().plusHours(1));
            userRepository.save(user);

            auditLogRepository.save(new SecurityAuditLog(user.getId(), "FORGOT_PASSWORD_REQUEST", ipAddress, "Reset token generated"));
        });

        // Always return generic reassuring message to prevent account enumeration
        return "If an account exists for this email address, a password reset link has been dispatched.";
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request, String ipAddress) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new ApiException("Passwords do not match");
        }

        User user = userRepository.findByResetPasswordToken(request.getToken().trim())
            .orElseThrow(() -> new ApiException("Invalid or expired password reset link. Please request a new one."));

        if (user.getResetPasswordExpiry() == null || user.getResetPasswordExpiry().isBefore(LocalDateTime.now())) {
            throw new ApiException("Password reset link has expired. Please request a new one.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setResetPasswordToken(null);
        user.setResetPasswordExpiry(null);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        // Ensure LOCAL provider exists
        if (authProviderRepository.findByUserAndProvider(user, "LOCAL").isEmpty()) {
            authProviderRepository.save(new UserAuthProvider(user, "LOCAL", user.getEmail(), user.getEmail()));
        }

        auditLogRepository.save(new SecurityAuditLog(user.getId(), "PASSWORD_CHANGED", ipAddress, "Password reset using reset token"));
        notificationRepository.save(new UserNotification(
            user,
            "Password Changed",
            "Your password has been successfully reset. If you did not make this change, please contact customer support immediately.",
            "SECURITY",
            "/account/security"
        ));
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request, String ipAddress) {
        if (!request.getNewPassword().equals(request.getConfirmNewPassword())) {
            throw new ApiException("New passwords do not match");
        }

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ApiException("User not found"));

        if (user.hasPassword()) {
            if (request.getCurrentPassword() == null || !passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
                throw new ApiException("Incorrect current password");
            }
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        // Ensure LOCAL provider is present
        if (authProviderRepository.findByUserAndProvider(user, "LOCAL").isEmpty()) {
            authProviderRepository.save(new UserAuthProvider(user, "LOCAL", user.getEmail(), user.getEmail()));
        }

        auditLogRepository.save(new SecurityAuditLog(userId, "PASSWORD_CHANGED", ipAddress, "Password changed via Account Security"));
        notificationRepository.save(new UserNotification(
            user,
            "Password Updated",
            "Your account password was updated successfully.",
            "SECURITY",
            "/account/security"
        ));
    }

    @Transactional
    public void unlinkGoogle(Long userId, String ipAddress) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ApiException("User not found"));

        if (!user.hasPassword()) {
            throw new ApiException("Cannot disconnect Google. Please create a password first so you don't lose access to your account.");
        }

        authProviderRepository.deleteByUserAndProvider(user, "GOOGLE");
        auditLogRepository.save(new SecurityAuditLog(userId, "GOOGLE_ACCOUNT_UNLINKED", ipAddress, "Google OAuth unlinked"));
        notificationRepository.save(new UserNotification(
            user,
            "Google Disconnected",
            "Google sign-in has been disconnected from your account.",
            "SECURITY",
            "/account/security"
        ));
    }

    @Transactional
    public void deleteAccount(Long userId, String ipAddress) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ApiException("User not found"));

        // Safe soft-deactivation (retains historical order records for accounting/legal compliance)
        user.setStatus("DEACTIVATED");
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        auditLogRepository.save(new SecurityAuditLog(userId, "ACCOUNT_DEACTIVATED", ipAddress, "User requested account deactivation"));
    }
}
