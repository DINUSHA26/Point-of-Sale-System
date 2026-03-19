package com.cdz.payload.dto;

import com.cdz.model.ReturnItem.ReturnCondition;
import lombok.Data;

@Data
public class ReturnItemRequestDTO {
    private Long orderItemId;
    private Integer quantity;
    private ReturnCondition condition;
}
