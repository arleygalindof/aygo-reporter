package com.dashboard.data.controller;

import com.dashboard.data.model.Report;
import com.dashboard.data.service.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/reports")
@Slf4j
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @PostMapping
    public ResponseEntity<?> createReport(@RequestBody Map<String, Object> data) {
        log.info("Crear reporte");
        
        try {
            Report report = reportService.createReport(
                    ((Number) data.get("userId")).longValue(),
                    (String) data.get("title"),
                    (String) data.get("description"),
                    (String) data.get("data")
            );
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            log.error("Error creando reporte: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserReports(@PathVariable Long userId) {
        log.info("Obteniendo reportes del usuario: {}", userId);
        
        try {
            List<Report> reports = reportService.getUserReports(userId);
            return ResponseEntity.ok(reports);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getReport(@PathVariable Long id) {
        log.info("Obteniendo reporte: {}", id);
        
        try {
            Report report = reportService.getReportById(id);
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateReport(
            @PathVariable Long id,
            @RequestBody Map<String, String> data) {
        log.info("Actualizando reporte: {}", id);
        
        try {
            Report report = reportService.updateReport(
                    id,
                    data.get("title"),
                    data.get("description"),
                    data.get("status")
            );
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReport(@PathVariable Long id) {
        log.info("Eliminando reporte: {}", id);
        
        try {
            reportService.deleteReport(id);
            return ResponseEntity.ok(Map.of("message", "Reporte eliminado"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of("status", "Data Service running"));
    }

}
