package com.elmayorista.fiado;

import com.elmayorista.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FiadoRepository extends JpaRepository<Fiado, Long> {

    List<Fiado> findBySellerIdOrderByCreatedAtDesc(UUID sellerId);

    List<Fiado> findBySellerAndSettledInCycleFalse(User seller);

    List<Fiado> findBySettledInCycleFalse();

    List<Fiado> findAllByOrderByCreatedAtDesc();
}
