package com.clothing.repository;

import com.clothing.entity.CancellationRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface CancellationRequestRepository extends JpaRepository<CancellationRequest, Long> {

    Optional<CancellationRequest> findFirstByOrderIdOrderByCreatedAtDesc(Long orderId);

    Optional<CancellationRequest> findFirstByOrderIdAndCustomerIdOrderByCreatedAtDesc(Long orderId, Long customerId);

    List<CancellationRequest> findAllByCustomerIdOrderByCreatedAtDesc(Long customerId);

    boolean existsByOrderIdAndCustomerIdAndStatusIn(Long orderId, Long customerId, Collection<String> statuses);
}
