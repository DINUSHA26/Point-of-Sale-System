package com.cdz.mapper;

import com.cdz.model.OrderPayment;
import com.cdz.payload.dto.OrderPaymentDTO;

public class OrderPaymentMapper {
    public static OrderPaymentDTO toDTO(OrderPayment payment) {
        if (payment == null) return null;
        return OrderPaymentDTO.builder()
                .paymentType(payment.getPaymentType())
                .amount(payment.getAmount())
                .cashTendered(payment.getCashTendered())
                .changeAmount(payment.getChangeAmount())
                .stripePaymentIntentId(payment.getStripePaymentIntentId())
                .build();
    }
}
