package com.elmayorista.auth;

import com.elmayorista.user.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
    private UUID userId;
    private String email;
    private String fullName;
    private Set<Role> roles;
    private boolean pendingApproval;
    private String message;
    private String token;
    
    @Builder.Default
    private String tokenType = "Bearer";
}
