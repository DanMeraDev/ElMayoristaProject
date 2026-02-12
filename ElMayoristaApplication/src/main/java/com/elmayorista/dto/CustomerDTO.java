package com.elmayorista.dto;

import com.elmayorista.customer.CustomerStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerDTO {
    private Long id;
    private String fullName;
    private String idNumber;
    private String phoneNumber;
    private CustomerStatus status;
    private String rejectionReason;
    private String registeredByName;
    private LocalDateTime createdAt;
}
