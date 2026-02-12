package com.elmayorista.support;

import com.elmayorista.user.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/support")
@RequiredArgsConstructor
@Slf4j
public class SupportTicketController {

    private final SupportTicketService ticketService;

    /**
     * Create a new support ticket.
     */
    @PostMapping("/tickets")
    public ResponseEntity<TicketDTO> createTicket(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {

        log.info("Creating ticket request from user: {}", authentication.getName());
        log.info("Authorities: {}", authentication.getAuthorities());

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        java.util.UUID sellerId = userDetails.getUser().getId();

        String typeStr = (String) request.get("type");
        String subject = (String) request.get("subject");
        String description = (String) request.get("description");

        log.info("Ticket details - Type: {}, Subject: {}", typeStr, subject);

        TicketType type = TicketType.valueOf(typeStr);
        TicketDTO ticket = ticketService.createTicket(sellerId, type, subject, description);
        return ResponseEntity.ok(ticket);
    }

    /**
     * Get current seller's tickets.
     */
    @GetMapping("/my-tickets")
    public ResponseEntity<List<TicketDTO>> getMyTickets(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        java.util.UUID sellerId = userDetails.getUser().getId();

        log.info("Fetching tickets for seller ID: {}", sellerId);

        List<TicketDTO> tickets = ticketService.getSellerTickets(sellerId);
        return ResponseEntity.ok(tickets);
    }

    /**
     * Get all tickets (admin only).
     */
    @GetMapping("/tickets")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<TicketDTO>> getAllTickets(
            @RequestParam(required = false) TicketStatus status,
            @RequestParam(required = false) TicketType type) {

        log.info("Admin fetching all tickets");

        List<TicketDTO> tickets;
        if (status != null) {
            tickets = ticketService.getTicketsByStatus(status);
        } else if (type != null) {
            tickets = ticketService.getTicketsByType(type);
        } else {
            tickets = ticketService.getAllTickets();
        }

        return ResponseEntity.ok(tickets);
    }

    /**
     * Update ticket status (admin only).
     */
    @PutMapping("/tickets/{id}/status")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<TicketDTO> updateTicketStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {

        log.info("Admin updating ticket {} status", id);

        TicketStatus status = TicketStatus.valueOf(request.get("status"));
        String adminNotes = request.get("adminNotes");

        TicketDTO ticket = ticketService.updateTicketStatus(id, status, adminNotes);
        return ResponseEntity.ok(ticket);
    }
}
