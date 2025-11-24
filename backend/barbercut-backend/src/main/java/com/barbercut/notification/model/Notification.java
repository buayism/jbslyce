package com.barbercut.notification.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.Map;

@Document(collection = "notifications")
public class Notification {
    @Id
    private String id;
    private String type; // e.g. SLOT_CREATED, BOOKED, RESERVATION_COMPLETED, USER_SIGNUP, RATING_REVIEW, RESERVATION_DECISION, PROFILE_UPDATE
    private String title;
    private String body;
    private Instant createdAt;
    private boolean read;
    private String actorId;   // who triggered it (optional)
    private String targetId;  // reservationId/barberId/userId (optional)
    private Map<String, Object> meta; // optional payload

    public Notification() {}

    public Notification(String type, String title, String body) {
        this.type = type;
        this.title = title;
        this.body = body;
        this.createdAt = Instant.now();
        this.read = false;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }

    public String getActorId() { return actorId; }
    public void setActorId(String actorId) { this.actorId = actorId; }

    public String getTargetId() { return targetId; }
    public void setTargetId(String targetId) { this.targetId = targetId; }

    public Map<String, Object> getMeta() { return meta; }
    public void setMeta(Map<String, Object> meta) { this.meta = meta; }
}
