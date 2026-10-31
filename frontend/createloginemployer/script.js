
document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("registerForm");

    if (!form) {
        console.error("registerForm not found!");
        return;
    }

    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        const button = document.getElementById("submitBtn");
        const message = document.getElementById("message");

        const eid = document.getElementById("eid");
        const name = document.getElementById("name");
        const email = document.getElementById("email");
        const address = document.getElementById("address");
        const password = document.getElementById("password");

        if (!button || !message || !eid || !name ||
            !email || !address || !password) {
            console.error("One or more HTML elements are missing.");
            return;
        }

        const employeeData = {
            eid: eid.value.trim(),
            name: name.value.trim(),
            email: email.value.trim(),
            address: address.value.trim(),
            password: password.value
        };

        try {

            button.disabled = true;
            button.textContent = "Saving...";
            message.textContent = "Please wait...";

            const response = await fetch("/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(employeeData)
            });

            const result = await response.json();

            if (response.ok && result.success) {

                message.style.color = "green";
                message.textContent = result.message;

                form.reset();

            } else {

                message.style.color = "red";
                message.textContent =
                    result.message || "Registration failed.";

            }

        } catch (error) {

            console.error("Registration error:", error);

            message.style.color = "red";
            message.textContent =
                "Unable to connect to the server.";

        } finally {

            button.disabled = false;
            button.textContent = "Register Employee";

        }

    });

});
