package com.orchid.vehicle.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "system_settings")
public class SystemSettings {
    @Id
    private String settingsId;

    private Map<String, Double> advanceDepositByType;
}
