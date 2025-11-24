package com.barbercut.rating.repository;

import com.barbercut.rating.model.Rating;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RatingRepository extends MongoRepository<Rating, String> {
    Optional<Rating> findByReservationIdAndClientId(String reservationId, String clientId);
    List<Rating> findByBarberId(String barberId);
    List<Rating> findByClientId(String clientId);
}
