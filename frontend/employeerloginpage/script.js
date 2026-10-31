
const loginForm = document.getElementById("loginForm");
const employeeEmail = document.getElementById("employeeEmail");
const password = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");
const message = document.getElementById("message");
const loginButton = document.getElementById("loginButton");
const forgotPassword = document.getElementById("forgotPassword");

// Show or hide the password
togglePassword.addEventListener("click", () => {
    const isPassword = password.type === "password";

    password.type = isPassword ? "text" : "password";
    togglePassword.textContent = isPassword ? "Hide" : "Show";
    togglePassword.setAttribute(
        "aria-label",
        isPassword ? "Hide password" : "Show password"
    );
});

// Display feedback to the employee
function showMessage(text, type) {
    message.textContent = text;
    message.className = `message ${type}`;
}

// Basic front-end form validation
loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = employeeEmail.value.trim();
    const pass = password.value;

    message.textContent = "";
    message.className = "message";

    if (!email || !pass.trim()) {
        showMessage(
            "Please enter your employee email and password.",
            "error"
        );
        return;
    }

    if (email.length > 254 || pass.length > 256) {
        showMessage("Please check your entered credentials.", "error");
        return;
    }

    // Demo only: no credentials are sent or authenticated here.
    showMessage(
        "Form validation successful. Connect the login API to verify your employee credentials.",
        "success"
    );
});

// Password recovery placeholder
forgotPassword.addEventListener("click", (event) => {
    event.preventDefault();

    showMessage(
        "Please contact your HR or IT administrator to reset your password.",
        "error"
    );
});
