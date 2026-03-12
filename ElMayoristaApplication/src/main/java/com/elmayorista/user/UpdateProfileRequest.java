package com.elmayorista.user;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String fullName;
    private String nickname;
    private String bio;
    private String city;
    private String phoneNumber;
}
