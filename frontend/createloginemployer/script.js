
const form = document.getElementById("registerForm");

form.addEventListener("submit", async function(event) {

    event.preventDefault();

    const button = document.getElementById("submitBtn");
    const message = document.getElementById("message");

    const employeeData = {
        eid: document.getElementById("eid").value.trim(),
        name: document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim(),
        address: document.getElementById("address").value.trim(),
        password: document.getElementById("password").value
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
            message.textContent = result.message;

        }

    } catch (error) {

        console.error(error);

        message.style.color = "red";
        message.textContent = "Unable to connect to the server.";

    } finally {

        button.disabled = false;
        button.textContent = "Register Employee";

    }

});
