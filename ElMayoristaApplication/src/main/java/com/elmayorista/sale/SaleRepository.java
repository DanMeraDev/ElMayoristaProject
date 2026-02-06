package com.elmayorista.sale;

import com.elmayorista.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SaleRepository extends JpaRepository<Sale, Long> {

    Optional<Sale> findByOrderNumber(String orderNumber);

    boolean existsByOrderNumber(String orderNumber);

    List<Sale> findBySeller(User seller);

    Page<Sale> findBySeller(User seller, Pageable pageable);

    List<Sale> findByStatus(SaleStatus status);

    Page<Sale> findByStatus(SaleStatus status, Pageable pageable);

    List<Sale> findByCustomerNameContainingIgnoreCase(String customerName);

    @Query("SELECT s FROM Sale s WHERE s.orderDate BETWEEN :startDate AND :endDate")
    List<Sale> findSalesBetweenDates(LocalDateTime startDate, LocalDateTime endDate);

    @Query("SELECT SUM(s.total) FROM Sale s WHERE s.status = :status")
    BigDecimal sumTotalByStatus(SaleStatus status);

    @Query("SELECT SUM(s.commissionAmount) FROM Sale s WHERE s.seller = :seller AND s.status = 'APPROVED'")
    BigDecimal sumCommissionAmountBySeller(User seller);

    @Query("SELECT COALESCE(SUM(s.commissionAmount), 0) FROM Sale s WHERE s.seller = :seller AND s.status = 'APPROVED' AND s.commissionSettled = false")
    BigDecimal sumUnsettledApprovedCommissionBySeller(User seller);

    @Query("SELECT s FROM Sale s WHERE s.seller = :seller AND s.orderDate BETWEEN :startDate AND :endDate")
    List<Sale> findSalesBySellerAndOrderDateBetween(User seller, LocalDateTime startDate, LocalDateTime endDate);

    List<Sale> findByStatusAndCommissionSettledFalse(SaleStatus status);
}
