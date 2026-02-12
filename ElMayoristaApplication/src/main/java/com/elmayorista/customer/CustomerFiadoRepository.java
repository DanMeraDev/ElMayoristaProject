package com.elmayorista.customer;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CustomerFiadoRepository extends JpaRepository<CustomerFiado, Long> {

    List<CustomerFiado> findBySellerIdOrderByCreatedAtDesc(UUID sellerId);

    List<CustomerFiado> findAllByOrderByCreatedAtDesc();
}
