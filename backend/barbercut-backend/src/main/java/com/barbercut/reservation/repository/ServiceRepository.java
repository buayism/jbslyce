package com.barbercut.reservation.repository;

import com.barbercut.reservation.model.Service;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ServiceRepository extends MongoRepository<Service, String> {
    // No custom queries needed for now
}

