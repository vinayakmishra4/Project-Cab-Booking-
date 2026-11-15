
package com.murali.cabbooking.security;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.Collections;

@Component
@RequiredArgsConstructor
public class WebSocketJwtInterceptor implements ChannelInterceptor {

    private final JwtUtil jwtUtil;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {

        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(
                        message,
                        StompHeaderAccessor.class
                );

        if (accessor == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {

            String header = accessor.getFirstNativeHeader("Authorization");

            if (header == null || !header.startsWith("Bearer ")) {
                throw new IllegalArgumentException(
                        "Missing WebSocket JWT token"
                );
            }

            String token = header.substring(7);

            try {
                if (!jwtUtil.isTokenValid(token)) {
                    throw new IllegalArgumentException(
                            "Expired or invalid WebSocket JWT token"
                    );
                }

                String email = jwtUtil.extractEmail(token);
                String role = jwtUtil.extractRole(token);

                if (email == null || email.isBlank()) {
                    throw new IllegalArgumentException(
                            "Invalid WebSocket user"
                    );
                }

                if (!"EMPLOYEE".equals(role)
                        && !"USER".equals(role)
                        && !"DRIVER".equals(role)
                        && !"ADMIN".equals(role)) {

                    throw new IllegalArgumentException(
                            "Invalid WebSocket role"
                    );
                }

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                email,
                                null,
                                Collections.singletonList(
                                        new SimpleGrantedAuthority("ROLE_" + role)
                                )
                        );

                accessor.setUser(authentication);

            } catch (Exception exception) {
                throw new IllegalArgumentException(
                        "WebSocket authentication failed: invalid token",
                        exception
                );
            }
        }

        return message;
    }
}
