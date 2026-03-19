package com.cdz.payload.dto;

import com.cdz.domain.PaymentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderPaymentDTO {
    private PaymentType paymentType;
    private Double amount;
    private Double cashTendered;
    private Double changeAmount;
    private String stripePaymentIntentId;
}
