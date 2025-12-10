package com.dashboard.data.service;

import com.dashboard.data.model.CsvReport;
import com.dashboard.data.repository.CsvReportRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class CsvService {

    private final CsvReportRepository csvReportRepository;

    public CsvReport uploadAndParseCsv(MultipartFile file, Long userId, String category, String period, boolean isPublic) throws Exception {
        log.info("Procesando CSV: {} para usuario: {}, categoría: {}, período: {}", 
                file.getOriginalFilename(), userId, category, period);

        // Sanitizar categoría y período
        category = sanitizeString(category);
        period = sanitizeString(period);

        // Crear entidad inicial
        CsvReport report = new CsvReport();
        report.setUserId(userId);
        report.setFileName(UUID.randomUUID().toString());
        report.setOriginalFileName(file.getOriginalFilename());
        report.setFileSize(file.getSize());
        report.setCategory(category);
        report.setPeriod(period);
        report.setUploadedAt(java.time.LocalDateTime.now());
        report.setStatus("PROCESSING");
        report.setPublic(isPublic);

        // Detectar charset del archivo
        byte[] fileBytes = file.getBytes();
        Charset detectedCharset = detectCharset(fileBytes);
        log.info("Charset detectado: {}", detectedCharset);

        // Leer el archivo con el charset detectado
        try (BufferedReader reader = new BufferedReader(
            new InputStreamReader(new java.io.ByteArrayInputStream(fileBytes), detectedCharset))) {

            // Detectar delimitador leyendo la primera línea
            reader.mark(8192);
            String firstLine = reader.readLine();
            reader.reset();
            
            char delimiter = detectDelimiter(firstLine);
            log.info("Delimitador detectado: '{}'", delimiter);
            report.setDelimiter(String.valueOf(delimiter));

            // Parse CSV con Apache Commons CSV
            CSVParser csvParser = CSVFormat.DEFAULT
                    .withDelimiter(delimiter)
                    .withFirstRecordAsHeader()
                    .withIgnoreHeaderCase()
                    .withTrim()
                    .parse(reader);

            // Extraer headers
            List<String> headers = new ArrayList<>(csvParser.getHeaderNames());
            report.setHeaders(headers);

            // Parsear filas - SOLO GUARDAR MUESTRA (primeras 1000 filas para preview)
            List<Map<String, Object>> sampleRows = new ArrayList<>();
            int totalRowCount = 0;
            int maxSampleRows = 1000; // Limitar a 1000 filas para evitar exceder 16MB
            
            for (CSVRecord csvRecord : csvParser) {
                totalRowCount++;
                
                // Solo guardar las primeras 1000 filas como muestra
                if (sampleRows.size() < maxSampleRows) {
                    Map<String, Object> row = new HashMap<>();
                    for (String header : headers) {
                        String value = csvRecord.get(header);
                        // Intentar convertir a número si es posible
                        row.put(header, parseValue(value));
                    }
                    sampleRows.add(row);
                }
            }

            report.setRows(sampleRows); // Solo muestra
            report.setRowCount(totalRowCount); // Total real de filas
            report.setStatus("UPLOADED");

            // Generar metadata básica
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("totalColumns", headers.size());
            metadata.put("totalRows", totalRowCount);
            metadata.put("sampleRows", sampleRows.size());
            metadata.put("isSample", totalRowCount > maxSampleRows);
            metadata.put("uploadTimestamp", System.currentTimeMillis());
            report.setMetadata(metadata);

            log.info("CSV parseado exitosamente: {} filas totales, {} columnas, {} filas en muestra", 
                    totalRowCount, headers.size(), sampleRows.size());

        } catch (Exception e) {
            log.error("Error parseando CSV: {}", e.getMessage(), e);
            report.setStatus("ERROR");
            throw new Exception("Error procesando CSV: " + e.getMessage());
        }

        return csvReportRepository.save(report);
    }

    private char detectDelimiter(String line) {
        if (line == null || line.isEmpty()) {
            return ','; // default
        }
        
        // Contar ocurrencias de delimitadores comunes
        int commaCount = (int) line.chars().filter(c -> c == ',').count();
        int semicolonCount = (int) line.chars().filter(c -> c == ';').count();
        int tabCount = (int) line.chars().filter(c -> c == '\t').count();
        int pipeCount = (int) line.chars().filter(c -> c == '|').count();
        
        // Retornar el que más aparece
        if (semicolonCount > commaCount && semicolonCount > tabCount && semicolonCount > pipeCount) {
            return ';';
        } else if (tabCount > commaCount && tabCount > semicolonCount && tabCount > pipeCount) {
            return '\t';
        } else if (pipeCount > commaCount && pipeCount > semicolonCount && pipeCount > tabCount) {
            return '|';
        }
        return ','; // default
    }

    private Object parseValue(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        
        // Intentar parsear como número
        try {
            if (value.contains(".")) {
                return Double.parseDouble(value);
            } else {
                return Long.parseLong(value);
            }
        } catch (NumberFormatException e) {
            // Si no es número, devolver como string
            return value;
        }
    }

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

    /**
     * Sanitiza la categoría y período para eliminar caracteres dañados o inválidos
     */
    private String sanitizeString(String input) {
        if (input == null) return "";
        // Elimina caracteres de control y caracteres no imprimibles
        return input.replaceAll("[\\p{Cc}\\p{Cf}\\p{Co}\\p{Cn}]", "")
                   .trim();
    }

    /**
     * Detecta el charset del archivo con prioridad para archivos latinoamericanos
     */
    private Charset detectCharset(byte[] bytes) {
        // Respeta BOM explícitos
        if (bytes.length >= 3 && bytes[0] == (byte) 0xEF && bytes[1] == (byte) 0xBB && bytes[2] == (byte) 0xBF) {
            log.info("Detectado UTF-8 con BOM");
            return StandardCharsets.UTF_8;
        }
        if (bytes.length >= 2) {
            if (bytes[0] == (byte) 0xFF && bytes[1] == (byte) 0xFE) {
                log.info("Detectado UTF-16LE");
                return Charset.forName("UTF-16LE");
            }
            if (bytes[0] == (byte) 0xFE && bytes[1] == (byte) 0xFF) {
                log.info("Detectado UTF-16BE");
                return Charset.forName("UTF-16BE");
            }
        }

        // Validar UTF-8 primero para evitar decodificaciones erróneas (Ñ -> ¥)
        try {
            var decoder = StandardCharsets.UTF_8.newDecoder();
            decoder.onMalformedInput(java.nio.charset.CodingErrorAction.REPORT);
            decoder.onUnmappableCharacter(java.nio.charset.CodingErrorAction.REPORT);
            decoder.decode(java.nio.ByteBuffer.wrap(bytes));
            log.info("Usando UTF-8 tras validación");
            return StandardCharsets.UTF_8;
        } catch (Exception e) {
            log.info("UTF-8 no válido, probando Windows-1252");
        }

        // Fallback: Windows-1252 (Excel/ANSI) que mantiene acentos españoles
        try {
            Charset win1252 = Charset.forName("windows-1252");
            log.info("Usando Windows-1252 como fallback");
            return win1252;
        } catch (Exception ignored) {
            log.info("Fallback a ISO-8859-1");
            return StandardCharsets.ISO_8859_1;
        }
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
        
        return stats;
    }
}
