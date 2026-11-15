package com.murali.cabbooking.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @NotBlank @Email String email,
        @NotBlank String portal,
        @NotBlank String oldPassword,
        @NotBlank @Size(min = 8, max = 100) String newPassword,
        @NotBlank String confirmPassword
) {
}
