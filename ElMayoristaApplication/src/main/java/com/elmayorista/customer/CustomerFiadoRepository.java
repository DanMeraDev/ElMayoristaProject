package com.elmayorista.customer;

import com.elmayorista.fiado.FiadoStatus;
import com.elmayorista.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CustomerFiadoRepository extends JpaRepository<CustomerFiado, Long> {

    List<CustomerFiado> findBySellerIdOrderByCreatedAtDesc(UUID sellerId);

    List<CustomerFiado> findAllByOrderByCreatedAtDesc();

    List<CustomerFiado> findByStatusAndSettledInCycleFalse(FiadoStatus status);

    List<CustomerFiado> findBySellerAndStatusAndSettledInCycleFalse(User seller, FiadoStatus status);
}
