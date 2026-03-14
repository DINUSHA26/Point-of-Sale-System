package com.cdz.service;

import com.cdz.payload.dto.DailySalesReportDTO;
import com.cdz.payload.dto.ItemSalesReportDTO;

import com.cdz.payload.dto.ProfitLossReportDTO;
import com.cdz.payload.dto.InventoryReportDTO;
import com.cdz.payload.dto.StaffSalesReportDTO;

import java.time.LocalDate;
import java.util.List;

public interface ReportService {

    List<DailySalesReportDTO> getDailySalesReport(Long storeId, LocalDate startDate, LocalDate endDate);

    List<ItemSalesReportDTO> getItemWiseSalesReport(Long storeId, LocalDate startDate, LocalDate endDate);

    List<ProfitLossReportDTO> getProfitLossReport(Long storeId, LocalDate startDate, LocalDate endDate, String period);

    List<InventoryReportDTO> getInventoryReport(Long storeId);

    List<StaffSalesReportDTO> getStaffSalesReport(Long storeId, LocalDate startDate, LocalDate endDate);
}
