package com.murali.cabbooking.service;

import com.murali.cabbooking.entity.UserSession;
import com.murali.cabbooking.repository.UserSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserSessionService {

    private final UserSessionRepository sessionRepository;

    @Transactional
    public UserSession createSession(String email, String role, int idleTimeoutMinutes) {
        UUID sessionId = UUID.randomUUID();
        OffsetDateTime now = OffsetDateTime.now();
        
        // 12-hour absolute expiry as requested
        OffsetDateTime absoluteExpiry = now.plusHours(12);

        UserSession session = UserSession.builder()
                .id(sessionId)
                .email(email)
                .role(role)
                .lastActivityAt(now)
                .idleTimeoutSeconds(idleTimeoutMinutes * 60)
                .absoluteExpiresAt(absoluteExpiry)
                .revoked(false)
                .build();

        return sessionRepository.save(session);
    }

    @Transactional(readOnly = true)
    public boolean isSessionValid(UUID sessionId) {
        Optional<UserSession> optionalSession = sessionRepository.findByIdAndRevokedFalse(sessionId);
        if (optionalSession.isEmpty()) {
            return false;
        }

        UserSession session = optionalSession.get();
        OffsetDateTime now = OffsetDateTime.now();

        // Check absolute expiry
        if (now.isAfter(session.getAbsoluteExpiresAt())) {
            return false;
        }

        // Check idle/inactivity timeout
        OffsetDateTime idleExpiryLimit = session.getLastActivityAt().plusSeconds(session.getIdleTimeoutSeconds());
        if (now.isAfter(idleExpiryLimit)) {
            return false;
        }

        return true;
    }

    @Transactional
    public boolean updateActivity(UUID sessionId) {
        Optional<UserSession> optionalSession = sessionRepository.findByIdAndRevokedFalse(sessionId);
        if (optionalSession.isEmpty()) {
            return false;
        }

        UserSession session = optionalSession.get();
        OffsetDateTime now = OffsetDateTime.now();

        // Verify it hasn't already expired
        if (now.isAfter(session.getAbsoluteExpiresAt()) || 
            now.isAfter(session.getLastActivityAt().plusSeconds(session.getIdleTimeoutSeconds()))) {
            return false;
        }

        session.setLastActivityAt(now);
        sessionRepository.save(session);
        return true;
    }

    @Transactional
    public void revokeSession(UUID sessionId) {
        sessionRepository.findById(sessionId).ifPresent(session -> {
            session.setRevoked(true);
            sessionRepository.save(session);
        });
    }
}
