package com.barbercut.admin.controller;

import com.barbercut.admin.dto.AdminClientView;
import com.barbercut.admin.service.AdminClientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/clients")
@CrossOrigin(origins = "*")
public class AdminClientController {

    @Autowired
    private AdminClientService service;

    @GetMapping
    public ResponseEntity<List<AdminClientView>> list() {
        List<AdminClientView> clients = service.findAll();
        return new ResponseEntity<>(clients, HttpStatus.OK);
    }

    @PutMapping("/{id}/ban")
    public ResponseEntity<Map<String, Object>> ban(@PathVariable String id) {
        AdminClientView client = service.ban(id);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Client banned successfully");
        response.put("client", client);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable String id) {
        service.delete(id);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Client deleted successfully");
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}
