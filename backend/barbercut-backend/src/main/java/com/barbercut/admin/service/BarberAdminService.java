package com.barbercut.admin.service;

import com.barbercut.admin.model.Barber;
import com.barbercut.admin.repository.BarberRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class BarberAdminService {

    @Autowired
    private BarberRepository barberRepository;

    public List<Barber> findAll() {
        return barberRepository.findAll();
    }

    public Barber approve(String id) {
        Barber b = barberRepository.findById(id).orElse(null);
        if (b == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Barber not found");
        b.setStatus("approved");
        return barberRepository.save(b);
    }

    public Barber reject(String id) {
        Barber b = barberRepository.findById(id).orElse(null);
        if (b == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Barber not found");
        b.setStatus("rejected");
        return barberRepository.save(b);
    }

    public void delete(String id) {
        if (!barberRepository.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Barber not found");
        barberRepository.deleteById(id);
    }
}
