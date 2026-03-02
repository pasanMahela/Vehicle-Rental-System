package com.orchid.maintenance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DamageDTO {
    @NotBlank(message = "Damage type is required")
    private String damageType;

    private String description;

    @Positive(message = "Estimated cost must be positive")
    private double estimatedCost;
}
