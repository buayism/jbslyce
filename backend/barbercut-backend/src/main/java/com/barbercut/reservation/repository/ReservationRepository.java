package com.barbercut.reservation.repository;

import com.barbercut.reservation.model.Reservation;
import com.barbercut.reservation.model.ReservationStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface ReservationRepository extends MongoRepository<Reservation, String> {
    List<Reservation> findByClientId(String clientId);

    List<Reservation> findByBarberIdAndStatus(String barberId, ReservationStatus status);

    List<Reservation> findByBarberId(String barberId);

    List<Reservation> findByStatus(ReservationStatus status);

    // Check if a barber has a reservation at a specific time slot
    boolean existsByBarberIdAndSlot(String barberId, Instant slot);

    // Check if a barber has a reservation at a specific time slot with status in list
    boolean existsByBarberIdAndSlotAndStatusIn(String barberId, Instant slot, List<ReservationStatus> statuses);
}