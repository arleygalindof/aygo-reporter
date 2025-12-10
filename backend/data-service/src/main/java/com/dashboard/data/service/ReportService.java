package com.dashboard.data.service;

import com.dashboard.data.model.Report;
import com.dashboard.data.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;

    public Report createReport(Long userId, String title, String description, String data) {
        log.info("Creando reporte para usuario: {}", userId);
        
        Report report = new Report();
        report.setUserId(userId);
        report.setTitle(title);
        report.setDescription(description);
        report.setData(data);
        report.setStatus("PENDING");

        return reportRepository.save(report);
    }

    public List<Report> getUserReports(Long userId) {
        log.info("Obteniendo reportes del usuario: {}", userId);
        return reportRepository.findByUserId(userId);
    }

    public Report getReportById(Long id) {
        log.info("Obteniendo reporte: {}", id);
        return reportRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reporte no encontrado"));
    }

    public Report updateReport(Long id, String title, String description, String status) {
        log.info("Actualizando reporte: {}", id);
        
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reporte no encontrado"));

        if (title != null) report.setTitle(title);
        if (description != null) report.setDescription(description);
        if (status != null) report.setStatus(status);

        return reportRepository.save(report);
    }

    public void deleteReport(Long id) {
        log.info("Eliminando reporte: {}", id);
        reportRepository.deleteById(id);
    }

}
