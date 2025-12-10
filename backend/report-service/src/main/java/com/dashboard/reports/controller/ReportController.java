package com.dashboard.reports.controller;

import com.dashboard.reports.model.CsvReport;
import com.dashboard.reports.service.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/csv")
@Slf4j
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping(value = "/user/{userId}", produces = "application/json;charset=UTF-8")
    public ResponseEntity<?> getUserReports(@PathVariable Long userId) {
        try {
            List<CsvReport> reports = reportService.getUserReports(userId);
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
            return reportService.getReportById(reportId, userId)
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
            reportService.deleteReport(reportId);
            return ResponseEntity.ok(Map.of("message", "Reporte eliminado"));
        } catch (Exception e) {
            log.error("Error eliminando reporte: {}", e.getMessage());
            return ResponseEntity.status(500)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of("status", "Report Service running"));
    }

    @GetMapping(value = "/stats/{userId}", produces = "application/json;charset=UTF-8")
    public ResponseEntity<?> getReporterStats(@PathVariable Long userId) {
        try {
            Map<String, Object> stats = reportService.getReporterStats(userId);
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
            Map<String, List<Map<String, Object>>> categories = reportService.getUserCategoriesWithPeriods(userId);
            return ResponseEntity.ok(categories);
        } catch (Exception e) {
            log.error("Error obteniendo categorías: {}", e.getMessage());
            return ResponseEntity.status(500)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping(value = "/analysis/{userId}", produces = "application/json;charset=UTF-8")
    public ResponseEntity<?> getColumnAnalysis(
            @PathVariable Long userId, 
            @RequestParam String column) {
        try {
            Map<String, Object> analysis = reportService.getColumnAnalysis(userId, column);
            return ResponseEntity.ok(analysis);
        } catch (Exception e) {
            log.error("Error analizando columna {}: {}", column, e.getMessage());
            return ResponseEntity.status(500)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
