package com.barbercut.notification.controller;

import com.barbercut.notification.model.Notification;
import com.barbercut.notification.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

@RestController
@RequestMapping("/api/admin/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    @Autowired
    private NotificationService service;

    @GetMapping
    public ResponseEntity<List<Notification>> list() {
        return ResponseEntity.ok(service.listAll());
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream() {
        return service.subscribe();
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> setRead(@PathVariable String id, @RequestParam(name = "value", defaultValue = "true") boolean value) {
        Notification n = service.setRead(id, value);
        if (n == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(n);
    }

    @PutMapping("/mark-read")
    public ResponseEntity<?> markAllRead() {
        service.markAllRead();
        return ResponseEntity.ok().build();
    }
}
