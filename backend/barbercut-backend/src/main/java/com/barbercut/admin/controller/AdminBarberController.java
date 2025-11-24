package com.barbercut.admin.controller;

import com.barbercut.admin.model.Barber;
import com.barbercut.admin.service.BarberAdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/barbers")
@CrossOrigin(origins = "*")
public class AdminBarberController {

    @Autowired
    private BarberAdminService service;

    @GetMapping
    public ResponseEntity<List<Barber>> list() {
        return new ResponseEntity<>(service.findAll(), HttpStatus.OK);
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<Map<String, Object>> approve(@PathVariable String id) {
        Barber b = service.approve(id);
        Map<String, Object> res = new HashMap<>();
        res.put("message", "Barber approved successfully");
        res.put("barber", b);
        return new ResponseEntity<>(res, HttpStatus.OK);
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<Map<String, Object>> reject(@PathVariable String id) {
        Barber b = service.reject(id);
        Map<String, Object> res = new HashMap<>();
        res.put("message", "Barber rejected successfully");
        res.put("barber", b);
        return new ResponseEntity<>(res, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable String id) {
        service.delete(id);
        Map<String, Object> res = new HashMap<>();
        res.put("message", "Barber deleted successfully");
        return new ResponseEntity<>(res, HttpStatus.OK);
    }
}
