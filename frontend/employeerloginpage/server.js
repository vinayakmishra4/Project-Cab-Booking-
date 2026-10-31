
require("dotenv").config();

const express = require("express");
const sql = require("mssql");
const bcrypt = require("bcrypt");

const app = express();

app.use(express.json());
app.use(express.static("public"));

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    port: 1433,
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

let pool;

async function startServer() {
    try {
        pool = await sql.connect(config);

        console.log("Connected to Azure SQL!");

        app.get("/api/health", async (req, res) => {
            try {
                await pool.request().query("SELECT 1");
                res.json({
                    message: "Azure SQL connection successful"
                });
            } catch (err) {
                res.status(500).json({
                    message: "Database check failed"
                });
            }
        });

        app.post("/api/login", async (req, res) => {
            try {
                const { employeeId, password } = req.body;

                if (!employeeId || !password) {
                    return res.status(400).json({
                        message: "Enter Employee ID and Password"
                    });
                }

                const result = await pool.request()
                    .input("employeeId", sql.VarChar(50), employeeId)
                    .query(`
                        SELECT EmployeeID, EmployeeName,
                               PasswordHash, Department
                        FROM dbo.Employees
                        WHERE EmployeeID = @employeeId
                    `);

                if (result.recordset.length === 0) {
                    return res.status(401).json({
                        message: "Employee ID not found"
                    });
                }

                const employee = result.recordset[0];

                const valid = await bcrypt.compare(
                    password,
                    employee.PasswordHash
                );

                if (!valid) {
                    return res.status(401).json({
                        message: "Invalid password"
                    });
                }

                res.json({
                    message: "Login successful",
                    employeeName: employee.EmployeeName,
                    employeeId: employee.EmployeeID,
                    department: employee.Department
                });

            } catch (error) {
                console.error(error);
                res.status(500).json({
                    message: "Login failed"
                });
            }
        });

        app.listen(process.env.PORT || 3000, () => {
            console.log("Server running on port 3000");
        });

    } catch (error) {
        console.error("Azure SQL connection failed:", error.message);
    }
}

startServer();
