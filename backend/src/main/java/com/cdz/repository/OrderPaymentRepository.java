package com.cdz.repository;

import com.cdz.model.OrderPayment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderPaymentRepository extends JpaRepository<OrderPayment, Long> {
}
