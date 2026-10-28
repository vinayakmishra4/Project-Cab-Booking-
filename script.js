/* CABGO interactive behavior */
document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.getElementById("menuBtn");
  const navLinks = document.getElementById("navLinks");
  const roleSelect = document.getElementById("role");
  const loginForm = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const loginBtn = document.getElementById("loginBtn");
  const message = document.getElementById("message");
  const forgotPassword = document.getElementById("forgotPassword");

  const roles = {
    employer: {
      name: "Employer",
      heading: "Employer Login",
      welcome: 'Manage Your <span>Rides</span>',
      welcomeDescription: "Sign in to manage your company's transportation and bookings with CABGO.",
      description: "Enter your employer account details to continue."
    },
    driver: {
      name: "Driver",
      heading: "Driver Login",
      welcome: 'Drive with <span>CABGO</span>',
      welcomeDescription: "Access your driver account and manage your trips with CABGO.",
      description: "Enter your driver account details to continue."
    },
    admin: {
      name: "Admin",
      heading: "Admin Login",
      welcome: 'Manage the <span>Platform</span>',
      welcomeDescription: "Manage platform accounts and oversee CABGO operations.",
      description: "Enter your administrator account details to continue."
    }
  };

  function clearMessage() {
    message.textContent = "";
    message.className = "message";
  }

  function showMessage(text, type) {
    message.textContent = text;
    message.className = "message " + type;
  }

  function chooseRole(role, scrollToLogin = false) {
    const selected = roles[role];
    if (!selected) return;

    roleSelect.value = role;
    document.getElementById("loginHeading").textContent = selected.heading;
    document.getElementById("welcomeHeading").innerHTML = selected.welcome;
    document.getElementById("welcomeDescription").textContent = selected.welcomeDescription;
    document.getElementById("formDescription").textContent = selected.description;
    loginBtn.textContent = "Sign In as " + selected.name;

    document.querySelectorAll("[data-role]").forEach((element) => {
      const active = element.dataset.role === role;
      if (element.classList.contains("service-card")) {
        element.classList.toggle("active", active);
      }
      if (element.hasAttribute("aria-pressed")) {
        element.setAttribute("aria-pressed", String(active));
      }
    });

    clearMessage();

    if (scrollToLogin) {
      document.getElementById("login").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  // Role cards and footer account links
  document.querySelectorAll("[data-role]").forEach((element) => {
    element.addEventListener("click", (event) => {
      const role = element.dataset.role;
      if (!roles[role]) return;
      if (element.tagName === "A") event.preventDefault();
      chooseRole(role, true);
    });
  });

  roleSelect.addEventListener("change", () => chooseRole(roleSelect.value));

  // Mobile navigation
  if (menuBtn && navLinks) {
    menuBtn.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("active");
      menuBtn.setAttribute("aria-expanded", String(isOpen));
      menuBtn.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
      menuBtn.textContent = isOpen ? "✕" : "☰";
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("active");
        menuBtn.setAttribute("aria-expanded", "false");
        menuBtn.setAttribute("aria-label", "Open navigation");
        menuBtn.textContent = "☰";
      });
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 600) {
        navLinks.classList.remove("active");
        menuBtn.setAttribute("aria-expanded", "false");
        menuBtn.textContent = "☰";
      }
    });
  }

  // Footer year
  document.getElementById("year").textContent = new Date().getFullYear();

  // Frontend-only form validation. This does not authenticate accounts.
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    clearMessage();

    if (!loginForm.reportValidity()) return;

    const role = roles[roleSelect.value];
    if (!role) {
      showMessage("Please choose a valid account type.", "error");
      return;
    }

    showMessage(
      "Form validated for " + role.name + ". This demo is not connected to a login server yet.",
      "success"
    );
  });

  forgotPassword.addEventListener("click", () => {
    clearMessage();
    const email = emailInput.value.trim();

    if (!email) {
      showMessage("Enter your email address first. Password reset needs to be connected to a backend.", "info");
      emailInput.focus();
      return;
    }

    if (!emailInput.checkValidity()) {
      showMessage("Please enter a valid email address.", "error");
      emailInput.focus();
      return;
    }

    showMessage("Password reset is not configured yet. Connect a secure password-reset service to enable this feature.", "info");
  });

  // Default selection
  chooseRole("employer");
});
