package com.murali.cabbooking.controller;

import com.murali.cabbooking.dto.*;
import com.murali.cabbooking.entity.*;
import com.murali.cabbooking.repository.AdminRepository;
import com.murali.cabbooking.repository.EmployeeRepository;
import com.murali.cabbooking.repository.UserRepository;
import com.murali.cabbooking.security.JwtUtil;
import com.murali.cabbooking.service.PasswordChangeService;
import com.murali.cabbooking.service.UserSessionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private PasswordChangeService passwordChangeService;

    @Autowired
    private UserSessionService userSessionService;

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        if (!request.newPassword().equals(request.confirmPassword())) {
            return ResponseEntity.badRequest().body(java.util.Map.of(
                    "message", "The passwords do not match."
            ));
        }
        if (request.newPassword().codePoints().anyMatch(Character::isWhitespace)
                || request.newPassword().equalsIgnoreCase(request.email().trim())) {
            return ResponseEntity.badRequest().body(java.util.Map.of(
                    "message", "Choose a password without spaces that is different from your email."
            ));
        }
        if (!passwordChangeService.changePassword(
                request.email(),
                request.portal(),
                request.oldPassword(),
                request.newPassword()
        )) {
            return ResponseEntity.badRequest().body(java.util.Map.of(
                    "message", "The email, old password, or selected account type is incorrect."
            ));
        }
        return ResponseEntity.ok(java.util.Map.of(
                "message", "Your password has been updated. Sign in with your new password."
        ));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        String requestedRole = request.getRole() == null ? "" : request.getRole().trim().toUpperCase();
        boolean employeeRegistration = requestedRole.equals("EMPLOYEE");
        boolean driverRegistration = requestedRole.equals("DRIVER");

        if (request.getName() == null || request.getName().isBlank()
                || request.getEmail() == null || request.getEmail().isBlank()
                || !request.getEmail().trim().matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")
                || request.getPhone() == null || request.getPhone().isBlank()
                || !request.getPhone().trim().matches("[+0-9() .-]{7,20}")
                || request.getPassword() == null || request.getPassword().length() < 8
                || !request.getPassword().equals(request.getConfirmPassword())
                || (!employeeRegistration && !driverRegistration)
                || (employeeRegistration && (request.getEmployeeId() == null || request.getEmployeeId().isBlank()))
                || (driverRegistration && (request.getLicenseNumber() == null || request.getLicenseNumber().isBlank()))) {
            return ResponseEntity.badRequest()
                    .body("Complete all required fields and make sure both passwords match.");
        }

        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email) || employeeRepository.existsByEmail(email)
                || adminRepository.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("An account with this email already exists.");
        }

        String employeeId = employeeRegistration ? request.getEmployeeId().trim() : null;
        String licenseNumber = driverRegistration ? request.getLicenseNumber().trim().toUpperCase() : null;
        if (employeeRegistration && (userRepository.existsByEmployeeId(employeeId)
                || employeeRepository.existsByEmployeeId(employeeId))) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("An account with this employee ID already exists.");
        }
        if (driverRegistration && userRepository.existsByLicenseNumber(licenseNumber)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("An account with this driving licence number already exists.");
        }

        if (employeeRegistration) {
            Employee employee = Employee.builder()
                    .employeeId(employeeId)
                    .name(request.getName().trim())
                    .email(email)
                    .phone(request.getPhone().trim())
                    .password(passwordEncoder.encode(request.getPassword()))
                    .build();
            employeeRepository.save(employee);

            return ResponseEntity.status(HttpStatus.CREATED).body(new RegisterResponse(
                    "Registration successful.",
                    "EMPLOYEE",
                    employee.getEmployeeId(),
                    null
            ));
        }

        User user = new User();
        user.setName(request.getName().trim());
        user.setEmail(email);
        user.setPhone(request.getPhone().trim());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.DRIVER);
        user.setEnabled(true);

        user.setLicenseNumber(licenseNumber);

        userRepository.save(user);
        user.setDriverId(String.format("DRV-%06d", user.getId()));
        userRepository.save(user);

        return ResponseEntity.status(HttpStatus.CREATED).body(new RegisterResponse(
                "Registration successful.",
                "DRIVER",
                null,
                user.getDriverId()
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {

        if (request.getEmail() == null || request.getPassword() == null || request.getPortal() == null) {
            return ResponseEntity.badRequest().body("Email, password, and portal are required.");
        }

        String email = request.getEmail().trim().toLowerCase();
        String portal = request.getPortal().trim().toUpperCase();
        if (portal.equals("EMPLOYEE")) {
            Employee employee = employeeRepository.findByEmail(email).orElse(null);
            if (employee != null && passwordEncoder.matches(request.getPassword(), employee.getPassword())) {
                UserSession session = userSessionService.createSession(employee.getEmail(), Role.USER.name(), 30);
                String token = jwtUtil.generateToken(employee.getEmail(), Role.USER.name(), session.getId());
                return ResponseEntity.ok(new AuthResponse(token));
            }

            User legacyEmployee = userRepository.findByEmail(email)
                    .filter(user -> user.getRole() == Role.USER)
                    .orElse(null);
            if (legacyEmployee != null && legacyEmployee.isEnabled()
                    && passwordEncoder.matches(request.getPassword(), legacyEmployee.getPassword())) {
                UserSession session = userSessionService.createSession(legacyEmployee.getEmail(), Role.USER.name(), 30);
                String token = jwtUtil.generateToken(legacyEmployee.getEmail(), Role.USER.name(), session.getId());
                return ResponseEntity.ok(new AuthResponse(token));
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid email or password for the selected portal.");
        }

        if (portal.equals("ADMIN")) {
            Admin admin = adminRepository.findByEmailIgnoreCase(email).orElse(null);
            if (admin == null) {
                User legacyAdmin = userRepository.findByEmail(email)
                        .filter(user -> user.getRole() == Role.ADMIN && user.isEnabled())
                        .orElse(null);
                if (legacyAdmin == null
                        || !passwordEncoder.matches(request.getPassword(), legacyAdmin.getPassword())) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body("Invalid email or password for the selected portal.");
                }

                admin = Admin.builder()
                        .name(legacyAdmin.getName() == null ? email : legacyAdmin.getName())
                        .email(legacyAdmin.getEmail())
                        .phone(legacyAdmin.getPhone())
                        .password(legacyAdmin.getPassword())
                        .enabled(legacyAdmin.isEnabled())
                        .build();
                admin = adminRepository.save(admin);
            }
            if (!admin.isEnabled()
                    || !passwordEncoder.matches(request.getPassword(), admin.getPassword())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Invalid email or password for the selected portal.");
            }
            if (passwordEncoder.upgradeEncoding(admin.getPassword())) {
                admin.setPassword(passwordEncoder.encode(request.getPassword()));
                adminRepository.save(admin);
            }
            UserSession session = userSessionService.createSession(admin.getEmail(), Role.ADMIN.name(), 15);
            return ResponseEntity.ok(new AuthResponse(
                    jwtUtil.generateToken(admin.getEmail(), Role.ADMIN.name(), session.getId())
            ));
        }

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid email or password for the selected portal.");
        }

        if (!user.isEnabled()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("This account is disabled.");
        }

        Role requestedRole = switch (portal) {
            case "DRIVER" -> Role.DRIVER;
            default -> null;
        };
        if (requestedRole == null || user.getRole() != requestedRole) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("This account does not have access to the selected portal.");
        }

        UserSession session = userSessionService.createSession(user.getEmail(), user.getRole().name(), 30);
        String token = jwtUtil.generateToken(
                user.getEmail(),
                user.getRole().name(),
                session.getId()
        );
        return ResponseEntity.ok(new AuthResponse(token));
    }

    @PostMapping("/activity")
    public ResponseEntity<?> recordActivity(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Missing token.");
        }
        try {
            String token = header.substring(7);
            UUID sessionId = jwtUtil.extractSessionId(token);
            if (sessionId == null || !userSessionService.updateActivity(sessionId)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Session expired.");
            }
            return ResponseEntity.ok(java.util.Map.of("status", "active"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid session.");
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            try {
                String token = header.substring(7);
                UUID sessionId = jwtUtil.extractSessionId(token);
                if (sessionId != null) {
                    userSessionService.revokeSession(sessionId);
                }
            } catch (Exception ignored) {
            }
        }
        return ResponseEntity.ok(java.util.Map.of("message", "Logged out successfully."));
    }
}