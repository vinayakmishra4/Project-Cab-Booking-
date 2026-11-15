package com.murali.cabbooking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CarRegistrationRequest(
        @NotBlank
        @Size(max = 100)
        String model,

        @NotBlank
        @Size(max = 20)
        @Pattern(regexp = "[A-Za-z0-9 -]+", message = "Enter a valid vehicle registration number.")
        String carNumber,

        @NotBlank
        @Pattern(regexp = "Mini|Sedan|SUV|XL", message = "Select a valid car category.")
        String vehicleType
) {
}
