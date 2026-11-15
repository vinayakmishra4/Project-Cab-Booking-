import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { changePassword } from "../services/authService";

const portalTitles = {
    employee: "Employee",
    driver: "Driver"
};

function ChangePassword() {
    const { portal: routePortal } = useParams();
    const portal = routePortal?.toLowerCase() === "driver" ? "DRIVER" : "EMPLOYEE";
    const portalTitle = portalTitles[portal.toLowerCase()];
    const location = useLocation();
    const navigate = useNavigate();
    const [email, setEmail] = useState(
        () => location.state?.email || localStorage.getItem("userEmail") || ""
    );
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async (event) => {
        event.preventDefault();
        setError("");

        if (newPassword !== confirmPassword) {
            setError("The passwords do not match.");
            return;
        }
        if (newPassword.length < 8 || /\s/.test(newPassword)) {
            setError("Your new password must be at least 8 characters and cannot contain spaces.");
            return;
        }
        if (newPassword.toLowerCase() === email.trim().toLowerCase()) {
            setError("Your new password cannot match your email address.");
            return;
        }

        setLoading(true);
        try {
            await changePassword({
                email: email.trim(),
                portal,
                oldPassword,
                newPassword,
                confirmPassword
            });
            localStorage.setItem("userEmail", email.trim());
            navigate("/", {
                replace: true,
                state: {
                    portal,
                    email: email.trim(),
                    message: "Your password has been updated. Sign in with your new password."
                }
            });
        } catch (requestError) {
            const responseMessage = requestError.response?.data?.message || requestError.response?.data;
            setError(typeof responseMessage === "string"
                ? responseMessage
                : requestError.response?.status
                    ? `Password update failed (HTTP ${requestError.response.status}).`
                    : "Could not connect to GoCab. Check that the backend is running and try again.");
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
                    <p className="eyebrow">ACCOUNT RECOVERY</p>
                    <h1>Account access,<br/><span>restored.</span></h1>
                    <p className="login-story-description">
                        Change your {portalTitle.toLowerCase()} account password securely.
                    </p>
                </div>
                <div className="login-story-footer">
                    <span className="story-orbit" aria-hidden="true">✳</span>
                    <span>Reliable rides. Thoughtful journeys.</span>
                </div>
            </section>

            <section className="login-panel">
                <form className="login-form reset-password-form" onSubmit={submit}>
                    <p className="eyebrow login-eyebrow">ACCOUNT SECURITY</p>
                    <h2>Change Password</h2>
                    <p className="login-subtitle">Update your {portalTitle.toLowerCase()} password.</p>

                    {email ? (
                        <p className="reset-account-email">Account: <strong>{email}</strong></p>
                    ) : (
                        <>
                            <label className="login-label" htmlFor="reset-email">Account Email</label>
                            <input
                                className="form-control"
                                id="reset-email"
                                type="email"
                                autoComplete="username"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                required
                            />
                        </>
                    )}

                    <label className="login-label" htmlFor="old-password">Old Password</label>
                    <input
                        className="form-control"
                        id="old-password"
                        type="password"
                        autoComplete="current-password"
                        value={oldPassword}
                        onChange={(event) => setOldPassword(event.target.value)}
                        required
                    />

                    <p className="reset-password-requirements">
                        Your password must be at least 8 characters, cannot contain spaces, and cannot match your email address.
                    </p>

                    <label className="login-label" htmlFor="new-password">New Password</label>
                    <input
                        className="form-control"
                        id="new-password"
                        type="password"
                        autoComplete="new-password"
                        minLength={8}
                        maxLength={100}
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        required
                    />

                    <label className="login-label" htmlFor="confirm-new-password">Confirm New Password</label>
                    <input
                        className="form-control"
                        id="confirm-new-password"
                        type="password"
                        autoComplete="new-password"
                        minLength={8}
                        maxLength={100}
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        required
                    />

                    {error && <p className="login-error" role="alert">{error}</p>}

                    <button className="btn btn-primary login-submit" type="submit" disabled={loading}>
                        {loading ? "Updating password…" : "Set Password"}
                    </button>
                    <Link className="reset-back-link" to="/" state={{ portal, email }}>
                        Back to {portalTitle.toLowerCase()} sign in
                    </Link>
                </form>
            </section>
        </main>
    );
}

export default ChangePassword;
