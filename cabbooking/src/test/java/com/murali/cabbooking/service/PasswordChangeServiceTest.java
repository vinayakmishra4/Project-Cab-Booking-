package com.murali.cabbooking.service;

import com.murali.cabbooking.entity.Employee;
import com.murali.cabbooking.entity.Role;
import com.murali.cabbooking.entity.User;
import com.murali.cabbooking.repository.EmployeeRepository;
import com.murali.cabbooking.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class PasswordChangeServiceTest {

    private EmployeeRepository employeeRepository;
    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private PasswordChangeService service;

    @BeforeEach
    void setUp() {
        employeeRepository = mock(EmployeeRepository.class);
        userRepository = mock(UserRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        service = new PasswordChangeService(employeeRepository, userRepository, passwordEncoder);
    }

    @Test
    void changesEmployeePasswordAfterCheckingOldPassword() {
        Employee employee = Employee.builder()
                .email("employee@example.com")
                .password("old-hash")
                .build();
        when(employeeRepository.findByEmail("employee@example.com")).thenReturn(Optional.of(employee));
        when(passwordEncoder.matches("old-password", "old-hash")).thenReturn(true);
        when(passwordEncoder.encode("NewSecurePassword123")).thenReturn("new-hash");

        assertTrue(service.changePassword(
                "Employee@example.com", "EMPLOYEE", "old-password", "NewSecurePassword123"
        ));

        verify(employeeRepository).save(argThat(saved -> saved.getPassword().equals("new-hash")));
        verifyNoInteractions(userRepository);
    }

    @Test
    void changesDriverPasswordAfterCheckingOldPassword() {
        User driver = User.builder()
                .email("driver@example.com")
                .password("old-hash")
                .role(Role.DRIVER)
                .enabled(true)
                .build();
        when(userRepository.findByEmail("driver@example.com")).thenReturn(Optional.of(driver));
        when(passwordEncoder.matches("old-password", "old-hash")).thenReturn(true);
        when(passwordEncoder.encode("NewSecurePassword123")).thenReturn("new-hash");

        assertTrue(service.changePassword(
                "driver@example.com", "DRIVER", "old-password", "NewSecurePassword123"
        ));

        verify(userRepository).save(argThat(saved -> saved.getPassword().equals("new-hash")));
    }

    @Test
    void rejectsIncorrectOldPasswordWithoutSaving() {
        User driver = User.builder()
                .email("driver@example.com")
                .password("old-hash")
                .role(Role.DRIVER)
                .enabled(true)
                .build();
        when(userRepository.findByEmail("driver@example.com")).thenReturn(Optional.of(driver));
        when(passwordEncoder.matches("wrong-password", "old-hash")).thenReturn(false);

        assertFalse(service.changePassword(
                "driver@example.com", "DRIVER", "wrong-password", "NewSecurePassword123"
        ));

        verify(userRepository, never()).save(any(User.class));
    }
}
