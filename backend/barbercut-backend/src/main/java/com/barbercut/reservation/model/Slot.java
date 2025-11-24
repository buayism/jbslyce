package com.barbercut.reservation.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "slots")
@CompoundIndex(name = "barber_start_idx", def = "{ 'barberId': 1, 'start': 1 }", unique = true)
public class Slot {
    @Id
    private String id;
    private String barberId;
    private Instant start;
    private Instant end;

    public Slot() {}

    public Slot(String barberId, Instant start, Instant end) {
        this.barberId = barberId;
        this.start = start;
        this.end = end;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getBarberId() { return barberId; }
    public void setBarberId(String barberId) { this.barberId = barberId; }

    public Instant getStart() { return start; }
    public void setStart(Instant start) { this.start = start; }

    public Instant getEnd() { return end; }
    public void setEnd(Instant end) { this.end = end; }
}
