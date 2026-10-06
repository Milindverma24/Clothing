package com.clothing.repository;

import com.clothing.entity.ReturnRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReturnRequestRepository extends JpaRepository<ReturnRequest, Long> {

    Optional<ReturnRequest> findFirstByOrderIdOrderByCreatedAtDesc(Long orderId);

    Optional<ReturnRequest> findFirstByOrderIdAndCustomerIdOrderByCreatedAtDesc(Long orderId, Long customerId);

    List<ReturnRequest> findAllByCustomerIdOrderByCreatedAtDesc(Long customerId);

    boolean existsByOrderIdAndCustomerIdAndStatusIn(Long orderId, Long customerId, Collection<String> statuses);
}
