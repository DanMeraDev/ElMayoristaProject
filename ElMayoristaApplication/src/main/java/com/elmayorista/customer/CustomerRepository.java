package com.elmayorista.customer;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    List<Customer> findAllByOrderByCreatedAtDesc();

    List<Customer> findByStatus(CustomerStatus status);

    List<Customer> findByStatusOrderByFullNameAsc(CustomerStatus status);

    boolean existsByIdNumber(String idNumber);
}
