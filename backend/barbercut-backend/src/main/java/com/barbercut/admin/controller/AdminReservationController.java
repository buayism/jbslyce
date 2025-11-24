package com.barbercut.admin.controller;

import com.barbercut.admin.dto.AdminReservationView;
import com.barbercut.admin.service.AdminReservationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/reservations")
@CrossOrigin(origins = "*")
public class AdminReservationController {

    @Autowired
    private AdminReservationService service;

    @GetMapping
    public ResponseEntity<List<AdminReservationView>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {
        List<AdminReservationView> reservations = service.findAll(status, sortBy, dateFrom, dateTo);
        return new ResponseEntity<>(reservations, HttpStatus.OK);
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<Map<String, Object>> cancel(@PathVariable String id) {
        AdminReservationView res = service.cancel(id);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Reservation cancelled successfully");
        response.put("reservation", res);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable String id) {
        service.delete(id);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Reservation deleted successfully");
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}
