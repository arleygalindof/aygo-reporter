package com.dashboard.reports.service;

import com.dashboard.reports.model.CsvReport;
import com.dashboard.reports.repository.CsvReportRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class ReportService {

    private final CsvReportRepository csvReportRepository;

    public List<CsvReport> getUserReports(Long userId) {
        return csvReportRepository.findByIsPublicTrueOrUserId(userId)
                .stream()
                .sorted(Comparator.comparing(CsvReport::getUploadedAt).reversed())
                .toList();
    }

    public Map<String, List<Map<String, Object>>> getUserCategoriesWithPeriods(Long userId) {
        List<CsvReport> reports = csvReportRepository.findByIsPublicTrueOrUserId(userId);
        
        Map<String, List<Map<String, Object>>> categoriesMap = new LinkedHashMap<>();
        
        for (CsvReport report : reports) {
            String category = report.getCategory() != null ? report.getCategory() : "Sin categoría";
            
            categoriesMap.putIfAbsent(category, new ArrayList<>());
            
            Map<String, Object> periodInfo = new HashMap<>();
            periodInfo.put("period", report.getPeriod());
            periodInfo.put("reportId", report.getId());
            periodInfo.put("fileName", report.getOriginalFileName());
            periodInfo.put("rowCount", report.getRowCount());
            periodInfo.put("uploadedAt", report.getUploadedAt());
            
            // Evitar duplicados del mismo período
            boolean exists = categoriesMap.get(category).stream()
                    .anyMatch(p -> p.get("reportId").equals(report.getId()));
            
            if (!exists) {
                categoriesMap.get(category).add(periodInfo);
            }
        }
        
        return categoriesMap;
    }

    public Optional<CsvReport> getReportById(String id, Long requesterId) {
        Optional<CsvReport> reportOpt = csvReportRepository.findById(id);
        if (reportOpt.isEmpty()) return Optional.empty();

        CsvReport report = reportOpt.get();
        // Si es público o el requester es el owner, permitir; de lo contrario, negar
        if (report.isPublic() || (requesterId != null && requesterId.equals(report.getUserId()))) {
            return reportOpt;
        }
        return Optional.empty();
    }

    public void deleteReport(String id) {
        csvReportRepository.deleteById(id);
    }

    public Map<String, Object> getReporterStats(Long userId) {
        List<CsvReport> userReports = csvReportRepository.findByUserId(userId);
        
        Map<String, Object> stats = new HashMap<>();
        
        // Total de categorías
        long totalCategories = userReports.stream()
                .map(CsvReport::getCategory)
                .filter(Objects::nonNull)
                .distinct()
                .count();
        stats.put("totalCategories", totalCategories);
        
        // Total de reportes
        stats.put("totalReports", userReports.size());
        
        // Reportes públicos vs privados
        long publicReports = userReports.stream()
                .filter(CsvReport::isPublic)
                .count();
        long privateReports = userReports.size() - publicReports;
        stats.put("publicReports", publicReports);
        stats.put("privateReports", privateReports);
        
        // Reportes por categoría
        Map<String, Long> reportsByCategory = new HashMap<>();
        userReports.forEach(report -> {
            String category = report.getCategory() != null ? report.getCategory() : "Sin categoría";
            reportsByCategory.put(category, reportsByCategory.getOrDefault(category, 0L) + 1);
        });
        stats.put("reportsByCategory", reportsByCategory);
        
        // Total de filas procesadas
        long totalRows = userReports.stream()
                .mapToLong(CsvReport::getRowCount)
                .sum();
        stats.put("totalRows", totalRows);
        
        // Obtener todas las columnas disponibles de todos los reportes
        Set<String> allColumns = new HashSet<>();
        userReports.forEach(report -> {
            if (report.getHeaders() != null) {
                allColumns.addAll(report.getHeaders());
            }
        });
        stats.put("availableColumns", new ArrayList<>(allColumns));
        
        return stats;
    }

    /**
     * Obtiene análisis dinámico por columna específica
     */
    public Map<String, Object> getColumnAnalysis(Long userId, String columnName) {
        List<CsvReport> userReports = csvReportRepository.findByUserId(userId);
        
        Map<String, Long> valueCount = new HashMap<>();
       long totalProcessed = 0;
       int maxValuesToProcess = 10000; // Límite de valores a procesar
       int processedValues = 0;
        
        for (CsvReport report : userReports) {
           // Romper si ya procesamos suficientes valores
           if (processedValues >= maxValuesToProcess) break;
           
            if (report.getRows() == null || report.getHeaders() == null) continue;
            if (!report.getHeaders().contains(columnName)) continue;
            
            for (Map<String, Object> row : report.getRows()) {
               if (processedValues >= maxValuesToProcess) break;
               
                Object value = row.get(columnName);
                if (value != null) {
                    String valueStr = value.toString();
                    valueCount.put(valueStr, valueCount.getOrDefault(valueStr, 0L) + 1);
                   processedValues++;
                }
            }
           
           // Usar rowCount para el total real (no solo las muestras procesadas)
           if (report.getRowCount() != null && report.getHeaders().contains(columnName)) {
               totalProcessed += report.getRowCount();
           } else {
               totalProcessed += processedValues;
           }
        }
        
       // Limitar a los top 20 valores más comunes para evitar gráficos sobrecargados
       Map<String, Long> topValues = valueCount.entrySet().stream()
               .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
               .limit(20)
               .collect(Collectors.toMap(
                       Map.Entry::getKey,
                       Map.Entry::getValue,
                       (e1, e2) -> e1,
                       LinkedHashMap::new
               ));
       
        Map<String, Object> analysis = new HashMap<>();
        analysis.put("columnName", columnName);
       analysis.put("valueCounts", topValues);
        analysis.put("totalValues", totalProcessed);
       analysis.put("uniqueValues", topValues.size());
       analysis.put("totalUniqueValues", valueCount.size()); // Total antes de limitar a top 20
       analysis.put("isLimited", valueCount.size() > 20);
        
        return analysis;
    }
}
