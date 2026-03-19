package com.cdz.payload.dto;

import lombok.Data;
import java.util.List;

@Data
public class ReturnRequestDTO {
    private Long originalOrderId;
    private List<ReturnItemRequestDTO> returnItems;
    private OrderDTO exchangeOrder;
    private String reason;
    private Double refundAmount;
    private Boolean issueStoreCredit;
}
