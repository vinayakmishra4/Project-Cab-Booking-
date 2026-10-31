
require("dotenv").config();

const express = require("express");
const sql = require("mssql");
const bcrypt = require("bcrypt");

const app = express();

app.use(express.json());
app.use(express.static("public"));

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

    connectionTimeout: 30000,
    requestTimeout: 30000
};

let pool;

// Test Azure SQL connection
app.get("/api/health", async (req, res) => {
    try {
        await pool.request().query("SELECT 1");

        res.json({
            success: true,
            message: "Azure SQL connected successfully!"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Database connection failed"
        });
    }
});

// Employee Registration API
app.post("/api/register", async (req, res) => {

    try {
        const {
            eid,
            name,
            email,
            address,
            password
        } = req.body;

        // Validate required fields
        if (!eid || !name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please fill all required fields."
            });
        }

        if (
            typeof eid !== "string" ||
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            typeof address !== "string" && address != null
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid input data."
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 8 characters."
            });
        }

        // Check duplicate Employee ID
        const existing = await pool.request()
            .input("eid", sql.NVarChar(50), eid.trim())
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

        // Hash password before storing
        const hashedPassword = await bcrypt.hash(password, 12);

        // Insert employee details into Azure SQL
        await pool.request()
            .input("eid", sql.NVarChar(50), eid.trim())
            .input("name", sql.NVarChar(100), name.trim())
            .input("email", sql.NVarChar(255), email.trim())
            .input("address", sql.NVarChar(255), address || null)
            .input("password", sql.VarChar(255), hashedPassword)
            .query(`
                INSERT INTO dbo.Employee
                (eid, name, email, address, password)
                VALUES
                (@eid, @name, @email, @address, @password)
            `);

        res.status(201).json({
            success: true,
            message: "Employee registered successfully!"
        });

    } catch (error) {

        console.error("Registration error:", error);

        if (error.number === 2627 || error.number === 2601) {
            return res.status(409).json({
                success: false,
                message: "Employee ID already exists."
            });
        }

        res.status(500).json({
            success: false,
            message: "Unable to save employee details."
        });
    }
});

// Start application
async function startServer() {

    try {
        pool = await new sql.ConnectionPool(config).connect();

        console.log("Azure SQL Connected Successfully!");

        const PORT = process.env.PORT || 3000;

        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error("Azure SQL Connection Error:", error.message);
        process.exit(1);
    }
}

startServer();
