package com.elmayorista.payment;

import com.elmayorista.sale.Sale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findBySale(Sale sale);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.sale = :sale")
    BigDecimal sumAmountBySale(Sale sale);
}
