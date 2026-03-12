package com.elmayorista.sale;

import com.elmayorista.config.Mapper;
import com.elmayorista.service.FileStorageService;
import com.elmayorista.service.PdfExtractionService;
import com.elmayorista.user.User;
import com.elmayorista.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/sales")
@RequiredArgsConstructor
public class SaleController {

    private final SaleService saleService;
    private final UserService userService;
    private final PdfExtractionService pdfExtractionService;
    private final FileStorageService fileStorageService;
    private final Mapper mapper;

    /**
     * Crea una nueva venta (Opción manual)
     */
    @PostMapping
    public ResponseEntity<SaleDTO> createSale(@Valid @RequestBody SaleCreateDTO saleDTO,
            Authentication authentication) {
        User seller = getUserFromAuth(authentication);
        Sale sale = mapper.toSaleEntity(saleDTO);
        sale.setSeller(seller);
        Sale createdSale = saleService.createSale(sale);
        return ResponseEntity.ok(mapper.toSaleDTO(createdSale));
    }

    /**
     * Crea una venta extrayendo datos de un PDF (Odoo)
     */
    @PostMapping("/upload-pdf")
    public ResponseEntity<SaleDTO> createSaleFromPdf(@RequestParam("file") MultipartFile file,
            Authentication authentication) throws IOException {
        User seller = getUserFromAuth(authentication);

        // Extraer datos del PDF
        Sale sale = pdfExtractionService.extractSaleData(file);
        sale.setSeller(seller);

        // Guardar el PDF original en R2 para que pueda visualizarse como comprobante
        String pdfUrl = fileStorageService.uploadFile(file, "receipts");
        sale.setReportPdfUrl(pdfUrl);

        // Guardar venta
        Sale createdSale = saleService.createSale(sale);
        return ResponseEntity.ok(mapper.toSaleDTO(createdSale));
    }

    /**
     * Crea una venta de televisor (formulario manual)
     */
    @PostMapping("/tv")
    public ResponseEntity<SaleDTO> createTvSale(@Valid @RequestBody TvSaleCreateDTO dto,
            Authentication authentication) {
        User seller = getUserFromAuth(authentication);
        Sale createdSale = saleService.createTvSale(dto, seller);
        return ResponseEntity.ok(mapper.toSaleDTO(createdSale));
    }

    /**
     * Ranking de los mejores vendedores por ventas aprobadas. Accesible por ADMIN y SELLER.
     */
    @GetMapping("/ranking")
    public ResponseEntity<List<SellerRankingDTO>> getSellerRanking(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(saleService.getTopSellers(Math.min(limit, 50)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SaleDTO> getSaleById(@PathVariable Long id) {
        return ResponseEntity.ok(saleService.getSaleDTOById(id));
    }

    /**
     * Procesa la devolución o cambio de una venta (solo ADMIN).
     * La venta debe estar APPROVED y no estar liquidada (commissionSettled=false).
     */
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping("/{id}/return")
    public ResponseEntity<SaleDTO> returnSale(
            @PathVariable Long id,
            @RequestBody ReturnRequest request) {
        Sale returned = saleService.processReturn(id, request.returnType(), request.reason());
        return ResponseEntity.ok(mapper.toSaleDTO(returned));
    }

    public record ReturnRequest(ReturnType returnType, String reason) {}

    /**
     * Elimina una venta (solo si el vendedor es el dueño y el estado lo permite)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSale(@PathVariable Long id, Authentication authentication) {
        User seller = getUserFromAuth(authentication);
        saleService.deleteSale(id, seller.getId());
        return ResponseEntity.noContent().build();
    }

    private User getUserFromAuth(Authentication authentication) {
        String email = authentication.getName();
        return userService.getUserByEmail(email)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Usuario autenticado no encontrado"));
    }
}
