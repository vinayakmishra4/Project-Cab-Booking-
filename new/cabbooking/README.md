# Cab Booking API

## PostgreSQL configuration

The application connects to a local PostgreSQL database named `cabbooking` by default. Set the database password in `DB_PASSWORD` before starting the application; the password is intentionally not stored in the repository. Optionally set `DB_USERNAME` and `DB_URL` if your local database uses different values.

In PowerShell:

```powershell
$env:DB_PASSWORD = "your-postgres-password"
.\mvnw.cmd spring-boot:run
```

In Command Prompt:

```bat
set DB_PASSWORD=your-postgres-password
mvnw.cmd spring-boot:run
```
