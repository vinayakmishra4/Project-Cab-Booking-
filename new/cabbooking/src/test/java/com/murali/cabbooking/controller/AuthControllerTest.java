package com.murali.cabbooking.controller;

import com.murali.cabbooking.dto.AuthRequest;
import com.murali.cabbooking.dto.AuthResponse;
import com.murali.cabbooking.dto.ChangePasswordRequest;
import com.murali.cabbooking.dto.RegisterRequest;
import com.murali.cabbooking.dto.RegisterResponse;
import com.murali.cabbooking.entity.Employee;
import com.murali.cabbooking.entity.Role;
import com.murali.cabbooking.entity.User;
import com.murali.cabbooking.entity.Admin;
import com.murali.cabbooking.repository.AdminRepository;
import com.murali.cabbooking.repository.EmployeeRepository;
import com.murali.cabbooking.repository.UserRepository;
import com.murali.cabbooking.security.JwtUtil;
import com.murali.cabbooking.service.PasswordChangeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private AdminRepository adminRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private PasswordChangeService passwordChangeService;

    @InjectMocks
    private AuthController authController;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(1L)
                .name("Portal User")
                .email("person@example.com")
                .password("encoded-password")
                .role(Role.USER)
                .enabled(true)
                .build();
        lenient().when(userRepository.findByEmail("person@example.com")).thenReturn(Optional.of(user));
        lenient().when(employeeRepository.findByEmail("person@example.com")).thenReturn(Optional.empty());
        lenient().when(passwordEncoder.matches("password", "encoded-password")).thenReturn(true);
    }

    @Test
    void employeePortalAcceptsEmployeeAccount() {
        when(jwtUtil.generateToken("person@example.com", "USER")).thenReturn("employee-token");

        ResponseEntity<?> response = authController.login(request("EMPLOYEE"));

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("employee-token", assertInstanceOf(AuthResponse.class, response.getBody()).getToken());
    }

    @Test
    void employeePortalAcceptsEmployeeFromEmployeeTable() {
        Employee employee = Employee.builder()
                .employeeId("EMP-1024")
                .name("Portal User")
                .email("person@example.com")
                .phone("+91 98765 43210")
                .password("encoded-password")
                .build();
        when(employeeRepository.findByEmail("person@example.com")).thenReturn(Optional.of(employee));
        when(jwtUtil.generateToken("person@example.com", "USER")).thenReturn("employee-token");

        ResponseEntity<?> response = authController.login(request("EMPLOYEE"));

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("employee-token", assertInstanceOf(AuthResponse.class, response.getBody()).getToken());
        verify(userRepository, never()).findByEmail("person@example.com");
    }

    @Test
    void driverPortalAcceptsDriverAccount() {
        user.setRole(Role.DRIVER);
        when(jwtUtil.generateToken("person@example.com", "DRIVER")).thenReturn("driver-token");

        ResponseEntity<?> response = authController.login(request("DRIVER"));

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("driver-token", assertInstanceOf(AuthResponse.class, response.getBody()).getToken());
    }

    @Test
    void adminPortalAcceptsAdminAccount() {
        Admin admin = Admin.builder()
                .name("Portal Admin")
                .email("person@example.com")
                .password("encoded-password")
                .enabled(true)
                .build();
        when(adminRepository.findByEmail("person@example.com")).thenReturn(Optional.of(admin));
        when(jwtUtil.generateToken("person@example.com", "ADMIN")).thenReturn("admin-token");

        ResponseEntity<?> response = authController.login(request("ADMIN"));

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("admin-token", assertInstanceOf(AuthResponse.class, response.getBody()).getToken());
        verify(userRepository, never()).findByEmail("person@example.com");
    }

    @Test
    void adminPortalRehashesPasswordWhenStoredEncodingNeedsUpgrade() {
        Admin admin = Admin.builder()
                .name("Portal Admin")
                .email("person@example.com")
                .password("legacy-encoded-password")
                .enabled(true)
                .build();
        when(adminRepository.findByEmail("person@example.com")).thenReturn(Optional.of(admin));
        when(passwordEncoder.matches("password", "legacy-encoded-password")).thenReturn(true);
        when(passwordEncoder.upgradeEncoding("legacy-encoded-password")).thenReturn(true);
        when(passwordEncoder.encode("password")).thenReturn("current-encoded-password");
        when(jwtUtil.generateToken("person@example.com", "ADMIN")).thenReturn("admin-token");

        ResponseEntity<?> response = authController.login(request("ADMIN"));

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("current-encoded-password", admin.getPassword());
        verify(adminRepository).save(admin);
    }

    @Test
    void driverRegistrationGeneratesDriverIdAfterUserIdIsAssigned() {
        when(userRepository.existsByEmail("driver@example.com")).thenReturn(false);
        when(userRepository.existsByLicenseNumber("DL123456789")).thenReturn(false);
        when(passwordEncoder.encode("password")).thenReturn("encoded-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            if (saved.getId() == null) saved.setId(42L);
            return saved;
        });

        ResponseEntity<?> response = authController.register(registration("DRIVER"));

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        RegisterResponse body = assertInstanceOf(RegisterResponse.class, response.getBody());
        assertEquals("DRV-000042", body.driverId());
        assertEquals("DRIVER", body.role());
        assertNotNull(body.driverId());
        verify(userRepository, times(2)).save(any(User.class));
    }

    @Test
    void employeeRegistrationStoresEmployeeIdAndPhone() {
        when(userRepository.existsByEmail("driver@example.com")).thenReturn(false);
        when(employeeRepository.existsByEmail("driver@example.com")).thenReturn(false);
        when(userRepository.existsByEmployeeId("EMP-1024")).thenReturn(false);
        when(employeeRepository.existsByEmployeeId("EMP-1024")).thenReturn(false);
        when(passwordEncoder.encode("password")).thenReturn("encoded-password");
        when(employeeRepository.save(any(Employee.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ResponseEntity<?> response = authController.register(registration("EMPLOYEE"));

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        RegisterResponse body = assertInstanceOf(RegisterResponse.class, response.getBody());
        assertEquals("EMP-1024", body.employeeId());
        assertEquals("EMPLOYEE", body.role());
        verify(employeeRepository).save(argThat(saved ->
                saved.getEmployeeId().equals("EMP-1024")
                        && saved.getEmail().equals("driver@example.com")
                        && saved.getPhone().equals("+91 98765 43210")
                        && saved.getPassword().equals("encoded-password")));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void driverPortalRejectsEmployeeAccount() {
        ResponseEntity<?> response = authController.login(request("DRIVER"));

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    void adminPortalRejectsEmployeeAccount() {
        ResponseEntity<?> response = authController.login(request("ADMIN"));

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    void changePasswordUpdatesOnlyWhenCurrentPasswordIsVerified() {
        when(passwordChangeService.changePassword(
                "person@example.com",
                "DRIVER",
                "old-password",
                "NewSecurePassword123"
        )).thenReturn(true);

        ResponseEntity<?> response = authController.changePassword(new ChangePasswordRequest(
                "person@example.com",
                "DRIVER",
                "old-password",
                "NewSecurePassword123",
                "NewSecurePassword123"
        ));

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(passwordChangeService).changePassword(
                "person@example.com",
                "DRIVER",
                "old-password",
                "NewSecurePassword123"
        );
    }

    @Test
    void changePasswordRejectsMismatchedConfirmation() {
        ResponseEntity<?> response = authController.changePassword(new ChangePasswordRequest(
                "person@example.com",
                "EMPLOYEE",
                "old-password",
                "NewSecurePassword123",
                "DifferentPassword123"
        ));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        verifyNoInteractions(passwordChangeService);
    }

    @Test
    void changePasswordRejectsPasswordsContainingWhitespace() {
        ResponseEntity<?> response = authController.changePassword(new ChangePasswordRequest(
                "person@example.com",
                "EMPLOYEE",
                "old-password",
                "New Secure Password",
                "New Secure Password"
        ));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        verifyNoInteractions(passwordChangeService);
    }

    private AuthRequest request(String portal) {
        AuthRequest request = new AuthRequest();
        request.setEmail("person@example.com");
        request.setPassword("password");
        request.setPortal(portal);
        return request;
    }

    private RegisterRequest registration(String role) {
        RegisterRequest request = new RegisterRequest();
        request.setRole(role);
        request.setEmployeeId("EMP-1024");
        request.setName("Portal User");
        request.setEmail("driver@example.com");
        request.setPhone("+91 98765 43210");
        request.setLicenseNumber("DL123456789");
        request.setPassword("password");
        request.setConfirmPassword("password");
        return request;
    }
}
