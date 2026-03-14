package com.cdz.payload.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfitLossReportDTO {
    private LocalDate date;
    private String period; // e.g. "DAILY", "MONTHLY", "YEARLY"
    private Double totalRevenue;
    private Double totalCost;
    private Double grossProfit;
    private Double netIncome;
    private Integer totalOrders;
    private Double averageOrderValue;
}
