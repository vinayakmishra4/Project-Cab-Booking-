package com.murali.cabbooking.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_sessions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSession {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String role;

    @Column(name = "last_activity_at", nullable = false)
    private OffsetDateTime lastActivityAt;

    @Column(name = "idle_timeout_seconds", nullable = false)
    private Integer idleTimeoutSeconds;

    @Column(name = "absolute_expires_at", nullable = false)
    private OffsetDateTime absoluteExpiresAt;

    @Column(nullable = false)
    private boolean revoked = false;
}