package com.murali.cabbooking.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String role;
    private String employeeId;
    private String name;
    private String email;
    private String phone;
    private String licenseNumber;
    private String password;
    private String confirmPassword;
}
