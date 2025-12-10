package com.dashboard.data.controller;

import com.dashboard.data.model.CsvReport;
import com.dashboard.data.service.CsvService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/csv")
@Slf4j
@RequiredArgsConstructor
public class CsvController {

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

    @GetMapping(value = "/user/{userId}", produces = "application/json;charset=UTF-8")
    public ResponseEntity<?> getUserReports(@PathVariable Long userId) {
        try {
            List<CsvReport> reports = csvService.getUserReports(userId);
            return ResponseEntity.ok(reports);
        } catch (Exception e) {
            log.error("Error obteniendo reportes: {}", e.getMessage());
            return ResponseEntity.status(500)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping(value = "/{reportId}", produces = "application/json;charset=UTF-8")
    public ResponseEntity<?> getReport(@PathVariable String reportId, @RequestParam(value = "userId", required = false) Long userId) {
        try {
            return csvService.getReportById(reportId, userId)
                    .<ResponseEntity<?>>map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.status(403).body(Map.of("error", "No autorizado o no encontrado")));
        } catch (Exception e) {
            log.error("Error obteniendo reporte: {}", e.getMessage());
            return ResponseEntity.status(500)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping(value = "/{reportId}", produces = "application/json;charset=UTF-8")
    public ResponseEntity<?> deleteReport(@PathVariable String reportId) {
        try {
            csvService.deleteReport(reportId);
            return ResponseEntity.ok(Map.of("message", "Reporte eliminado"));
        } catch (Exception e) {
            log.error("Error eliminando reporte: {}", e.getMessage());
            return ResponseEntity.status(500)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of("status", "Data Service (CSV) running"));
    }

    @GetMapping(value = "/stats/{userId}", produces = "application/json;charset=UTF-8")
    public ResponseEntity<?> getReporterStats(@PathVariable Long userId) {
        try {
            Map<String, Object> stats = csvService.getReporterStats(userId);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error obteniendo estadísticas: {}", e.getMessage());
            return ResponseEntity.status(500)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping(value = "/categories/{userId}", produces = "application/json;charset=UTF-8")
    public ResponseEntity<?> getUserCategories(@PathVariable Long userId) {
        try {
            Map<String, List<Map<String, Object>>> categories = csvService.getUserCategoriesWithPeriods(userId);
            return ResponseEntity.ok(categories);
        } catch (Exception e) {
            log.error("Error obteniendo categorías: {}", e.getMessage());
            return ResponseEntity.status(500)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
