package com.murali.cabbooking.controller;

import com.murali.cabbooking.dto.AdminDashboardResponse;
import com.murali.cabbooking.dto.AdminDashboardResponse.AdminRideSummary;
import com.murali.cabbooking.dto.AdminDashboardResponse.DailyBookingCount;
import com.murali.cabbooking.entity.*;
import com.murali.cabbooking.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Date;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final CabRepository cabRepository;
    private final RideRepository rideRepository;
    private final EmployeeRepository employeeRepository;
    private final AdminRepository adminRepository;
    private final BillingRepository billingRepository;

    @GetMapping("/dashboard")
    public AdminDashboardResponse dashboard() {
        LocalDate today = LocalDate.now();
        LocalDate trendStart = today.minusDays(6);
        Map<LocalDate, Long> countsByDate = new HashMap<>();
        for (Object[] row : rideRepository.findDailyBookingCountsSince(trendStart)) {
            LocalDate date = row[0] instanceof Date sqlDate
                    ? sqlDate.toLocalDate()
                    : LocalDate.parse(row[0].toString());
            countsByDate.put(date, ((Number) row[1]).longValue());
        }
        List<DailyBookingCount> bookingTrend = new ArrayList<>();
        for (int day = 0; day < 7; day++) {
            LocalDate date = trendStart.plusDays(day);
            bookingTrend.add(new DailyBookingCount(date.toString(), countsByDate.getOrDefault(date, 0L)));
        }

        List<AdminRideSummary> recentBookings = rideRepository.findTop8ByOrderByCreatedAtDesc()
                .stream()
                .map(ride -> {
                    Employee employee = ride.getEmployee();
                    User passenger = ride.getUser();
                    User driver = ride.getCab() == null ? null : ride.getCab().getDriver();
                    return new AdminRideSummary(
                            ride.getId(),
                            employee != null ? employee.getName() : passenger == null ? null : passenger.getName(),
                            employee != null ? employee.getEmployeeId()
                                    : passenger == null ? null : passenger.getEmployeeId(),
                            driver == null ? null : driver.getName(),
                            driver == null ? null : driver.getDriverId(),
                            ride.getCab() == null ? null : ride.getCab().getModel(),
                            ride.getCab() == null ? null : ride.getCab().getCarNumber(),
                            ride.getPickupAddress(),
                            ride.getDropoffAddress(),
                            ride.getStatus() == null ? null : ride.getStatus().name(),
                            ride.getCreatedAt() == null ? null : ride.getCreatedAt().toString(),
                            ride.getFare()
                    );
                })
                .toList();

        return new AdminDashboardResponse(
                rideRepository.count(),
                rideRepository.countByStatus(RideStatus.COMPLETED),
                rideRepository.countByStatusIn(List.of(RideStatus.ACCEPTED, RideStatus.STARTED)),
                rideRepository.countByStatus(RideStatus.REQUESTED),
                employeeRepository.count() + userRepository.countByRole(Role.USER),
                userRepository.countByRole(Role.DRIVER),
                adminRepository.count(),
                cabRepository.count(),
                cabRepository.countByAvailableTrue(),
                cabRepository.countByOnlineTrue(),
                bookingTrend,
                recentBookings
        );
    }

    // 👤 Get all users
    @GetMapping("/all-users")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @DeleteMapping("/drivers/{id}")
    @Transactional
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteDriver(@PathVariable Long id) {
        User driver = userRepository.findById(id)
                .filter(user -> user.getRole() == Role.DRIVER)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver not found"));
        List<Cab> cabs = cabRepository.findByDriver(driver);
        List<Ride> rides = cabs.isEmpty() ? List.of() : rideRepository.findByCabIn(cabs);
        deleteRidesAndBilling(rides);
        cabRepository.deleteAll(cabs);
        userRepository.delete(driver);
    }

    @GetMapping("/all-employees")
    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }

    @DeleteMapping("/employees/{id}")
    @Transactional
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteEmployee(@PathVariable Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));
        List<Ride> rides = rideRepository.findByEmployee(employee);
        User legacyAccount = userRepository.findByEmail(employee.getEmail())
                .filter(user -> user.getRole() == Role.USER)
                .orElse(null);
        if (legacyAccount != null) {
            rides.addAll(rideRepository.findByUser(legacyAccount));
        }
        deleteRidesAndBilling(rides);
        employeeRepository.delete(employee);
        if (legacyAccount != null) {
            userRepository.delete(legacyAccount);
        }
    }

    @DeleteMapping("/employees/legacy/{id}")
    @Transactional
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteLegacyEmployee(@PathVariable Long id) {
        User employee = userRepository.findById(id)
                .filter(user -> user.getRole() == Role.USER)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee account not found"));
        deleteRidesAndBilling(rideRepository.findByUser(employee));
        userRepository.delete(employee);
    }

    @GetMapping("/all-admins")
    public List<Admin> getAllAdmins() {
        return adminRepository.findAll();
    }

    // 🚗 Get all cabs
    @GetMapping("/all-cabs")
    public List<Cab> getAllCabs() {
        return cabRepository.findAll();
    }

    // 🚖 Get all rides
    @GetMapping("/all-rides")
    public List<Ride> getAllRides() {
        return rideRepository.findAll();
    }

    private void deleteRidesAndBilling(List<Ride> rides) {
        Map<Long, Ride> uniqueRides = new LinkedHashMap<>();
        rides.forEach(ride -> uniqueRides.put(ride.getId(), ride));
        List<Ride> ridesToDelete = List.copyOf(uniqueRides.values());
        if (ridesToDelete.isEmpty()) return;
        billingRepository.deleteAll(billingRepository.findByRideIn(ridesToDelete));
        rideRepository.deleteAll(ridesToDelete);
    }
}