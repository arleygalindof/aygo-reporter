package com.dashboard.upload.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Document(collection = "csv_reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CsvReport {

    @Id
    private String id;

    private Long userId;
    
    private String fileName;
    
    private String originalFileName;
    
    private String category; // Ej: "Llamadas Emergencia 123", "Mascotas Esterilizadas"
    
    private String period; // Ej: "2025-10", "2025-11", "2025-12"
    
    private Long fileSize;
    
    private String delimiter; // Delimitador detectado: ',', ';', '\t', '|'
    
    private Integer rowCount;
    
    private List<String> headers;
    
    // Datos flexibles: cada fila es un Map de columna -> valor
    private List<Map<String, Object>> rows;
    
    // Metadata adicional para análisis
    private Map<String, Object> metadata;
    
    private LocalDateTime uploadedAt;
    
    private String status; // UPLOADED, PROCESSING, ANALYZED, ERROR
    
    private String aiSummary; // Resumen generado por IA
    
    private List<String> aiInsights; // Insights clave de la IA

    // Visibilidad: true = público (lo ve cualquiera), false = privado (solo el owner)
    private boolean isPublic = false;
    
    public CsvReport(String fileName, Long userId) {
        this.fileName = fileName;
        this.userId = userId;
        this.uploadedAt = LocalDateTime.now();
        this.status = "UPLOADED";
    }
}
