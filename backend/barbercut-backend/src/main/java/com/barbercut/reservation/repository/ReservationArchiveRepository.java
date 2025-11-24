package com.barbercut.reservation.repository;

import com.barbercut.reservation.model.ReservationArchive;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReservationArchiveRepository extends MongoRepository<ReservationArchive, String> {
    List<ReservationArchive> findByBarberId(String barberId);
}
