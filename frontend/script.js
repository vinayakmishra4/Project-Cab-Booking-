// =========================
// MOBILE NAVIGATION
// =========================

const menuBtn = document.getElementById(“menuBtn”);
const navLinks = document.getElementById(“navLinks”);

menuBtn.addEventListener(“click”, function () {
const isOpen = navLinks.classList.toggle(“active”);

menuBtn.setAttribute("aria-expanded", isOpen);
menuBtn.textContent = isOpen ? "✕" : "☰";

});

// Close the mobile menu when a navigation link is clicked.

document.querySelectorAll(”.nav-links a”).forEach(function (link) {
link.addEventListener(“click”, function () {
navLinks.classList.remove(“active”);

    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.textContent = "☰";
});

});

// =========================
// FOOTER COPYRIGHT YEAR
// =========================

document.getElementById(“year”).textContent =
new Date().getFullYear();

// =========================
// LOGIN FORM
// =========================

const loginForm = document.getElementById(“loginForm”);
const roleInput = document.getElementById(“role”);
const emailInput = document.getElementById(“email”);
const passwordInput = document.getElementById(“password”);
const message = document.getElementById(“message”);
const loginBtn = loginForm.querySelector(”.login-btn”);

// Display a message to the user.

function showMessage(text, type) {
message.textContent = text;
message.className = “message “ + type;
}

// Handle login form submission.

loginForm.addEventListener(“submit”, function (event) {
event.preventDefault();

const role = roleInput.value;
const email = emailInput.value.trim();
const password = passwordInput.value;
// Validate the selected role.
if (!role) {
    showMessage("Please select your account role.", "error");
    roleInput.focus();
    return;
}
// Validate email.
if (!emailInput.checkValidity() || !email) {
    showMessage("Please enter a valid email address.", "error");
    emailInput.focus();
    return;
}
// Validate password.
if (!password.trim()) {
    showMessage("Please enter your password.", "error");
    passwordInput.focus();
    return;
}
// Front-end demonstration only.
// No credentials are verified or sent to a server.
const roleNames = {
    employer: "Employer",
    driver: "Driver",
    admin: "Admin"
};
showMessage(
    `${roleNames[role]} login form validated. ` +
    "Connect a secure backend to authenticate your account.",
    "success"
);

});

// =========================
// CLEAR MESSAGES ON EDIT
// =========================

[roleInput, emailInput, passwordInput].forEach(function (input) {
input.addEventListener(“input”, function () {
message.textContent = “”;
message.className = “message”;
});

input.addEventListener("change", function () {
    message.textContent = "";
    message.className = "message";
});

});

// =========================
// ROLE SELECTION FROM FOOTER
// =========================

document.querySelectorAll(”[data-role]”).forEach(function (link) {
link.addEventListener(“click”, function () {
roleInput.value = link.dataset.role;

    message.textContent = "";
    message.className = "message";
});

});

// =========================
// FORGOT PASSWORD
// =========================

document.getElementById(“forgotPassword”).addEventListener(
“click”,
function (event) {
event.preventDefault();

    showMessage(
        "Password recovery must be configured through your " +
        "authentication backend.",
        "error"
    );
}

);