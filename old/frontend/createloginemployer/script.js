
document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("registerForm");

    if (!form) {
        console.error("Registration form not found!");
        return;
    }

    const button = form.querySelector(".register-btn");
    const message = document.getElementById("message");

    // Password show/hide
    window.togglePassword = function (id, element) {

        const password = document.getElementById(id);

        if (!password) return;

        if (password.type === "password") {
            password.type = "text";
            element.textContent = "HIDE";
        } else {
            password.type = "password";
            element.textContent = "SHOW";
        }
    };

    // Registration form submission
    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        const employeeId = document.getElementById("employerId");
        const employerName = document.getElementById("employerName");
        const email = document.getElementById("email");
        const address = document.getElementById("address");
        const password = document.getElementById("password");
        const confirmPassword = document.getElementById("confirmPassword");

        if (
            !employeeId || !employerName || !email ||
            !address || !password || !confirmPassword
        ) {
            message.textContent = "Some form fields are missing!";
            message.style.color = "red";
            return;
        }

        if (password.value !== confirmPassword.value) {
            message.style.color = "red";
            message.textContent = "Passwords do not match!";
            return;
        }

        const employeeData = {
            eid: employeeId.value.trim(),
            name: employerName.value.trim(),
            email: email.value.trim(),
            address: address.value.trim(),
            password: password.value
        };

        try {

            button.disabled = true;
            button.textContent = "Saving...";

            message.style.color = "blue";
            message.textContent = "Please wait...";

            const response = await fetch(
                "http://localhost:5000/api/register",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(employeeData)
                }
            );

            // Safely read server response
            const text = await response.text();

            let result;

            try {
                result = text ? JSON.parse(text) : {};
            } catch {
                throw new Error(
                    "Server returned an invalid response. Check backend API."
                );
            }

            if (!response.ok) {
                throw new Error(
                    result.message || `Server error: ${response.status}`
                );
            }

            if (result.success) {

                message.style.color = "green";
                message.textContent =
                    result.message || "Registration successful!";

                form.reset();

                document.querySelectorAll(".toggle-password")
                    .forEach(el => el.textContent = "SHOW");

            } else {

                message.style.color = "red";
                message.textContent =
                    result.message || "Registration failed!";

            }

        } catch (error) {

            console.error("Registration error:", error);

            message.style.color = "red";
            message.textContent = error.message;

        } finally {

            button.disabled = false;
            button.textContent = "CREATE ACCOUNT";

        }

    });

});
