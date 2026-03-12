package com.elmayorista.user;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ProfileDTO {
    private UUID id;
    private String fullName;
    private String nickname;
    private String profilePhotoUrl;
    private String coverPhotoUrl;
    private String bio;
    private String city;
    private String phoneNumber;
    private String email;
    private LocalDateTime createdAt;

    // Stats
    private long approvedSalesCount;
    private BigDecimal totalApprovedSales;
    private int rankingPosition;
}
