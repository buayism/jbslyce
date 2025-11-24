package com.barbercut.admin.repository;

import com.barbercut.admin.model.Barber;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface BarberRepository extends MongoRepository<Barber, String> {
    List<Barber> findByStatus(String status);
    boolean existsByEmail(String email);
}
