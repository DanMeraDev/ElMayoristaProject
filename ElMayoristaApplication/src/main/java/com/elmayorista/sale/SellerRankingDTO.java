package com.elmayorista.sale;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@AllArgsConstructor
@lombok.NoArgsConstructor
public class SellerRankingDTO {
    private UUID sellerId;
    private String sellerName;
    private BigDecimal totalSales;
    private Long salesCount;
    private String profilePhotoUrl;

    // Constructor without photo for JPQL projection
    public SellerRankingDTO(UUID sellerId, String sellerName, BigDecimal totalSales, Long salesCount) {
        this.sellerId = sellerId;
        this.sellerName = sellerName;
        this.totalSales = totalSales;
        this.salesCount = salesCount;
        this.profilePhotoUrl = null;
    }
}
