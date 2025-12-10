package com.dashboard.reports.model;

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
    
    private String category;
    
    private String period;
    
    private Long fileSize;
    
    private String delimiter;
    
    private Integer rowCount;
    
    private List<String> headers;
    
    private List<Map<String, Object>> rows;
    
    private Map<String, Object> metadata;
    
    private LocalDateTime uploadedAt;
    
    private String status;
    
    private String aiSummary;
    
    private List<String> aiInsights;

    private boolean isPublic = false;
    
    public CsvReport(String fileName, Long userId) {
        this.fileName = fileName;
        this.userId = userId;
        this.uploadedAt = LocalDateTime.now();
        this.status = "UPLOADED";
    }
}
