package com.cdz.payload.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffSalesReportDTO {
    private Long staffId;
    private String staffName;
    private Integer totalBills;
    private Double totalSales;
}
