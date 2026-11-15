
package com.murali.cabbooking.service;

import com.murali.cabbooking.entity.Ride;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class RideNotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    public void sendRideStatusUpdate(Ride ride) {

        if (ride == null || ride.getEmployee() == null) {
            return;
        }

        String employeeEmail = ride.getEmployee().getEmail();

        if (employeeEmail == null || employeeEmail.isBlank()) {
            return;
        }

        Map<String, Object> notification = Map.of(
                "rideId", ride.getId(),
                "status", ride.getStatus().name()
        );

        messagingTemplate.convertAndSendToUser(
                employeeEmail,
                "/queue/ride-updates",
                notification
        );
    }
}
