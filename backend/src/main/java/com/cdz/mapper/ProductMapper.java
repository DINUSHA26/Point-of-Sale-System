package com.cdz.mapper;

import com.cdz.model.Category;
import com.cdz.model.Product;
import com.cdz.model.Store;
import com.cdz.payload.dto.ProductDTO;

public class ProductMapper {

    public static ProductDTO toDTO(Product product) {
        return ProductDTO.builder()
                .id(product.getId())
                .name(product.getName())
                .sku(product.getSku())
                .description(product.getDescription())
                .mrp(product.getMrp())
                .sellingPrice(product.getSellingPrice())
                .costPrice(product.getCostPrice())
                .discountPercentage(product.getDiscountPercentage())
                .brandId(product.getBrand() != null ? product.getBrand().getId() : null)
                .brandName(product.getBrand() != null ? product.getBrand().getName() : null)
                .rackId(product.getRack() != null ? product.getRack().getId() : null)
                .rackName(product.getRack() != null ? product.getRack().getName() : null)
                .shelfId(product.getShelf() != null ? product.getShelf().getId() : null)
                .shelfName(product.getShelf() != null ? product.getShelf().getName() : null)
                .hasVariants(product.isHasVariants())
                .category(CategoryMapper.toDTO(product.getCategory()))
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .storeId(product.getStore() != null ? product.getStore().getId() : null)
                .image(product.getImage())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }

    // toEntity needs to be handled in the service layer since we need to fetch Brand, Rack, Shelf from DB.
    // I'll leave a simple version here that doesn't set associations perfectly to be safe, 
    // but the service should manually set them.
    public static Product toEntity(ProductDTO productDTO,
            Store store,
            Category category,
            com.cdz.model.Brand brand,
            com.cdz.model.Rack rack,
            com.cdz.model.Shelf shelf) {
        return Product.builder()
                .name(productDTO.getName())
                .store(store)
                .category(category)
                .sku(productDTO.getSku())
                .description(productDTO.getDescription())
                .mrp(productDTO.getMrp())
                .sellingPrice(productDTO.getSellingPrice())
                .costPrice(productDTO.getCostPrice())
                .discountPercentage(
                        productDTO.getDiscountPercentage() != null ? productDTO.getDiscountPercentage() : 0.0)
                .brand(brand)
                .rack(rack)
                .shelf(shelf)
                .hasVariants(productDTO.isHasVariants())
                .image(productDTO.getImage())
                .build();

    }

}
