package com.murali.cabbooking.service;

import com.murali.cabbooking.entity.Employee;
import com.murali.cabbooking.entity.Role;
import com.murali.cabbooking.entity.User;
import com.murali.cabbooking.repository.EmployeeRepository;
import com.murali.cabbooking.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class PasswordChangeService {

    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public boolean changePassword(String requestedEmail, String requestedPortal,
                                 String oldPassword, String newPassword) {
        String email = requestedEmail.trim().toLowerCase(Locale.ROOT);
        String portal = requestedPortal.trim().toUpperCase(Locale.ROOT);

        if (portal.equals("EMPLOYEE")) {
            Employee employee = employeeRepository.findByEmail(email).orElse(null);
            if (employee != null) {
                if (!passwordEncoder.matches(oldPassword, employee.getPassword())) return false;
                employee.setPassword(passwordEncoder.encode(newPassword));
                employeeRepository.save(employee);
                return true;
            }

            User legacyEmployee = userRepository.findByEmail(email)
                    .filter(user -> user.getRole() == Role.USER && user.isEnabled())
                    .orElse(null);
            if (legacyEmployee == null || !passwordEncoder.matches(oldPassword, legacyEmployee.getPassword())) {
                return false;
            }
            legacyEmployee.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(legacyEmployee);
            return true;
        }

        if (!portal.equals("DRIVER")) return false;
        User driver = userRepository.findByEmail(email)
                .filter(user -> user.getRole() == Role.DRIVER && user.isEnabled())
                .orElse(null);
        if (driver == null || !passwordEncoder.matches(oldPassword, driver.getPassword())) return false;

        driver.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(driver);
        return true;
    }
}
