package com.orchid.maintenance.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "damages")
public class Damage {
    @Id
    private String damageId;

    private String inspectionId;

    private String vehicleId;

    private String bookingId;

    private DamageType damageType;

    private String description;

    private double estimatedCost;

    public enum DamageType {
        SCRATCH, ENGINE, TIRE, INTERIOR
    }
}
