package com.clothing.repository;

import com.clothing.entity.SupportTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {
    Optional<SupportTicket> findByTicketId(String ticketId);
    List<SupportTicket> findAllByUserIdOrderByCreatedAtDesc(Long userId);
}
