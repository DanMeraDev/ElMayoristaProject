package com.elmayorista.support;

import com.elmayorista.dto.TicketDTO;
import com.elmayorista.service.EmailService;
import com.elmayorista.user.User;
import com.elmayorista.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SupportTicketService {

    private final SupportTicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Value("${spring.mail.from}")
    private String adminEmail;

    /**
     * Create a new support ticket.
     */
    @Transactional
    public TicketDTO createTicket(java.util.UUID sellerId, TicketType type, String subject, String description) {
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new RuntimeException("Seller not found"));

        SupportTicket ticket = SupportTicket.builder()
                .seller(seller)
                .type(type)
                .status(TicketStatus.OPEN)
                .subject(subject)
                .description(description)
                .build();

        ticket = ticketRepository.save(ticket);
        log.info("Support ticket created: {} by seller: {}", ticket.getId(), seller.getFullName());

        // Send email notification to admin
        try {
            emailService.sendSupportTicketNotification(
                    adminEmail,
                    type.name(),
                    subject,
                    description,
                    seller.getFullName(),
                    seller.getEmail());
            log.info("Email notification sent to admin for ticket: {}", ticket.getId());
        } catch (Exception e) {
            log.error("Failed to send email notification for ticket: {}", ticket.getId(), e);
        }

        return toDTO(ticket);
    }

    /**
     * Get all tickets for a specific seller.
     */
    public List<TicketDTO> getSellerTickets(java.util.UUID sellerId) {
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new RuntimeException("Seller not found"));

        return ticketRepository.findBySellerOrderByCreatedAtDesc(seller)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get all tickets (admin only).
     */
    public List<TicketDTO> getAllTickets() {
        return ticketRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get tickets by status.
     */
    public List<TicketDTO> getTicketsByStatus(TicketStatus status) {
        return ticketRepository.findByStatusOrderByCreatedAtDesc(status)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get tickets by type.
     */
    public List<TicketDTO> getTicketsByType(TicketType type) {
        return ticketRepository.findByTypeOrderByCreatedAtDesc(type)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Update ticket status (admin only).
     */
    @Transactional
    public TicketDTO updateTicketStatus(Long ticketId, TicketStatus status, String adminNotes) {
        SupportTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        ticket.setStatus(status);
        if (adminNotes != null) {
            ticket.setAdminNotes(adminNotes);
        }
        if (status == TicketStatus.RESOLVED || status == TicketStatus.CLOSED) {
            ticket.setResolvedAt(LocalDateTime.now());
        }

        ticket = ticketRepository.save(ticket);
        log.info("Ticket {} status updated to: {}", ticketId, status);

        return toDTO(ticket);
    }

    /**
     * Convert entity to DTO.
     */
    private TicketDTO toDTO(SupportTicket ticket) {
        return TicketDTO.builder()
                .id(ticket.getId())
                .sellerId(ticket.getSeller().getId())
                .sellerName(ticket.getSeller().getFullName())
                .type(ticket.getType())
                .status(ticket.getStatus())
                .subject(ticket.getSubject())
                .description(ticket.getDescription())
                .adminNotes(ticket.getAdminNotes())
                .resolvedAt(ticket.getResolvedAt())
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .build();
    }
}
