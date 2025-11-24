package com.barbercut.reservation.repository;

import com.barbercut.reservation.model.Slot;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.Instant;
import java.util.List;

public interface SlotRepository extends MongoRepository<Slot, String> {
    List<Slot> findByBarberIdOrderByStartAsc(String barberId);
    boolean existsByBarberIdAndStart(String barberId, Instant start);
}
