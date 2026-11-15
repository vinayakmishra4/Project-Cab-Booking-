import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { registerUser } from "../services/authService";
import api from "../services/api";

const initialForm = {
    employeeId: "",
    name: "",
    email: "",
    phone: "",
    licenseNumber: "",
    password: "",
    confirmPassword: ""
};

function Register() {
    const [searchParams] = useSearchParams();
    const apiUrl = api.defaults.baseURL || window.location.origin;
    const requestedRole = searchParams.get("role")?.toUpperCase();
    const role = requestedRole === "DRIVER" ? "DRIVER" : "EMPLOYEE";
    const [form, setForm] = useState(initialForm);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [registered, setRegistered] = useState(null);

    const updateField = (event) => {
        setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
        setError("");
    };

    const handleRegister = async (event) => {
        event.preventDefault();
        setError("");

        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            const response = await registerUser({
                role,
                employeeId: role === "EMPLOYEE" ? form.employeeId.trim() : null,
                name: form.name.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                licenseNumber: role === "DRIVER" ? form.licenseNumber.trim() : null,
                password: form.password,
                confirmPassword: form.confirmPassword
            });
            setRegistered(response.data);
        } catch (requestError) {
            const serverMessage = requestError.response?.data?.message || requestError.response?.data;
            const message = typeof serverMessage === "string" ? serverMessage : "";
            const status = requestError.response?.status;

            if (status === 409) {
                setError(message || "An account already exists with one of these details.");
            } else if (status === 400) {
                setError(message || "Please check the information and try again.");
            } else if (!requestError.response) {
                setError(`Could not reach the GoCab API at ${apiUrl} from ${window.location.origin}. Check that the backend is running on the frontend server.`);
            } else {
                setError(message || `Registration failed (HTTP ${status}).`);
            }
        } finally {
            setLoading(false);
        }
    };

    const driver = role === "DRIVER";

    return (
        <main className={`register-page ${driver ? "driver-register" : "employee-register"}`}>
            <section className="register-story">
                <Link to="/" className="brand-lockup" aria-label="GoCab home">
                    <span className="brand-mark">M</span>
                    <span className="brand-copy">
                        <span className="brand-word">Go<span>Cab</span></span>
                    </span>
                </Link>
                <div className="register-story-copy">
                    {driver && <p className="eyebrow">DRIVER PARTNER PORTAL</p>}
                    <h1>{driver ? <>The road ahead<br/>starts <span>with you.</span></> : <>Your workday<br/>starts <span>with a ride.</span></>}</h1>
                    {driver && <p>Join the GoCab driver team and make every trip count.</p>}
                </div>
                <div className="register-story-footer">
                    <span className="story-orbit" aria-hidden="true">✳</span>
                    {driver && <span>Every mile matters.</span>}
                </div>
            </section>

            <section className="register-panel">
                {registered ? (
                    <div className="register-success" role="status">
                        <div className="register-success-mark">✓</div>
                        <p className="eyebrow">YOU’RE ALL SET</p>
                        <h2>Welcome to GoCab.</h2>
                        <p>Your {registered.role === "DRIVER" ? "driver" : "employee"} account has been created successfully.</p>
                        {registered.driverId && (
                            <div className="generated-driver-id">
                                <span>YOUR DRIVER ID</span>
                                <strong>{registered.driverId}</strong>
                                <small>Keep this ID for your records.</small>
                            </div>
                        )}
                        {registered.employeeId && (
                            <div className="generated-driver-id">
                                <span>EMPLOYEE ID</span>
                                <strong>{registered.employeeId}</strong>
                            </div>
                        )}
                        <Link className="register-submit register-success-link" to="/">Continue to sign in <span aria-hidden="true">→</span></Link>
                    </div>
                ) : (
                    <form className="register-form" onSubmit={handleRegister}>
                        <p className="eyebrow register-eyebrow">CREATE YOUR ACCOUNT</p>
                        <h2>Join GoCab</h2>
                        <p className="register-subtitle">
                            {driver
                                ? "Create your GoCab driver partner account."
                                : "Create your GoCab employee account."}
                        </p>

                        <div className="register-fields">
                            {!driver && (
                                <label>
                                    Employee ID
                                    <input
                                        className="form-control"
                                        name="employeeId"
                                        value={form.employeeId}
                                        onChange={updateField}
                                        placeholder="Enter your employee ID"
                                        autoComplete="off"
                                        required
                                    />
                                </label>
                            )}
                            <label className="register-field-wide">
                                {driver ? "Driver name" : "Full name"}
                                <input
                                    className="form-control"
                                    name="name"
                                    value={form.name}
                                    onChange={updateField}
                                    placeholder={driver ? "Enter your full name" : "Enter your full name"}
                                    autoComplete="name"
                                    required
                                />
                            </label>
                            <label className="register-field-wide">
                                {driver ? "Email address" : "Company email"}
                                <input
                                    className="form-control"
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={updateField}
                                    placeholder={driver ? "Enter your email address" : "you@company.com"}
                                    autoComplete="email"
                                    required
                                />
                            </label>
                            <label className={driver ? "" : "register-field-wide"}>
                                Phone number
                                <input
                                    className="form-control"
                                    name="phone"
                                    type="tel"
                                    value={form.phone}
                                    onChange={updateField}
                                    placeholder="+91 98765 43210"
                                    autoComplete="tel"
                                    pattern="[+0-9() .-]{7,20}"
                                    title="Enter a valid phone number"
                                    required
                                />
                            </label>
                            {driver && (
                                <label>
                                    Driving licence number
                                    <input
                                        className="form-control"
                                        name="licenseNumber"
                                        value={form.licenseNumber}
                                        onChange={updateField}
                                        placeholder="Enter DL number"
                                        autoComplete="off"
                                        required
                                    />
                                </label>
                            )}
                            <label>
                                Password
                                <input
                                    className="form-control"
                                    name="password"
                                    type="password"
                                    value={form.password}
                                    onChange={updateField}
                                    placeholder="At least 8 characters"
                                    autoComplete="new-password"
                                    minLength={8}
                                    required
                                />
                            </label>
                            <label>
                                Confirm password
                                <input
                                    className="form-control"
                                    name="confirmPassword"
                                    type="password"
                                    value={form.confirmPassword}
                                    onChange={updateField}
                                    placeholder="Re-enter password"
                                    autoComplete="new-password"
                                    minLength={8}
                                    required
                                />
                            </label>
                        </div>

                        {error && <p className="register-error" role="alert">{error}</p>}

                        <button className="btn btn-primary register-submit" type="submit" disabled={loading}>
                            {loading ? "Creating account…" : `Create ${driver ? "driver" : "employee"} account`}
                            {!loading && <span aria-hidden="true">→</span>}
                        </button>

                        <p className="register-login-link">
                            Already registered? <Link to="/">Sign in</Link>
                        </p>
                    </form>
                )}
            </section>
        </main>
    );
}

export default Register;
