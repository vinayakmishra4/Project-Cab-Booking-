package com.murali.cabbooking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record DriverProfileUpdateRequest(
        @NotBlank
        @Size(max = 100)
        String name,

        @NotBlank
        @Pattern(regexp = "[+0-9() .-]{7,20}", message = "Enter a valid phone number.")
        String phone,

        @NotBlank
        @Size(max = 50)
        String licenseNumber
) {
}
