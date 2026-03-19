package com.cdz.repository;

import com.cdz.model.StoreCreditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StoreCreditLogRepository extends JpaRepository<StoreCreditLog, Long> {
    List<StoreCreditLog> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
}
