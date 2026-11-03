const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");
const year = document.getElementById("year");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const dutyFilter = document.getElementById("dutyFilter");
const bookingTableBody = document.getElementById("bookingTableBody");
const emptyState = document.getElementById("emptyState");
const emptyTitle = document.getElementById("emptyTitle");
const emptyDescription = document.getElementById("emptyDescription");
const resultsInfo = document.getElementById("resultsInfo");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");

const bookings = [];

if (year) {
    year.textContent = String(new Date().getFullYear());
}

if (menuBtn && navLinks) {
    menuBtn.addEventListener("click", () => {
        const isOpen = navLinks.classList.toggle("open");
        menuBtn.setAttribute("aria-expanded", String(isOpen));
        menuBtn.setAttribute(
            "aria-label",
            isOpen ? "Close navigation" : "Open navigation"
        );
    });

    navLinks.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
            navLinks.classList.remove("open");
            menuBtn.setAttribute("aria-expanded", "false");
            menuBtn.setAttribute("aria-label", "Open navigation");
        });
    });
}

function renderBookings() {
    if (
        !searchInput ||
        !statusFilter ||
        !dutyFilter ||
        !bookingTableBody ||
        !emptyState ||
        !emptyTitle ||
        !emptyDescription ||
        !resultsInfo
    ) {
        return;
    }

    const query = searchInput.value.trim().toLowerCase();
    const status = statusFilter.value;
    const duty = dutyFilter.value;
    const filteredBookings = bookings.filter((booking) => {
        const searchableText = `${booking.id} ${booking.origin} ${booking.destination}`.toLowerCase();
        return (
            (!query || searchableText.includes(query)) &&
            (status === "All" || booking.status === status) &&
            (duty === "All" || booking.dutyType === duty)
        );
    });

    document.getElementById("totalCount").textContent = String(bookings.length);
    document.getElementById("plannedCount").textContent = String(
        bookings.filter((booking) => booking.status === "Planned").length
    );
    document.getElementById("completedCount").textContent = String(
        bookings.filter((booking) => booking.status === "Completed").length
    );
    document.getElementById("cancelledCount").textContent = String(
        bookings.filter((booking) => booking.status === "Cancelled").length
    );

    bookingTableBody.replaceChildren();
    filteredBookings.forEach((booking) => {
        const row = document.createElement("tr");
        const statusClass = booking.status.toLowerCase();
        row.innerHTML = `
            <td><span class="trip-id"></span></td>
            <td><div class="trip-route"><strong></strong><small></small></div></td>
            <td></td>
            <td></td>
            <td><span class="status-badge"></span></td>
        `;
        row.children[0].querySelector(".trip-id").textContent = booking.id;
        row.children[1].querySelector("strong").textContent = booking.origin;
        row.children[1].querySelector("small").textContent = `to ${booking.destination}`;
        row.children[2].textContent = booking.dutyType;
        row.children[3].textContent = booking.dateTime;
        const statusBadge = row.children[4].querySelector(".status-badge");
        statusBadge.textContent = booking.status;
        statusBadge.classList.add(statusClass);
        bookingTableBody.append(row);
    });

    const hasBookings = filteredBookings.length > 0;
    emptyState.hidden = hasBookings;
    bookingTableBody.closest(".table-wrapper").hidden = !hasBookings;

    if (hasBookings) {
        resultsInfo.textContent = `Showing ${filteredBookings.length} of ${bookings.length} trips`;
    } else if (bookings.length) {
        emptyTitle.textContent = "No trips match your filters";
        emptyDescription.textContent = "Try another search or clear the filters to see all your trips.";
        resultsInfo.textContent = "Showing 0 trips";
    } else {
        emptyTitle.textContent = "No trips yet";
        emptyDescription.textContent = "Your company rides will appear here once they’re available.";
        resultsInfo.textContent = "Showing 0 trips";
    }
}

if (searchInput && statusFilter && dutyFilter) {
    searchInput.addEventListener("input", renderBookings);
    statusFilter.addEventListener("change", renderBookings);
    dutyFilter.addEventListener("change", renderBookings);
}

if (clearFiltersBtn && searchInput && statusFilter && dutyFilter) {
    clearFiltersBtn.addEventListener("click", () => {
        searchInput.value = "";
        statusFilter.value = "All";
        dutyFilter.value = "All";
        renderBookings();
        searchInput.focus();
    });
}

renderBookings();
