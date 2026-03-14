package com.cdz.repository;

import com.cdz.model.ProductAttribute;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProductAttributeRepository extends JpaRepository<ProductAttribute, Long> {
    List<ProductAttribute> findByStoreId(Long storeId);
}
