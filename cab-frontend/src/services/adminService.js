import api from "./api";

export const statusLabels = {
    REQUESTED: "Pending",
    ACCEPTED: "Accepted",
    STARTED: "In progress",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled"
};

export function normalizeRide(ride) {
    const employee = ride.employee || ride.user || {};
    const driver = ride.cab?.driver || {};
    return {
        ...ride,
        employeeName: employee.name || "",
        employeeId: employee.employeeId || "",
        employeeEmail: employee.email || "",
        driverName: driver.name || "",
        driverId: driver.driverId || "",
        vehicleModel: ride.cab?.model || "",
        vehicleRegistration: ride.cab?.carNumber || "",
        billing: ride.billing || null
    };
}

export async function fetchRides() {
    const response = await api.get("/api/admin/all-rides");
    if (!Array.isArray(response.data)) throw new Error("Unexpected bookings response");
    return response.data.map(normalizeRide).sort((first, second) => {
        const firstDate = new Date(first.createdAt || 0).getTime();
        const secondDate = new Date(second.createdAt || 0).getTime();
        return (Number.isNaN(secondDate) ? 0 : secondDate) - (Number.isNaN(firstDate) ? 0 : firstDate);
    });
}

export async function fetchAccounts() {
    const [employeesResponse, usersResponse, adminsResponse] = await Promise.all([
        api.get("/api/admin/all-employees"),
        api.get("/api/admin/all-users"),
        api.get("/api/admin/all-admins")
    ]);

    if (!Array.isArray(usersResponse.data) || !Array.isArray(employeesResponse.data) || !Array.isArray(adminsResponse.data)) {
        throw new Error("Unexpected accounts response");
    }
    const users = usersResponse.data;
    const employees = employeesResponse.data;
    const admins = adminsResponse.data;
    const uniqueByEmail = (items) => {
        const seen = new Set();
        return items.filter((item) => {
            const key = String(item.email || item.id || "");
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    };

    return {
        employees: uniqueByEmail([
            ...employees.map((employee) => ({ ...employee, accountType: "employee", source: "employee" })),
            ...users.filter((user) => user.role === "USER").map((user) => ({ ...user, accountType: "employee", source: "legacy" }))
        ]),
        drivers: uniqueByEmail(users.filter((user) => user.role === "DRIVER").map((user) => ({ ...user, source: "user" }))),
        admins: uniqueByEmail([
            ...admins,
            ...users.filter((user) => user.role === "ADMIN")
        ])
    };
}

export function formatCurrency(value) {
    if (value == null || !Number.isFinite(Number(value))) return "—";
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(Number(value));
}

export function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? "—"
        : date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
}

export function downloadCsv(filename, columns, rows) {
    const csv = [columns, ...rows]
        .map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(","))
        .join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}
