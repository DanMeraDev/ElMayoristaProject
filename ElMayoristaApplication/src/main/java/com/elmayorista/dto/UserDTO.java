package com.elmayorista.dto;

import com.elmayorista.user.Role;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
public class UserDTO {
    private UUID id;
    private String email;
    private String fullName;
    private String phoneNumber;
    private Set<Role> roles;
    private boolean enabled;
    private boolean pendingApproval;
    private BigDecimal commissionPercentage;
    private LocalDateTime createdAt;
}
