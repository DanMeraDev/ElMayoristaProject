package com.elmayorista.admin;

import com.elmayorista.sale.Sale;
import com.elmayorista.sale.SaleRepository;
import com.elmayorista.sale.SaleStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class DataCorrectionController {

    private final SaleRepository saleRepository;

    /**
     * Temporary endpoint to fix existing sales that were incorrectly marked as
     * commission settled.
     * This corrects the bug where PaymentService was setting commissionSettled=true
     * when payment completed,
     * instead of waiting for cycle close.
     */
    @PostMapping("/fix-commission-flags")
    public ResponseEntity<String> fixCommissionFlags() {
        // Find all APPROVED sales that are marked as settled
        List<Sale> incorrectSales = saleRepository.findByStatus(SaleStatus.APPROVED).stream()
                .filter(Sale::isCommissionSettled)
                .toList();

        if (incorrectSales.isEmpty()) {
            return ResponseEntity.ok("No hay ventas que corregir. Todas las ventas aprobadas tienen el flag correcto.");
        }

        // Reset commissionSettled to false for these sales
        for (Sale sale : incorrectSales) {
            sale.setCommissionSettled(false);
        }
        saleRepository.saveAll(incorrectSales);

        return ResponseEntity.ok("Corregidas " + incorrectSales.size()
                + " ventas aprobadas que estaban marcadas incorrectamente como liquidadas.");
    }
}
