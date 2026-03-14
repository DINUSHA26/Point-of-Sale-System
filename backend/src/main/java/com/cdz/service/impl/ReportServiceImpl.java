package com.cdz.service.impl;

import com.cdz.model.Inventory;
import com.cdz.model.Order;
import com.cdz.model.OrderItem;
import com.cdz.payload.dto.*;
import com.cdz.repository.InventoryRepository;
import com.cdz.repository.OrderRepository;
import com.cdz.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final OrderRepository orderRepository;
    private final InventoryRepository inventoryRepository;

    @Override
    public List<DailySalesReportDTO> getDailySalesReport(Long storeId, LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.plusDays(1).atStartOfDay();

        List<Order> orders = orderRepository.findByStoreIdAndCreatedAtBetween(storeId, start, end);

        Map<LocalDate, List<Order>> ordersByDate = orders.stream()
                .collect(Collectors.groupingBy(order -> order.getCreatedAt().toLocalDate()));

        return ordersByDate.entrySet().stream()
                .map(entry -> {
                    LocalDate date = entry.getKey();
                    List<Order> dailyOrders = entry.getValue();

                    int totalOrders = dailyOrders.size();
                    double totalRevenue = dailyOrders.stream()
                            .mapToDouble(Order::getTotalAmount)
                            .sum();
                    double avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

                    // Payment Breakdown
                    Map<String, Double> paymentBreakdown = dailyOrders.stream()
                            .collect(Collectors.groupingBy(
                                    o -> o.getPaymentType() != null ? o.getPaymentType().name() : "OTHER",
                                    Collectors.summingDouble(Order::getTotalAmount)
                            ));

                    return DailySalesReportDTO.builder()
                            .date(date)
                            .totalOrders(totalOrders)
                            .totalRevenue(totalRevenue)
                            .averageOrderValue(avgOrderValue)
                            .paymentBreakdown(paymentBreakdown)
                            .build();
                })
                .sorted((a, b) -> b.getDate().compareTo(a.getDate()))
                .collect(Collectors.toList());
    }

    @Override
    public List<ItemSalesReportDTO> getItemWiseSalesReport(Long storeId, LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.plusDays(1).atStartOfDay();

        List<Order> orders = orderRepository.findByStoreIdAndCreatedAtBetween(storeId, start, end);

        List<OrderItem> allItems = orders.stream()
                .flatMap(order -> order.getItems().stream())
                .collect(Collectors.toList());

        Map<String, List<OrderItem>> itemsByProduct = allItems.stream()
                .collect(Collectors.groupingBy(item -> item.getProduct().getName()));

        return itemsByProduct.entrySet().stream()
                .map(entry -> {
                    String productName = entry.getKey();
                    List<OrderItem> productItems = entry.getValue();

                    int totalQuantity = productItems.stream()
                            .mapToInt(OrderItem::getQuantity)
                            .sum();
                    double totalRevenue = productItems.stream()
                            .mapToDouble(OrderItem::getPrice)
                            .sum();
                    int numberOfOrders = (int) productItems.stream()
                            .map(item -> item.getOrder().getId())
                            .distinct()
                            .count();

                    String category = productItems.get(0).getProduct().getCategory() != null
                            ? productItems.get(0).getProduct().getCategory().getName()
                            : "Uncategorized";

                    return ItemSalesReportDTO.builder()
                            .productName(productName)
                            .category(category)
                            .totalQuantitySold(totalQuantity)
                            .totalRevenue(totalRevenue)
                            .numberOfOrders(numberOfOrders)
                            .build();
                })
                .sorted((a, b) -> Double.compare(b.getTotalRevenue(), a.getTotalRevenue()))
                .collect(Collectors.toList());
    }

    @Override
    public List<ProfitLossReportDTO> getProfitLossReport(Long storeId, LocalDate startDate, LocalDate endDate, String period) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.plusDays(1).atStartOfDay();

        List<Order> orders = orderRepository.findByStoreIdAndCreatedAtBetween(storeId, start, end);

        // Grouping logic based on period
        Map<String, List<Order>> groupedOrders;
        if ("MONTHLY".equalsIgnoreCase(period)) {
            groupedOrders = orders.stream()
                    .collect(Collectors.groupingBy(o -> o.getCreatedAt().getYear() + "-" + String.format("%02d", o.getCreatedAt().getMonthValue())));
        } else if ("YEARLY".equalsIgnoreCase(period)) {
            groupedOrders = orders.stream()
                    .collect(Collectors.groupingBy(o -> String.valueOf(o.getCreatedAt().getYear())));
        } else { // DAILY
            groupedOrders = orders.stream()
                    .collect(Collectors.groupingBy(o -> o.getCreatedAt().toLocalDate().toString()));
        }

        return groupedOrders.entrySet().stream()
                .map(entry -> {
                    List<Order> periodOrders = entry.getValue();
                    double totalRevenue = periodOrders.stream().mapToDouble(Order::getTotalAmount).sum();
                    
                    double totalCost = periodOrders.stream()
                            .flatMap(o -> o.getItems().stream())
                            .mapToDouble(item -> item.getCostPrice() != null ? item.getCostPrice() : 
                                (item.getProduct().getCostPrice() != null ? item.getProduct().getCostPrice() * item.getQuantity() : 0.0))
                            .sum();

                    double grossProfit = totalRevenue - totalCost;
                    double netIncome = grossProfit; // Assumes zero expenses for now as model is missing
                    
                    int totalOrders = periodOrders.size();
                    double averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0.0;

                    return ProfitLossReportDTO.builder()
                            .period(period)
                            .date(periodOrders.get(0).getCreatedAt().toLocalDate())
                            .totalRevenue(totalRevenue)
                            .totalCost(totalCost)
                            .grossProfit(grossProfit)
                            .netIncome(netIncome)
                            .totalOrders(totalOrders)
                            .averageOrderValue(averageOrderValue)
                            .build();
                })
                .sorted((a, b) -> b.getDate().compareTo(a.getDate()))
                .collect(Collectors.toList());
    }

    @Override
    public List<InventoryReportDTO> getInventoryReport(Long storeId) {
        List<Inventory> inventoryList = inventoryRepository.findByStoreId(storeId);

        return inventoryList.stream()
                .map(i -> {
                    // For stockSold/Added we might need specialized lookup if we were tracking history perfectly.
                    // For now we'll focus on current levels and marked thresholds.
                    return InventoryReportDTO.builder()
                            .productId(i.getProduct().getId())
                            .productName(i.getProduct().getName())
                            .sku(i.getProduct().getSku())
                            .currentStock(i.getQuantity())
                            .lowStockThreshold(i.getLowStockThreshold())
                            .isLowStock(i.isLowStock())
                            .stockSold(0) // Placeholder
                            .stockAdded(0) // Placeholder
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<StaffSalesReportDTO> getStaffSalesReport(Long storeId, LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.plusDays(1).atStartOfDay();

        List<Order> orders = orderRepository.findByStoreIdAndCreatedAtBetween(storeId, start, end);

        Map<Long, List<Order>> ordersByStaff = orders.stream()
                .filter(o -> o.getCashier() != null)
                .collect(Collectors.groupingBy(o -> o.getCashier().getId()));

        return ordersByStaff.entrySet().stream()
                .map(entry -> {
                    Long staffId = entry.getKey();
                    List<Order> userOrders = entry.getValue();
                    String name = userOrders.get(0).getCashier().getFullName();

                    return StaffSalesReportDTO.builder()
                            .staffId(staffId)
                            .staffName(name)
                            .totalBills(userOrders.size())
                            .totalSales(userOrders.stream().mapToDouble(Order::getTotalAmount).sum())
                            .build();
                })
                .sorted((a, b) -> Double.compare(b.getTotalSales(), a.getTotalSales()))
                .collect(Collectors.toList());
    }
}
