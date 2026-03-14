package com.cdz.repository;

import com.cdz.model.Brand;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BrandRepository extends JpaRepository<Brand, Long> {
    List<Brand> findByStoreId(Long storeId);
}
