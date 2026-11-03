
// ============================================
// CAB BOOKING APPLICATION - SERVER
// ============================================

// Load environment variables from project directory
require("dotenv").config({
    path: require("path").join(__dirname, ".env")
});

const express = require("express");
const sql = require("mssql");
const bcrypt = require("bcrypt");
const path = require("path");

// ============================================
// 1. ENVIRONMENT VARIABLE VALIDATION
// ============================================

const requiredEnv = [
    "DB_SERVER",
    "DB_DATABASE",
    "DB_USER",
    "DB_PASSWORD"
];

const missingEnv = requiredEnv.filter(
    key => !process.env[key] || !process.env[key].trim()
);

if (missingEnv.length > 0) {
    console.error(
        "Missing environment variables:",
        missingEnv.join(", ")
    );
    console.error("Please check your .env file.");
    process.exit(1);
}

console.log("DB server loaded:", !!process.env.DB_SERVER);
console.log("DB database loaded:", !!process.env.DB_DATABASE);
console.log("DB username loaded:", !!process.env.DB_USER);

// ============================================
// 2. EXPRESS CONFIGURATION
// ============================================

const app = express();

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// ============================================
// 3. AZURE SQL DATABASE CONFIGURATION
// ============================================

const config = {
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT || 1433),

    options: {
        encrypt: true,
        trustServerCertificate: false
    },

    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },

    connectionTimeout: 30000,
    requestTimeout: 30000
};

let pool;

// ============================================
// 4. DATABASE CONNECTION FUNCTION
// ============================================

async function connectDB() {
    try {
        pool = await new sql.ConnectionPool(config).connect();

        console.log("================================");
        console.log("Azure SQL Connected Successfully!");
        console.log("Database:", config.database);
        console.log("================================");

        return pool;

    } catch (error) {
        console.error("Azure SQL Connection Error:");
        console.error(error.message);
        throw error;
    }
}

// ============================================
// 5. HEALTH CHECK API
// ============================================

app.get("/api/health", async (req, res) => {
    try {
        if (!pool || !pool.connected) {
            return res.status(503).json({
                success: false,
                message: "Database is not connected."
            });
        }

        await pool.request().query("SELECT 1 AS result");

        res.status(200).json({
            success: true,
            message: "Azure SQL connected successfully!"
        });

    } catch (error) {
        console.error("Health Check Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Database connection failed."
        });
    }
});

// ============================================
// 6. EMPLOYEE REGISTRATION API
// ============================================

app.post("/api/register", async (req, res) => {

    try {
        const {
            eid,
            name,
            email,
            address,
            password
        } = req.body || {};

        // Validate required fields
        if (
            !eid ||
            !name ||
            !email ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Please fill all required fields."
            });
        }

        // Validate input types
        if (
            typeof eid !== "string" ||
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            (
                address !== undefined &&
                address !== null &&
                typeof address !== "string"
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid input data."
            });
        }

        // Clean input values
        const employeeId = eid.trim();
        const employeeName = name.trim();
        const employeeEmail = email.trim().toLowerCase();
        const employeeAddress = address ? address.trim() : null;

        // Validate empty values
        if (
            !employeeId ||
            !employeeName ||
            !employeeEmail
        ) {
            return res.status(400).json({
                success: false,
                message: "Employee ID, name and email cannot be empty."
            });
        }

        // Validate field lengths
        if (
            employeeId.length > 50 ||
            employeeName.length > 100 ||
            employeeEmail.length > 255 ||
            (employeeAddress && employeeAddress.length > 255)
        ) {
            return res.status(400).json({
                success: false,
                message: "One or more fields exceed the allowed length."
            });
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(employeeEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address."
            });
        }

        // Password validation
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 8 characters."
            });
        }

        // Check database connection
        if (!pool || !pool.connected) {
            return res.status(503).json({
                success: false,
                message: "Database is currently unavailable."
            });
        }

        // Check duplicate Employee ID
        const existing = await pool.request()
            .input("eid", sql.NVarChar(50), employeeId)
            .query(`
                SELECT eid
                FROM dbo.Employee
                WHERE eid = @eid
            `);

        if (existing.recordset.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Employee ID already exists."
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Insert employee into Azure SQL
        await pool.request()
            .input("eid", sql.NVarChar(50), employeeId)
            .input("name", sql.NVarChar(100), employeeName)
            .input("email", sql.NVarChar(255), employeeEmail)
            .input("address", sql.NVarChar(255), employeeAddress)
            .input("password", sql.VarChar(255), hashedPassword)
            .query(`
                INSERT INTO dbo.Employee
                (
                    eid,
                    name,
                    email,
                    address,
                    password
                )
                VALUES
                (
                    @eid,
                    @name,
                    @email,
                    @address,
                    @password
                )
            `);

        console.log("Employee registered:", employeeId);

        return res.status(201).json({
            success: true,
            message: "Employee registered successfully!"
        });

    } catch (error) {

        console.error("Registration Error:", error.message);

        // Handle duplicate database keys
        if (
            error.number === 2627 ||
            error.number === 2601
        ) {
            return res.status(409).json({
                success: false,
                message: "Employee ID or another unique value already exists."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to save employee details."
        });
    }
});

// ============================================
// 7. 404 HANDLER
// ============================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API endpoint not found."
    });
});

// ============================================
// 8. START SERVER
// ============================================

async function startServer() {

    try {
        await connectDB();

        const PORT = Number(process.env.PORT || 3000);

        const server = app.listen(PORT, () => {
            console.log("--------------------------------");
            console.log("CAB BOOKING SERVER STARTED");
            console.log(`Server: http://localhost:${PORT}`);
            console.log(`Health: http://localhost:${PORT}/api/health`);
            console.log("--------------------------------");
        });

        // Graceful shutdown
        process.on("SIGINT", async () => {
            console.log("\nShutting down server...");

            server.close(async () => {
                if (pool) {
                    await pool.close();
                }

                console.log("Server stopped successfully.");
                process.exit(0);
            });
        });

        process.on("SIGTERM", async () => {
            server.close(async () => {
                if (pool) {
                    await pool.close();
                }

                process.exit(0);
            });
        });

    } catch (error) {
        console.error("Unable to start Cab Booking server.");
        process.exit(1);
    }
}

// Run application
startServer();
