package com.clothing.controller;

import com.clothing.dto.CreateSupportTicketRequest;
import com.clothing.entity.SupportTicket;
import com.clothing.entity.User;
import com.clothing.entity.UserNotification;
import com.clothing.exception.ApiException;
import com.clothing.repository.SupportTicketRepository;
import com.clothing.repository.UserNotificationRepository;
import com.clothing.repository.UserRepository;
import com.clothing.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/support")
public class SupportTicketController {

    private final SupportTicketRepository supportTicketRepository;
    private final UserRepository userRepository;
    private final UserNotificationRepository notificationRepository;

    public SupportTicketController(
        SupportTicketRepository supportTicketRepository,
        UserRepository userRepository,
        UserNotificationRepository notificationRepository
    ) {
        this.supportTicketRepository = supportTicketRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
    }

    @PostMapping("/tickets")
    public ResponseEntity<Map<String, String>> createTicket(
        @RequestBody CreateSupportTicketRequest request,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (request.getSubject() == null || request.getSubject().isBlank()) {
            throw new ApiException("Ticket subject is required");
        }
        if (request.getMessage() == null || request.getMessage().isBlank()) {
            throw new ApiException("Ticket message is required");
        }

        User user = null;
        if (principal != null && principal.getId() != null) {
            user = userRepository.findById(principal.getId()).orElse(null);
        }

        SupportTicket ticket = new SupportTicket();
        String ticketId = "TCK-" + (1000 + (long)(Math.random() * 9000));
        ticket.setTicketId(ticketId);
        ticket.setUser(user);
        ticket.setCustomerEmail(user != null ? user.getEmail() : "customer@example.com");
        ticket.setCustomerName(user != null ? user.getFullName() : "Customer");
        ticket.setSubject(request.getSubject().trim());
        ticket.setMessage(request.getMessage().trim());
        ticket.setPriority(request.getPriority() != null ? request.getPriority().toUpperCase() : "MEDIUM");
        ticket.setStatus("OPEN");
        ticket.setCreatedAt(LocalDateTime.now());
        ticket.setUpdatedAt(LocalDateTime.now());

        supportTicketRepository.save(ticket);

        if (user != null) {
            notificationRepository.save(new UserNotification(
                user,
                "Support Ticket Created #" + ticket.getTicketId(),
                "Your inquiry regarding '" + ticket.getSubject() + "' has been escalated to senior concierge support.",
                "SUPPORT",
                "/account/support"
            ));
        }

        Map<String, String> response = new HashMap<>();
        response.put("ticketId", ticket.getTicketId());
        response.put("status", ticket.getStatus());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/tickets")
    public ResponseEntity<List<SupportTicket>> getMyTickets(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.ok(Collections.emptyList());
        }
        List<SupportTicket> tickets = supportTicketRepository.findAllByUserIdOrderByCreatedAtDesc(principal.getId());
        return ResponseEntity.ok(tickets != null ? tickets : Collections.emptyList());
    }
}
