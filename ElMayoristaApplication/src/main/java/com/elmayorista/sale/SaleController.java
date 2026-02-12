package com.elmayorista.sale;

import com.elmayorista.config.Mapper;
import com.elmayorista.service.PdfExtractionService;
import com.elmayorista.user.User;
import com.elmayorista.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import jakarta.validation.Valid;
import java.io.IOException;
import java.util.UUID;

@RestController
@RequestMapping("/api/sales")
@RequiredArgsConstructor
public class SaleController {

    private final SaleService saleService;
    private final UserService userService;
    private final PdfExtractionService pdfExtractionService;
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

        // Extraer datos
        Sale sale = pdfExtractionService.extractSaleData(file);
        sale.setSeller(seller);

        // Guardar venta preliminar
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

    @GetMapping("/{id}")
    public ResponseEntity<SaleDTO> getSaleById(@PathVariable Long id) {
        Sale sale = saleService.getSaleById(id);
        return ResponseEntity.ok(mapper.toSaleDTO(sale));
    }

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
        // Asumiendo que el principal es el email o UserDetails
        String email = authentication.getName();
        return userService.getUserByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario autenticado no encontrado"));
    }
}
