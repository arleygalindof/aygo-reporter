package com.dashboard.reports.repository;

import com.dashboard.reports.model.CsvReport;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CsvReportRepository extends MongoRepository<CsvReport, String> {
    List<CsvReport> findByUserId(Long userId);
    List<CsvReport> findByStatus(String status);
    List<CsvReport> findByUserIdOrderByUploadedAtDesc(Long userId);
    List<CsvReport> findByIsPublicTrueOrUserId(Long userId);
}
