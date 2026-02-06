package com.elmayorista.report;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Cycle entity.
 */
@Repository
public interface CycleRepository extends JpaRepository<Cycle, Long> {

    /**
     * Find all cycles ordered by end date descending (most recent first).
     */
    List<Cycle> findAllByOrderByEndDateDesc();

    /**
     * Find cycles by status.
     */
    List<Cycle> findByStatus(CycleStatus status);

    /**
     * Find the most recent closed cycle.
     */
    Optional<Cycle> findTopByStatusOrderByEndDateDesc(CycleStatus status);
}
