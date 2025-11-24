package com.barbercut.notification.service;

import com.barbercut.notification.model.Notification;
import com.barbercut.notification.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class NotificationService {
    @Autowired
    private NotificationRepository repository;

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public List<Notification> listAll() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    public Notification setRead(String id, boolean read) {
        Optional<Notification> opt = repository.findById(id);
        if (opt.isEmpty()) return null;
        Notification n = opt.get();
        n.setRead(read);
        return repository.save(n);
    }

    public void markAllRead() {
        List<Notification> all = repository.findAll();
        for (Notification n : all) {
            if (!n.isRead()) {
                n.setRead(true);
            }
        }
        repository.saveAll(all);
    }

    public Notification publish(String type, String title, String body, String actorId, String targetId, Map<String, Object> meta) {
        Notification n = new Notification(type, title, body);
        n.setActorId(actorId);
        n.setTargetId(targetId);
        n.setMeta(meta);
        if (n.getCreatedAt() == null) n.setCreatedAt(Instant.now());
        Notification saved = repository.save(n);
        broadcast(saved);
        return saved;
    }

    public SseEmitter subscribe() {
        // Keep-alive emitter; 0 means no timeout
        SseEmitter emitter = new SseEmitter(0L);
        emitters.add(emitter);
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError(e -> emitters.remove(emitter));
        // Initial hello
        try {
            SseEmitter.SseEventBuilder ev = SseEmitter.event()
                    .name("hello").data("connected").id(UUID.randomUUID().toString())
                    .reconnectTime(3000);
            emitter.send(ev);
        } catch (IOException ignored) {}
        return emitter;
    }

    private void broadcast(Notification n) {
        List<SseEmitter> dead = new ArrayList<>();
        for (SseEmitter emitter : emitters) {
            try {
                SseEmitter.SseEventBuilder ev = SseEmitter.event()
                        .name("notification")
                        .data(n, MediaType.APPLICATION_JSON)
                        .id(n.getId() != null ? n.getId() : UUID.randomUUID().toString());
                emitter.send(ev);
            } catch (Exception e) {
                dead.add(emitter);
            }
        }
        if (!dead.isEmpty()) emitters.removeAll(dead);
    }
}
