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

If startup previously failed during a Flyway migration and Flyway reports a failed migration, repair its schema history before restarting. In PowerShell, from this project directory:

```powershell
.\mvnw.cmd org.flywaydb:flyway-maven-plugin:11.7.2:repair `
  "-Dflyway.url=jdbc:postgresql://localhost:5432/cabbooking" `
  "-Dflyway.user=postgres" `
  "-Dflyway.password=$env:DB_PASSWORD"
.\mvnw.cmd spring-boot:run
```

If you configured a different database URL or username, use those values in the repair command as well.

Legacy administrator accounts stored in the `users` table are copied to `admins` by Flyway migration V6 when the backend starts. An enabled legacy administrator can also be migrated on successful login if the corresponding `admins` row is missing.
