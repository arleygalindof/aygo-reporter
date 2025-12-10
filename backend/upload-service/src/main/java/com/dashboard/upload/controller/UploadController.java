package com.dashboard.upload.controller;

import com.dashboard.upload.model.CsvReport;
import com.dashboard.upload.service.CsvService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/csv")
@Slf4j
@RequiredArgsConstructor
public class UploadController {

    private final CsvService csvService;

    @PostMapping(value = "/upload", consumes = "multipart/form-data", produces = "application/json;charset=UTF-8")
    public ResponseEntity<?> uploadCsv(
            @RequestParam("file") MultipartFile file,
            @RequestParam("userId") Long userId,
            @RequestParam("category") String category,
            @RequestParam("period") String period,
            @RequestParam(value = "isPublic", defaultValue = "false") boolean isPublic) {
        
        log.info("Recibiendo upload de CSV: {} de usuario: {}, categoría: {}, período: {}", 
                file.getOriginalFilename(), userId, category, period);

        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "El archivo está vacío"));
            }

            if (!file.getOriginalFilename().toLowerCase().endsWith(".csv")) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Solo se permiten archivos CSV"));
            }

            CsvReport report = csvService.uploadAndParseCsv(file, userId, category, period, isPublic);
            
            log.info("CSV procesado exitosamente con ID: {}", report.getId());
            
            return ResponseEntity.ok(Map.of(
                    "message", "CSV procesado exitosamente",
                    "reportId", report.getId(),
                    "fileName", report.getOriginalFileName(),
                    "rowCount", report.getRowCount(),
                    "columnCount", report.getHeaders().size()
            ));

        } catch (Exception e) {
            log.error("Error procesando CSV: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Error procesando CSV: " + e.getMessage()));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of("status", "Upload Service running"));
    }
}
