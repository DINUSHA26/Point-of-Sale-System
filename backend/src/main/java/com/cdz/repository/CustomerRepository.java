package com.cdz.repository;

import com.cdz.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

    List<Customer> findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrPhoneContainingIgnoreCase(String fullName, String email, String phone);

    List<Customer> findByStoreId(Long storeId);
    
    Customer findByPhoneAndStoreId(String phone, Long storeId);

    long countByStoreId(Long storeId);

}
