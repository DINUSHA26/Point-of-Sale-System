package com.cdz.repository;

import com.cdz.model.Shelf;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ShelfRepository extends JpaRepository<Shelf, Long> {
    List<Shelf> findByStoreId(Long storeId);
}
