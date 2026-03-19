package com.cdz.service.impl;

import com.cdz.domain.ReturnStatus;
import com.cdz.mapper.RefundMapper;
import com.cdz.model.Inventory;
import com.cdz.model.Order;
import com.cdz.model.Refund;
import com.cdz.model.Store;
import com.cdz.model.User;
import com.cdz.payload.dto.RefundDTO;
import com.cdz.repository.InventoryRepository;
import com.cdz.repository.OrderRepository;
import com.cdz.repository.RefundRepository;
import com.cdz.service.BillingService;
import com.cdz.service.RefundService;
import com.cdz.service.UserService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import com.cdz.model.*;
import com.cdz.payload.dto.*;
import com.cdz.repository.*;
import com.cdz.service.*;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class RefundServiceImpl implements RefundService {

        private final RefundRepository refundRepository;
        private final UserService userService;
        private final OrderRepository orderRepository;
        private final InventoryRepository inventoryRepository;
        private final BillingService billingService;
        private final OrderItemRepository orderItemRepository;
        private final ReturnItemRepository returnItemRepository;
        private final CustomerRepository customerRepository;
        private final StoreCreditLogRepository storeCreditLogRepository;

        @org.springframework.beans.factory.annotation.Autowired
        @org.springframework.context.annotation.Lazy
        private OrderService orderService;

        @Override
        @org.springframework.transaction.annotation.Transactional
        public RefundDTO processReturnAndExchange(ReturnRequestDTO request) throws Exception {
                Order order = orderRepository.findById(request.getOriginalOrderId())
                                .orElseThrow(() -> new EntityNotFoundException("Order not found: " + request.getOriginalOrderId()));

                Store store = order.getStore();
                if (store == null) throw new EntityNotFoundException("Order has no store");

                User cashier = userService.getCurrentUser();
                
                String returnId = "RET-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
                
                Refund refund = Refund.builder()
                                .order(order)
                                .store(store)
                                .cashier(cashier)
                                .reason(request.getReason())
                                .amount(request.getRefundAmount())
                                .paymentType(order.getPaymentType())
                                .returnId(returnId)
                                .build();
                                
                if (order.getCustomer() != null) {
                        refund.setCustomer(order.getCustomer());
                }

                refund = refundRepository.save(refund);

                List<ReturnItem> returnItems = new ArrayList<>();
                for (ReturnItemRequestDTO itemDTO : request.getReturnItems()) {
                        OrderItem orderItem = orderItemRepository.findById(itemDTO.getOrderItemId())
                                        .orElseThrow(() -> new Exception("Order item not found"));
                        int currentReturned = orderItem.getReturnedQuantity() != null ? orderItem.getReturnedQuantity() : 0;
                        
                        if (currentReturned + itemDTO.getQuantity() > orderItem.getQuantity()) {
                                throw new Exception("Cannot return more than purchased for item: " + orderItem.getProductName());
                        }

                        orderItem.setReturnedQuantity(currentReturned + itemDTO.getQuantity());
                        
                        // Update Return Status flag
                        if (orderItem.getReturnedQuantity() >= orderItem.getQuantity()) {
                                orderItem.setReturnStatus(ReturnStatus.FULLY_RETURNED);
                        } else {
                                orderItem.setReturnStatus(ReturnStatus.PARTIALLY_RETURNED);
                        }
                        
                        orderItemRepository.save(orderItem);

                        // Inventory Restocking Logic
                        if (orderItem.getProduct() != null) {
                                Inventory inventory = inventoryRepository.findByProductIdAndStoreId(
                                                orderItem.getProduct().getId(), store.getId());
                                if (inventory != null) {
                                        if (itemDTO.getCondition() == ReturnItem.ReturnCondition.DAMAGED) {
                                                int currentDamaged = inventory.getDamagedQuantity() != null ? inventory.getDamagedQuantity() : 0;
                                                inventory.setDamagedQuantity(currentDamaged + itemDTO.getQuantity());
                                        } else {
                                                int currentQty = inventory.getQuantity() != null ? inventory.getQuantity() : 0;
                                                inventory.setQuantity(currentQty + itemDTO.getQuantity());
                                        }
                                        inventoryRepository.save(inventory);
                                }
                        }

                        ReturnItem returnItem = ReturnItem.builder()
                                        .refund(refund)
                                        .originalOrderItem(orderItem)
                                        .quantity(itemDTO.getQuantity())
                                        .itemCondition(itemDTO.getCondition())
                                        // Calculate proportional refund amount per item if necessary or leave null
                                        .build();
                        returnItems.add(returnItemRepository.save(returnItem));
                }
                
                refund.setReturnItems(returnItems);

                // Financials, Loyalty & Store Credit
                if (order.getCustomer() != null) {
                        Customer customer = order.getCustomer();
                        
                        // Deduct loyalty points (assuming 1 point per currency unit as default fallback)
                        int currentPoints = customer.getLoyaltyPoints() != null ? customer.getLoyaltyPoints() : 0;
                        int pointsToDeduct = request.getRefundAmount() != null ? request.getRefundAmount().intValue() : 0;
                        int newPoints = Math.max(0, currentPoints - pointsToDeduct);
                        customer.setLoyaltyPoints(newPoints);

                        if (Boolean.TRUE.equals(request.getIssueStoreCredit()) && request.getRefundAmount() > 0) {
                                double existingCredit = customer.getStoreCredit() != null ? customer.getStoreCredit() : 0.0;
                                customer.setStoreCredit(existingCredit + request.getRefundAmount());
                                refund.setCreditNoteIssued(request.getRefundAmount());
                                
                                storeCreditLogRepository.save(StoreCreditLog.builder()
                                    .customer(customer)
                                    .amount(request.getRefundAmount())
                                    .type("ISSUE")
                                    .orderId(order.getId())
                                    .reason("Return for Order #" + order.getId())
                                    .build());
                        }
                        customerRepository.save(customer);
                }
                
                if (!Boolean.TRUE.equals(request.getIssueStoreCredit()) && request.getRefundAmount() > 0 && order.getPaymentType() == com.cdz.domain.PaymentType.CARD
                                && order.getStripePaymentIntentId() != null
                                && request.getRefundAmount() != null
                                && request.getRefundAmount() > 0) {
                        long amountCents = Math.round(request.getRefundAmount() * 100);
                        if (amountCents > 0) {
                                billingService.refundCardPayment(
                                                order.getStripePaymentIntentId(),
                                                amountCents,
                                                request.getReason());
                        }
                }

                if (request.getExchangeOrder() != null) {
                        request.getExchangeOrder().setParentOrderId(order.getId());
                        OrderDTO newOrderDTO = orderService.createOrder(request.getExchangeOrder());
                        Order eOrder = orderRepository.findById(newOrderDTO.getId()).orElse(null);
                        refund.setExchangeOrder(eOrder);
                        
                        // Link the exchange order ID to the original returned items
                        if (eOrder != null) {
                            for (ReturnItem ri : returnItems) {
                                OrderItem originalItem = ri.getOriginalOrderItem();
                                if (originalItem != null) {
                                    originalItem.setLinkedOrderId(eOrder.getId());
                                    if (originalItem.getReturnStatus() != ReturnStatus.FULLY_RETURNED && originalItem.getReturnStatus() != ReturnStatus.PARTIALLY_RETURNED) {
                                         // Fallback if not already set, usually for exchanges
                                         originalItem.setReturnStatus(ReturnStatus.EXCHANGED);
                                    }
                                    orderItemRepository.save(originalItem);
                                }
                            }
                        }
                } else if (refund.getReturnId() != null) {
                        // If no exchange but refund processed, we can use the Return ID or Refund record ID as a link if needed
                        // For now just ensure fully/partially returned flags are set (already done in the loop)
                }

                refund = refundRepository.save(refund);
                return RefundMapper.toDTO(refund);
        }

        @Override
        public RefundDTO createRefund(RefundDTO refund) throws Exception {

                Order order = orderRepository.findById(refund.getOrderId())
                                .orElseThrow(() -> new EntityNotFoundException(
                                                "Order not found: " + refund.getOrderId()));

                Store store = order.getStore();
                if (store == null) {
                        throw new EntityNotFoundException("Order has no store");
                }

                User cashier = userService.getCurrentUser();

                // If order was paid by card via Stripe, process refund through Stripe first
                if (order.getPaymentType() == com.cdz.domain.PaymentType.CARD
                                && order.getStripePaymentIntentId() != null
                                && !order.getStripePaymentIntentId().isBlank()
                                && refund.getAmount() != null
                                && refund.getAmount() > 0) {
                        long amountCents = Math.round(refund.getAmount() * 100);
                        if (amountCents > 0) {
                                billingService.refundCardPayment(
                                                order.getStripePaymentIntentId(),
                                                amountCents,
                                                refund.getReason());
                        }
                }

                // ✅ CRITICAL: Restore inventory when refund is processed
                for (var item : order.getItems()) {
                        Inventory inventory = inventoryRepository.findByProductIdAndStoreId(
                                        item.getProduct().getId(),
                                        store.getId());

                        if (inventory != null) {
                                // Add items back to inventory
                                inventory.setQuantity(inventory.getQuantity() + item.getQuantity());
                                inventoryRepository.save(inventory);
                        }
                }

                Refund refunds = Refund.builder()
                                .order(order)
                                .store(store)
                                .cashier(cashier)
                                .reason(refund.getReason())
                                .amount(refund.getAmount())
                                .paymentType(order.getPaymentType())
                                .build();

                Refund saved = refundRepository.save(refunds);
                return RefundMapper.toDTO(saved);
        }

        @Override
        public List<RefundDTO> getAllRefunds() throws Exception {
                return refundRepository.findAll().stream()
                                .map(RefundMapper::toDTO)
                                .collect(Collectors.toList());
        }

        @Override
        public List<RefundDTO> getRefundByCashier(Long cashierId) throws Exception {
                return refundRepository.findByCashierId(cashierId).stream()
                                .map(RefundMapper::toDTO)
                                .collect(Collectors.toList());
        }

        @Override
        public List<RefundDTO> getRefundByShiftReport(Long shiftReportId) throws Exception {

                return refundRepository.findByShiftReportId(shiftReportId).stream()
                                .map(RefundMapper::toDTO).collect(Collectors.toList());
        }

        @Override
        public List<RefundDTO> getRefundByCashierAndDateRange(Long cashierId, LocalDateTime startDate,
                        LocalDateTime endDate)
                        throws Exception {

                return refundRepository.findByCashierIdAndCreatedAtBetween(
                                cashierId, startDate, endDate).stream().map(RefundMapper::toDTO)
                                .collect(Collectors.toList());

        }

        @Override
        public List<RefundDTO> getRefundByStore(Long storeId) throws Exception {
                return refundRepository.findByStoreId(storeId).stream().map(RefundMapper::toDTO)
                                .collect(Collectors.toList());
        }

        @Override
        public RefundDTO getRefundById(Long refundId) throws Exception {
                return refundRepository.findById(refundId).map(RefundMapper::toDTO).orElseThrow(
                                () -> new Exception("Refund Not Found"));
        }

        @Override
        public void deleteRefund(Long refundId) throws Exception {

                this.getRefundById(refundId);
                refundRepository.deleteById(refundId);
        }
}
