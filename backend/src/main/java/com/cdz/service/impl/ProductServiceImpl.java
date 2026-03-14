package com.cdz.service.impl;

import com.cdz.mapper.ProductMapper;
import com.cdz.model.Category;
import com.cdz.model.Product;
import com.cdz.model.Store;
import com.cdz.model.User;
import com.cdz.payload.dto.ProductDTO;
import com.cdz.repository.CategoryRepository;
import com.cdz.repository.ProductRepository;
import com.cdz.repository.StoreRepository;
import com.cdz.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

        private final ProductRepository productRepository;
        private final StoreRepository storeRepository;
        private final CategoryRepository categoryRepository;
        private final com.cdz.repository.BrandRepository brandRepository;
        private final com.cdz.repository.RackRepository rackRepository;
        private final com.cdz.repository.ShelfRepository shelfRepository;
        private final com.cdz.repository.ProductVariantRepository variantRepository;
        private final com.cdz.repository.InventoryRepository inventoryRepository;
        private final com.cdz.repository.OrderItemRepository orderItemRepository;
        private final com.cdz.repository.ShiftReportRepository shiftReportRepository;

        @Override
        public ProductDTO createProduct(ProductDTO productDTO, User user) throws Exception {
                Store store;
                if (user.getStore() != null) {
                        store = user.getStore();
                } else {
                        store = storeRepository.findById(productDTO.getStoreId())
                                        .orElseThrow(() -> new Exception("Store not found"));
                }

                Category category = categoryRepository.findById(productDTO.getCategoryId()).orElseThrow(
                                () -> new Exception("Category not found"));

                com.cdz.model.Brand brand = null;
                if (productDTO.getBrandId() != null) {
                        brand = brandRepository.findById(productDTO.getBrandId()).orElse(null);
                }
                com.cdz.model.Rack rack = null;
                if (productDTO.getRackId() != null) {
                        rack = rackRepository.findById(productDTO.getRackId()).orElse(null);
                }
                com.cdz.model.Shelf shelf = null;
                if (productDTO.getShelfId() != null) {
                        shelf = shelfRepository.findById(productDTO.getShelfId()).orElse(null);
                }

                Product product = ProductMapper.toEntity(productDTO, store, category, brand, rack, shelf);
                Product savedProduct = productRepository.save(product);

                // Handle Variants
                if (productDTO.isHasVariants() && productDTO.getVariants() != null && !productDTO.getVariants().isEmpty()) {
                        for (com.cdz.payload.dto.ProductVariantDTO varDto : productDTO.getVariants()) {
                                com.cdz.model.ProductVariant variant = com.cdz.model.ProductVariant.builder()
                                        .product(savedProduct)
                                        .sku(varDto.getSku())
                                        .sellingPrice(varDto.getSellingPrice())
                                        .mrp(varDto.getMrp())
                                        .attributeValues(varDto.getAttributeValues())
                                        .build();
                                variantRepository.save(variant);
                        }
                }

                return ProductMapper.toDTO(savedProduct);
        }

        @Override
        public ProductDTO updateProduct(Long id, ProductDTO productDTO, User user) throws Exception {
                Product product = productRepository.findById(id).orElseThrow(
                                () -> new Exception("product not found"));

                Store userStore = user.getStore();
                if (userStore == null && com.cdz.domain.UserRole.ROLE_OWNER.equals(user.getRole())) {
                        userStore = storeRepository.findByStoreAdminId(user.getId());
                }

                if (userStore != null && product.getStore() != null &&
                        userStore.getId() != product.getStore().getId()) {
                        throw new Exception("You do not have permission to update this product.");
                }

                product.setName(productDTO.getName());
                product.setDescription(productDTO.getDescription());
                product.setSku(productDTO.getSku());
                product.setImage(productDTO.getImage());
                product.setMrp(productDTO.getMrp());
                product.setSellingPrice(productDTO.getSellingPrice());
                if (productDTO.getDiscountPercentage() != null) {
                    product.setDiscountPercentage(productDTO.getDiscountPercentage());
                }
                
                if (productDTO.getBrandId() != null) {
                    product.setBrand(brandRepository.findById(productDTO.getBrandId()).orElse(null));
                } else {
                    product.setBrand(null);
                }
                if (productDTO.getRackId() != null) {
                    product.setRack(rackRepository.findById(productDTO.getRackId()).orElse(null));
                } else {
                    product.setRack(null);
                }
                if (productDTO.getShelfId() != null) {
                    product.setShelf(shelfRepository.findById(productDTO.getShelfId()).orElse(null));
                } else {
                    product.setShelf(null);
                }

                product.setHasVariants(productDTO.isHasVariants());
                product.setUpdatedAt(LocalDateTime.now());

                if (productDTO.getCategoryId() != null) {
                        Category category = categoryRepository.findById(productDTO.getCategoryId()).orElseThrow(
                                        () -> new Exception("Category not found"));
                        product.setCategory(category);
                }

                Product savedProduct = productRepository.save(product);
                return ProductMapper.toDTO(savedProduct);
        }

        @Override
        @org.springframework.transaction.annotation.Transactional
        public void deleteProduct(Long id, User user) throws Exception {

                Product product = productRepository.findById(id).orElseThrow(
                                () -> new Exception("product not found"));

                Store userStore = user.getStore();
                if (userStore == null && com.cdz.domain.UserRole.ROLE_OWNER.equals(user.getRole())) {
                        userStore = storeRepository.findByStoreAdminId(user.getId());
                }

                if (userStore != null && product.getStore() != null &&
                        userStore.getId() != product.getStore().getId()) {
                        throw new Exception("You do not have permission to delete this product.");
                }

                // Delete related variants
                List<com.cdz.model.ProductVariant> variants = variantRepository.findByProductId(id);
                if (variants != null && !variants.isEmpty()) {
                        variantRepository.deleteAll(variants);
                }

                // Delete related inventory
                List<com.cdz.model.Inventory> inventories = inventoryRepository.findByProductId(id);
                if (inventories != null && !inventories.isEmpty()) {
                        inventoryRepository.deleteAll(inventories);
                }

                // Detach from previous orders
                List<com.cdz.model.OrderItem> affectedOrderItems = orderItemRepository.findByProductId(id);
                if (affectedOrderItems != null && !affectedOrderItems.isEmpty()) {
                        for (com.cdz.model.OrderItem oi : affectedOrderItems) {
                                // Ensure historical name is saved if it wasn't already (for backwards compatibility with old records)
                                if (oi.getProductName() == null) {
                                        oi.setProductName(product.getName());
                                        oi.setProductSku(product.getSku());
                                }
                                oi.setProduct(null);
                        }
                        orderItemRepository.saveAll(affectedOrderItems);
                }

                // Detach from shift reports
                List<com.cdz.model.ShiftReport> affectedReports = shiftReportRepository.findByTopSellingProductId(id);
                if (affectedReports != null && !affectedReports.isEmpty()) {
                        for (com.cdz.model.ShiftReport report : affectedReports) {
                                if (report.getTopSellingProducts() != null) {
                                        report.getTopSellingProducts().removeIf(p -> p.getId().equals(id));
                                }
                        }
                        shiftReportRepository.saveAll(affectedReports);
                }

                productRepository.delete(product);
                productRepository.flush();

        }

        @Override
        public List<ProductDTO> getProductsByStoreId(Long storeId) {

                List<Product> products = productRepository.findByStoreId(storeId);
                return products.stream()
                                .map(ProductMapper::toDTO)
                                .collect(Collectors.toList());
        }

        @Override
        public List<ProductDTO> searchByKeyword(Long storeId, String keyword) {
                List<Product> products = productRepository.searchByKeyword(storeId, keyword);
                return products.stream()
                                .map(ProductMapper::toDTO)
                                .collect(Collectors.toList());
        }
}
