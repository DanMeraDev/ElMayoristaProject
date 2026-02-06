package com.elmayorista.support;

import com.elmayorista.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {

    List<SupportTicket> findBySellerOrderByCreatedAtDesc(User seller);

    List<SupportTicket> findByStatusOrderByCreatedAtDesc(TicketStatus status);

    List<SupportTicket> findByTypeOrderByCreatedAtDesc(TicketType type);

    List<SupportTicket> findAllByOrderByCreatedAtDesc();
}
