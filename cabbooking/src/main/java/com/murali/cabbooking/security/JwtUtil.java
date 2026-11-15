package com.murali.cabbooking.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtUtil {

    private static final long TOKEN_VALIDITY = 1000L * 60 * 60 * 12; // 12 hours
    private final String SECRET = "mysecretkeymysecretkeymysecretkey123456";

    private final SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes());

    public String generateToken(String email, String role) {
        return generateToken(email, role, UUID.randomUUID());
    }

    // 🔥 Generate Token with Session ID
    public String generateToken(String email, String role, UUID sessionId) {
        return Jwts.builder()
                .subject(email)
                .claim("role", role)
                .claim("sid", sessionId.toString())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + TOKEN_VALIDITY))
                .signWith(key)
                .compact();
    }

    // 🔥 Extract Email
    public String extractEmail(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    // 🔥 Extract Role (THIS WAS MISSING)
    public String extractRole(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .get("role", String.class);
    }

    // 🔥 Extract Session ID
    public UUID extractSessionId(String token) {
        String sid = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .get("sid", String.class);
        return sid != null ? UUID.fromString(sid) : null;
    }

    // 🔥 Optional (Good Practice)
    public boolean isTokenValid(String token) {
        return !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        Date expiration = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getExpiration();

        return expiration.before(new Date());
    }
}