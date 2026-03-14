package com.cdz.repository;

import com.cdz.model.Rack;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RackRepository extends JpaRepository<Rack, Long> {
    List<Rack> findByStoreId(Long storeId);
}
