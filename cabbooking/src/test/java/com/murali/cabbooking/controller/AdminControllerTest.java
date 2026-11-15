package com.murali.cabbooking.controller;

import com.murali.cabbooking.dto.AdminDashboardResponse;
import com.murali.cabbooking.entity.*;
import com.murali.cabbooking.repository.*;
import org.junit.jupiter.api.Test;

import java.sql.Date;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AdminControllerTest {

    @Test
    void dashboardCombinesEmployeeDriverFleetAndBookingData() {
        UserRepository userRepository = mock(UserRepository.class);
        CabRepository cabRepository = mock(CabRepository.class);
        RideRepository rideRepository = mock(RideRepository.class);
        EmployeeRepository employeeRepository = mock(EmployeeRepository.class);
        AdminRepository adminRepository = mock(AdminRepository.class);
        BillingRepository billingRepository = mock(BillingRepository.class);
        AdminController controller = new AdminController(
                userRepository, cabRepository, rideRepository, employeeRepository, adminRepository, billingRepository
        );

        Employee employee = Employee.builder()
                .employeeId("EMP-42")
                .name("Employee Name")
                .build();
        User driver = User.builder()
                .name("Driver Name")
                .driverId("DRV-42")
                .role(Role.DRIVER)
                .build();
        Cab cab = Cab.builder()
                .model("Sedan")
                .carNumber("CAB-42")
                .driver(driver)
                .build();
        Ride ride = Ride.builder()
                .id(42L)
                .employee(employee)
                .cab(cab)
                .pickupAddress("Office")
                .dropoffAddress("Airport")
                .status(RideStatus.ACCEPTED)
                .createdAt(LocalDateTime.now())
                .fare(1250.0)
                .build();

        when(rideRepository.findDailyBookingCountsSince(any(LocalDate.class)))
                .thenReturn(Collections.singletonList(new Object[]{Date.valueOf(LocalDate.now()), 3L}));
        when(rideRepository.findTop8ByOrderByCreatedAtDesc()).thenReturn(List.of(ride));
        when(rideRepository.count()).thenReturn(10L);
        when(rideRepository.countByStatus(RideStatus.COMPLETED)).thenReturn(4L);
        when(rideRepository.countByStatusIn(List.of(RideStatus.ACCEPTED, RideStatus.STARTED))).thenReturn(2L);
        when(rideRepository.countByStatus(RideStatus.REQUESTED)).thenReturn(1L);
        when(employeeRepository.count()).thenReturn(5L);
        when(userRepository.countByRole(Role.USER)).thenReturn(2L);
        when(userRepository.countByRole(Role.DRIVER)).thenReturn(3L);
        when(adminRepository.count()).thenReturn(1L);
        when(cabRepository.count()).thenReturn(4L);
        when(cabRepository.countByAvailableTrue()).thenReturn(2L);
        when(cabRepository.countByOnlineTrue()).thenReturn(3L);

        AdminDashboardResponse response = controller.dashboard();

        assertEquals(10L, response.totalBookings());
        assertEquals(7L, response.totalEmployees());
        assertEquals(3L, response.totalDrivers());
        assertEquals(1L, response.totalAdmins());
        assertEquals(2L, response.tripsInProgress());
        assertEquals(7, response.bookingTrend().size());
        assertEquals(3L, response.bookingTrend().get(6).count());
        assertEquals("Employee Name", response.recentBookings().get(0).employeeName());
        assertEquals("Driver Name", response.recentBookings().get(0).driverName());
        assertEquals("CAB-42", response.recentBookings().get(0).vehicleRegistration());
    }

    @Test
    void deletingEmployeeRemovesBillingAndRideHistoryBeforeEmployee() {
        UserRepository userRepository = mock(UserRepository.class);
        CabRepository cabRepository = mock(CabRepository.class);
        RideRepository rideRepository = mock(RideRepository.class);
        EmployeeRepository employeeRepository = mock(EmployeeRepository.class);
        AdminRepository adminRepository = mock(AdminRepository.class);
        BillingRepository billingRepository = mock(BillingRepository.class);
        AdminController controller = new AdminController(
                userRepository, cabRepository, rideRepository, employeeRepository, adminRepository, billingRepository
        );
        Employee employee = Employee.builder().id(10L).name("Test employee").build();
        Ride ride = Ride.builder().id(20L).build();
        Billing billing = Billing.builder().id(30L).build();

        when(employeeRepository.findById(10L)).thenReturn(Optional.of(employee));
        when(rideRepository.findByEmployee(employee)).thenReturn(List.of(ride));
        when(billingRepository.findByRideIn(List.of(ride))).thenReturn(List.of(billing));

        controller.deleteEmployee(10L);

        verify(billingRepository).deleteAll(List.of(billing));
        verify(rideRepository).deleteAll(List.of(ride));
        verify(employeeRepository).delete(employee);
    }

    @Test
    void deletingDriverRemovesBillingRidesVehiclesAndDriver() {
        UserRepository userRepository = mock(UserRepository.class);
        CabRepository cabRepository = mock(CabRepository.class);
        RideRepository rideRepository = mock(RideRepository.class);
        EmployeeRepository employeeRepository = mock(EmployeeRepository.class);
        AdminRepository adminRepository = mock(AdminRepository.class);
        BillingRepository billingRepository = mock(BillingRepository.class);
        AdminController controller = new AdminController(
                userRepository, cabRepository, rideRepository, employeeRepository, adminRepository, billingRepository
        );
        User driver = User.builder().id(10L).role(Role.DRIVER).build();
        Cab cab = Cab.builder().id(20L).driver(driver).build();
        Ride ride = Ride.builder().id(30L).cab(cab).build();
        Billing billing = Billing.builder().id(40L).build();

        when(userRepository.findById(10L)).thenReturn(Optional.of(driver));
        when(cabRepository.findByDriver(driver)).thenReturn(List.of(cab));
        when(rideRepository.findByCabIn(List.of(cab))).thenReturn(List.of(ride));
        when(billingRepository.findByRideIn(List.of(ride))).thenReturn(List.of(billing));

        controller.deleteDriver(10L);

        verify(billingRepository).deleteAll(List.of(billing));
        verify(rideRepository).deleteAll(List.of(ride));
        verify(cabRepository).deleteAll(List.of(cab));
        verify(userRepository).delete(driver);
    }
}
