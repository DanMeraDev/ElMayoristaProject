package com.elmayorista.report;

import com.elmayorista.dto.CycleDTO;
import com.elmayorista.dto.Mapper;
import com.elmayorista.dto.SaleDTO;
import com.elmayorista.sale.Sale;
import com.elmayorista.sale.SaleService;
import com.elmayorista.service.FileStorageService;
import com.elmayorista.service.PdfExtractionService;
import com.elmayorista.user.User;
import com.elmayorista.user.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Controller for report-related operations.
 */
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private static final Logger log = LoggerFactory.getLogger(ReportController.class);

    private final PdfExtractionService pdfExtractionService;
    private final CycleService cycleService;
    private final SaleService saleService;
    private final FileStorageService fileStorageService;
    private final Mapper mapper;

    /**
     * Upload and process a sales report PDF.
     */
    @PostMapping("/upload-report")
    public ResponseEntity<SaleDTO> processReport(@RequestParam("file") MultipartFile file,
            Authentication authentication) {
        try {
            // 1. Get authenticated user
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            User seller = userDetails.getUser();

            // 2. Upload the PDF to the "pdfs" folder in R2
            String pdfUrl = fileStorageService.uploadFile(file, "pdfs");

            // 3. Extract sale data from the PDF using the consistent, simplified service
            Sale saleData = pdfExtractionService.extractSaleData(file);

            // 4. Combine data and save the Sale
            saleData.setSeller(seller);
            saleData.setReportPdfUrl(pdfUrl); // Set the new PDF URL

            Sale createdSale = saleService.createSale(saleData);

            // 5. Map to DTO and return
            SaleDTO response = mapper.toSaleDTO(createdSale);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error processing report PDF", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get all closed cycles (history).
     */
    @GetMapping("/cycles")
    public ResponseEntity<List<CycleDTO>> getAllCycles() {
        try {
            List<CycleDTO> cycles = cycleService.getAllCycles();
            return ResponseEntity.ok(cycles);
        } catch (Exception e) {
            log.error("Error fetching cycles", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get current cycle statistics (pending to close).
     */
    @GetMapping("/current-cycle")
    public ResponseEntity<CycleDTO> getCurrentCycle() {
        try {
            CycleDTO currentCycle = cycleService.getCurrentCycleStats();
            return ResponseEntity.ok(currentCycle);
        } catch (Exception e) {
            log.error("Error fetching current cycle", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get a specific cycle by ID.
     */
    @GetMapping("/cycles/{id}")
    public ResponseEntity<CycleDTO> getCycleById(@PathVariable Long id) {
        try {
            CycleDTO cycle = cycleService.getCycleById(id);
            if (cycle == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(cycle);
        } catch (Exception e) {
            log.error("Error fetching cycle {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Close the current cycle and download the Excel report.
     */
    @PostMapping("/close-cycle")
    public ResponseEntity<byte[]> closeCycle() {
        try {
            byte[] report = cycleService.closeCycle();

            String filename = "Cierre_Ciclo_" + java.time.LocalDate.now() + ".xlsx";

            return ResponseEntity.ok()
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=" + filename)
                    .contentType(org.springframework.http.MediaType
                            .parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(report);

        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage().getBytes());
        } catch (Exception e) {
            log.error("Error closing cycle", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
