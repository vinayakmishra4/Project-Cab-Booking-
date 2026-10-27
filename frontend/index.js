
document.addEventListener("DOMContentLoaded", () => {
    const bookingForm = document.getElementById("bookingForm");
    const dutyOptions = document.querySelectorAll(
        'input[name="dutyType"]'
    );

    const dutyAddressGroup =
        document.getElementById("dutyAddressGroup");

    const dutyAddress =
        document.getElementById("dutyAddress");

    const vehicleSelect =
        document.getElementById("vehicle");

    const tripDate =
        document.getElementById("tripDate");

    const formMessage =
        document.getElementById("formMessage");

    // Configure the date field to prevent past-date bookings.
    const today = new Date();
    const localToday = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-");

    tripDate.min = localToday;

    // Keep the application restricted to cars.
    vehicleSelect.innerHTML = "";

    const carOption = document.createElement("option");
    carOption.value = "Car";
    carOption.textContent = "Car";
    carOption.selected = true;

    vehicleSelect.appendChild(carOption);

    // Show the destination field only for On Duty trips.
    function updateDutyFields() {
        const selectedDuty = document.querySelector(
            'input[name="dutyType"]:checked'
        );

        const isOnDuty =
            selectedDuty && selectedDuty.value === "On Duty";

        dutyAddressGroup.hidden = !isOnDuty;
        dutyAddress.required = Boolean(isOnDuty);

        if (!isOnDuty) {
            dutyAddress.value = "";
        }
    }

    dutyOptions.forEach(option => {
        option.addEventListener("change", updateDutyFields);
    });

    updateDutyFields();

    // Display feedback to the employee.
    function showMessage(message, type) {
        formMessage.textContent = message;
        formMessage.className = "form-message " + type;
    }

    // Validate the employee's phone number.
    function isValidPhone(phone) {
        return /^[0-9]{10}$/.test(phone);
    }

    // Collect booking details.
    function getBookingData() {
        const dutyType = document.querySelector(
            'input[name="dutyType"]:checked'
        ).value;

        return {
            employeeId: document.getElementById("employeeId")
                .value.trim(),

            employeeName: document.getElementById("employeeName")
                .value.trim(),

            email: document.getElementById("email")
                .value.trim(),

            phone: document.getElementById("phone")
                .value.trim(),

            dutyType: dutyType,

            vehicleCategory: "Car",

            tripDate: tripDate.value,

            pickupTime: document.getElementById("pickupTime")
                .value,

            passengers: Number(
                document.getElementById("passengers").value
            ),

            officeAddress: document.getElementById("officeAddress")
                .value.trim(),

            pickupAddress: document.getElementById("pickupAddress")
                .value.trim(),

            dutyAddress: dutyType === "On Duty"
                ? dutyAddress.value.trim()
                : null,

            notes: document.getElementById("notes")
                .value.trim()
        };
    }

    // Submit the booking form.
    bookingForm.addEventListener("submit", async event => {
        event.preventDefault();

        if (!bookingForm.checkValidity()) {
            bookingForm.reportValidity();
            return;
        }

        const bookingData = getBookingData();

        if (!isValidPhone(bookingData.phone)) {
            showMessage(
                "Please enter a valid 10-digit phone number.",
                "error"
            );
            return;
        }

        if (
            bookingData.dutyType === "On Duty" &&
            !bookingData.dutyAddress
        ) {
            showMessage(
                "Please enter the on-duty destination address.",
                "error"
            );
            return;
        }

        if (bookingData.tripDate < localToday) {
            showMessage(
                "Please select today or a future travel date.",
                "error"
            );
            return;
        }

        // Keep the category restricted to Car.
        if (bookingData.vehicleCategory !== "Car") {
            showMessage(
                "Only car bookings are supported.",
                "error"
            );
            return;
        }

        /*
         * FRONTEND DEMO MODE
         *
         * The booking is not saved to a server yet.
         * Replace this section with the Spring Boot API call
         * when your backend endpoint is ready.
         */

        console.log("Car booking data:", bookingData);

        showMessage(
            "Form validated successfully. Connect the Spring Boot API to save your booking.",
            "success"
        );
    });

    // Clear validation feedback when the employee edits the form.
    bookingForm.addEventListener("input", () => {
        if (
            formMessage.classList.contains("error") ||
            formMessage.classList.contains("success")
        ) {
            formMessage.textContent = "";
            formMessage.className = "form-message";
        }
    });
});
