import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/authService";
import api from "../services/api";

const portals = [
    { id: "EMPLOYEE", title: "Employee", icon: "✦", description: "Book and manage your rides" },
    { id: "DRIVER", title: "Driver", icon: "↗", description: "View and manage assigned trips" },
    { id: "ADMIN", title: "Admin", icon: "⌘", description: "Manage your fleet and operations" }
];

function Login() {

    const navigate = useNavigate();
    const location = useLocation();
    const apiUrl = api.defaults.baseURL || window.location.origin;

    const [email, setEmail] = useState(() => location.state?.email || localStorage.getItem("userEmail") || "");
    const [password, setPassword] = useState("");
    const [portal, setPortal] = useState(location.state?.portal || "EMPLOYEE");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        const expiredMsg = sessionStorage.getItem("sessionExpiredMessage");
        if (expiredMsg) {
            setError(expiredMsg);
            sessionStorage.removeItem("sessionExpiredMessage");
        }
    }, []);

    const handleLogin = async (event) => {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {

            await loginUser({
                email: email.trim(),
                password,
                portal
            });

            localStorage.setItem("portal", portal);
            localStorage.setItem("userEmail", email.trim());
            const destination = {
                EMPLOYEE: "/dashboard",
                DRIVER: "/driver/dashboard",
                ADMIN: "/admin"
            }[portal];
            const returnTo = location.state?.returnTo;
            const safeReturnTo = portal === location.state?.portal
                && typeof returnTo === "string"
                && returnTo.startsWith("/")
                && !returnTo.startsWith("//")
                ? returnTo
                : destination;
            navigate(safeReturnTo, { replace: true });

        } catch (error) {
            const serverMessage = error.response?.data?.message || error.response?.data;
            if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
                try {
                    await api.get("/api/test", { timeout: 5000 });
                    setError("The GoCab backend is reachable, but sign-in did not finish in time. Check the backend logs for an authentication or database delay, then try again.");
                } catch {
                    setError(`This device cannot reach the GoCab backend at ${apiUrl}. Open ${apiUrl}/api/test on this same device. If it does not load, check that both devices are on the same Wi-Fi and that the server address is current.`);
                }
                return;
            }
            setError(typeof serverMessage === "string"
                ? serverMessage
                : error.response?.status === 401
                    ? "The email or password is incorrect for this portal."
                    : !error.response
                        ? `Could not reach the GoCab API at ${apiUrl} from ${window.location.origin}. Check that the backend is running on the frontend server.`
                        : `Sign in failed (HTTP ${error.response.status}).`);
        } finally {
            setLoading(false);
        }

    };

    return (

        <main className="login-page">
            <section className="login-story">
                <Link to="/" className="brand-lockup" aria-label="GoCab home">
                    <span className="brand-mark">M</span>
                    <span className="brand-copy">
                        <span className="brand-word">Go<span>Cab</span></span>
                    </span>
                </Link>
                <div className="login-story-copy">
                    <h1>Every journey,<br />made <span>simpler.</span></h1>
                </div>
            </section>

            <section className="login-panel">
                <form className="login-form" onSubmit={handleLogin}>
                    <p className="eyebrow login-eyebrow">WELCOME BACK</p>
                    <h2>Sign in to GoCab</h2>
                    <p className="login-subtitle">Choose your workspace to continue.</p>
                    {location.state?.message && <p className="login-error" role="status">{location.state.message}</p>}

                    <div className="portal-selector" role="tablist" aria-label="Choose a portal">
                        {portals.map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                role="tab"
                                aria-selected={portal === option.id}
                                className={`portal-option${portal === option.id ? " selected" : ""}`}
                                onClick={() => {
                                    setPortal(option.id);
                                    setError("");
                                }}
                            >
                                <span className="portal-option-icon" aria-hidden="true">{option.icon}</span>
                                <span className="portal-option-title">{option.title}</span>
                            </button>
                        ))}
                    </div>
                    <p className="portal-description">
                        {portals.find((option) => option.id === portal)?.description}
                    </p>

                    <label className="login-label" htmlFor="login-email">Work email</label>
                    <input
                        id="login-email"
                        type="email"
                        placeholder="you@company.com"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                    />

                    <div className="login-password-label">
                        <label className="login-label" htmlFor="login-password">Password</label>
                        {portal !== "ADMIN" && (
                            <Link
                                className="login-forgot-password"
                                to={`/forgot-password/${portal.toLowerCase()}`}
                                state={{ email: email.trim() }}
                            >
                                Forgot password?
                            </Link>
                        )}
                    </div>
                    <input
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                    />

                    {error && <p className="login-error" role="alert">{error}</p>}

                    <button className="login-submit" type="submit" disabled={loading}>
                        {loading ? "Signing in..." : `Continue as ${portals.find((option) => option.id === portal)?.title}`}
                        {!loading && <span aria-hidden="true">→</span>}
                    </button>

                    {portal === "ADMIN" ? (
                        <p className="login-register portal-note">Administrator access only.</p>
                    ) : (
                        <Link
                            className="login-create-account"
                            to={`/register?role=${portal}`}
                        >
                            Create {portal === "DRIVER" ? "driver" : "employee"} account
                            <span aria-hidden="true">→</span>
                        </Link>
                    )}
                </form>
            </section>
        </main>

    )

}

export default Login;