package com.clothing.service;

import com.clothing.entity.IdempotencyRecord;
import com.clothing.repository.IdempotencyRecordRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class IdempotencyService {

    private final IdempotencyRecordRepository idempotencyRecordRepository;

    public IdempotencyService(IdempotencyRecordRepository idempotencyRecordRepository) {
        this.idempotencyRecordRepository = idempotencyRecordRepository;
    }

    @Transactional(readOnly = true)
    public Optional<IdempotencyRecord> findRecord(String idempotencyKey, Long customerId) {
        if (idempotencyKey == null || idempotencyKey.isBlank() || customerId == null) {
            return Optional.empty();
        }
        return idempotencyRecordRepository.findByIdempotencyKeyAndCustomerId(idempotencyKey.trim(), customerId);
    }

    @Transactional
    public void saveRecord(String idempotencyKey, Long customerId, String resourceType, String resourceId, String responsePayload) {
        if (idempotencyKey == null || idempotencyKey.isBlank() || customerId == null) {
            return;
        }
        try {
            IdempotencyRecord record = new IdempotencyRecord(
                idempotencyKey.trim(),
                customerId,
                resourceType,
                resourceId,
                responsePayload
            );
            idempotencyRecordRepository.save(record);
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(IdempotencyService.class).warn("Could not save idempotency record: {}", e.getMessage());
        }
    }
}
