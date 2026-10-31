/* ========================================
   CABGO - EMPLOYER REGISTRATION
======================================== */
/* ========================================
   PASSWORD VISIBILITY
======================================== */
function togglePassword(id, element) {
    const password = document.getElementById(id);
    if (password.type === "password") {
        password.type = "text";
        element.innerText = "HIDE";
    } else {
        password.type = "password";
        element.innerText = "SHOW";
    }
}
/* ========================================
   EMPLOYER REGISTRATION FORM
======================================== */
document.getElementById("registerForm")
.addEventListener("submit", function(event) {
    event.preventDefault();
    // Get Form Values
    const employerId =
        document.getElementById("employerId").value.trim();
    const employerName =
        document.getElementById("employerName").value.trim();
    const email =
        document.getElementById("email").value.trim();
    const address =
        document.getElementById("address").value.trim();
    const password =
        document.getElementById("password").value;
    const confirmPassword =
        document.getElementById("confirmPassword").value;
    const message =
        document.getElementById("message");
    // Password Length Validation
    if (password.length < 8) {
        message.style.color = "red";
        message.innerText =
            "Password must contain at least 8 characters.";
        return;
    }
    // Confirm Password Validation
    if (password !== confirmPassword) {
        message.style.color = "red";
        message.innerText =
            "Passwords do not match!";
        return;
    }
    // Employer Object
    const employer = {
        employerId: employerId,
        employerName: employerName,
        email: email,
        address: address
    };
    // Display Details in Console
    console.log("Employer Registration Details:", employer);
    // Registration Success Message
    message.style.color = "green";
    message.innerText =
        "Employer details validated successfully!";
    // Clear Form
    document.getElementById("registerForm").reset();
});