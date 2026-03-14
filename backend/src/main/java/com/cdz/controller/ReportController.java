package com.cdz.controller;

import com.cdz.payload.dto.*;
import com.cdz.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/reports")
@Tag(name = "Reports", description = "Sales reports and analytics")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/daily-sales/{storeId}")
    @Operation(summary = "Get daily sales report", description = "Returns daily sales summary for a date range")
    public ResponseEntity<List<DailySalesReportDTO>> getDailySalesReport(
            @PathVariable Long storeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(reportService.getDailySalesReport(storeId, startDate, endDate));
    }

    @GetMapping("/item-sales/{storeId}")
    @Operation(summary = "Get item-wise sales report", description = "Returns product-level sales breakdown for a date range")
    public ResponseEntity<List<ItemSalesReportDTO>> getItemWiseSalesReport(
            @PathVariable Long storeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(reportService.getItemWiseSalesReport(storeId, startDate, endDate));
    }

    @GetMapping("/profit-loss/{storeId}")
    @Operation(summary = "Get profit & loss report", description = "Returns profit and loss breakdown")
    public ResponseEntity<List<ProfitLossReportDTO>> getProfitLossReport(
            @PathVariable Long storeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "DAILY") String period) {
        return ResponseEntity.ok(reportService.getProfitLossReport(storeId, startDate, endDate, period));
    }

    @GetMapping("/inventory/{storeId}")
    @Operation(summary = "Get inventory report", description = "Returns current stock levels and status")
    public ResponseEntity<List<InventoryReportDTO>> getInventoryReport(@PathVariable Long storeId) {
        return ResponseEntity.ok(reportService.getInventoryReport(storeId));
    }

    @GetMapping("/staff-sales/{storeId}")
    @Operation(summary = "Get staff sales report", description = "Returns sales performance by staff member")
    public ResponseEntity<List<StaffSalesReportDTO>> getStaffSalesReport(
            @PathVariable Long storeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(reportService.getStaffSalesReport(storeId, startDate, endDate));
    }
}
