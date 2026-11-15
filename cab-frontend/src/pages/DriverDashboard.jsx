
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "../services/api";
import { clearAuth } from "../redux/slices/authSlice";

function DriverDashboard() {
    const dispatch = useDispatch();
    const { userEmail: email, userName } = useSelector((state) => state.auth);
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshingRides, setRefreshingRides] = useState(false);
    const [vehicleLoading, setVehicleLoading] = useState(true);
    const [cab, setCab] = useState(null);
    const [profile, setProfile] = useState(null);
    const [profileOpen, setProfileOpen] = useState(false);
    const [editingProfile, setEditingProfile] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileError, setProfileError] = useState("");
    const [profileForm, setProfileForm] = useState({ name: "", phone: "", licenseNumber: "" });
    const [error, setError] = useState("");
    const [workingRide, setWorkingRide] = useState(null);
    const [savingVehicle, setSavingVehicle] = useState(false);
    const [updatingDuty, setUpdatingDuty] = useState(false);
    const [vehicleForm, setVehicleForm] = useState({ model: "", carNumber: "", vehicleType: "" });

    const firstName = userName?.trim().split(/\s+/)[0]
        || (email || "").split("@")[0]?.split(/[._-]/)[0]
        || "Driver";
    const driverName = profile?.name || userName || firstName;

    const loadProfile = useCallback(async () => {
        try {
            const response = await api.get("/api/driver/my-profile");
            setProfile(response.data);
            setProfileError("");
            setProfileForm({
                name: response.data.name || "",
                phone: response.data.phone || "",
                licenseNumber: response.data.licenseNumber || ""
            });
        } catch (requestError) {
            setProfileError(requestError.response?.data?.message || requestError.response?.data || "Could not load your account details.");
        }
    }, []);

    const loadRides = useCallback(async (background = false) => {
        if (background) setRefreshingRides(true);
        try {
            const response = await api.get("/api/driver/my-rides");
            setRides(Array.isArray(response.data) ? response.data : []);
            setError("");
        } catch (requestError) {
            setError(requestError.response?.data?.message || requestError.response?.data || "Could not load your assigned rides.");
        } finally {
            setRefreshingRides(false);
        }
    }, []);

    const loadDashboard = useCallback(async () => {
        setError("");
        setVehicleLoading(true);
        setLoading(true);
        try {
            const vehicleResponse = await api.get("/api/driver/my-cab");
            setCab(vehicleResponse.data || null);
            if (vehicleResponse.data) {
                await loadRides();
            } else {
                setRides([]);
            }
        } catch (requestError) {
            setError(requestError.response?.data?.message || requestError.response?.data || "Could not load your driver dashboard.");
        } finally {
            setLoading(false);
            setVehicleLoading(false);
        }
    }, [loadRides]);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    useEffect(() => {
        if (!cab) return undefined;
        const interval = window.setInterval(() => loadRides(true), 5000);
        return () => window.clearInterval(interval);
    }, [cab, loadRides]);

    const openProfile = () => {
        if (profile) {
            setProfileForm({
                name: profile.name || "",
                phone: profile.phone || "",
                licenseNumber: profile.licenseNumber || ""
            });
        }
        if (cab) {
            setVehicleForm({
                model: cab.model || "",
                carNumber: cab.carNumber || "",
                vehicleType: cab.vehicleType || ""
            });
        }
        setEditingProfile(false);
        setEditingVehicle(false);
        setProfileError("");
        setProfileOpen(true);
    };

    const updateProfile = async (event) => {
        event.preventDefault();
        setSavingProfile(true);
        setProfileError("");
        try {
            const response = await api.put("/api/driver/my-profile", {
                name: profileForm.name.trim(),
                phone: profileForm.phone.trim(),
                licenseNumber: profileForm.licenseNumber.trim().toUpperCase()
            });
            setProfile(response.data);
            setProfileError("");
            setProfileForm({
                name: response.data.name || "",
                phone: response.data.phone || "",
                licenseNumber: response.data.licenseNumber || ""
            });
            setEditingProfile(false);
        } catch (requestError) {
            setProfileError(requestError.response?.data?.message || requestError.response?.data || "Could not update your account details.");
        } finally {
            setSavingProfile(false);
        }
    };

    const registerVehicle = async (event) => {
        event.preventDefault();
        setSavingVehicle(true);
        setError("");
        try {
            await api.post("/api/driver/add-cab", {
                model: vehicleForm.model.trim(),
                carNumber: vehicleForm.carNumber.trim().toUpperCase(),
                vehicleType: vehicleForm.vehicleType
            });
            await loadDashboard();
        } catch (requestError) {
            setError(requestError.response?.data?.message || requestError.response?.data || "Could not register your car.");
        } finally {
            setSavingVehicle(false);
        }
    };

    const updateVehicle = async (event) => {
        event.preventDefault();
        setSavingVehicle(true);
        setProfileError("");
        try {
            const response = await api.put("/api/driver/my-cab", {
                model: vehicleForm.model.trim(),
                carNumber: vehicleForm.carNumber.trim().toUpperCase(),
                vehicleType: vehicleForm.vehicleType
            });
            setCab(response.data);
            setEditingVehicle(false);
        } catch (requestError) {
            setProfileError(requestError.response?.data?.message || requestError.response?.data || "Could not update your car details.");
        } finally {
            setSavingVehicle(false);
        }
    };

    const shareLocation = async () => {
        setUpdatingDuty(true);
        setError("");
        if (!navigator.geolocation) {
            setError("Location sharing is not available in this browser.");
            setUpdatingDuty(false);
            return;
        }
        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000
                });
            });
            await api.put("/api/driver/update-location", null, {
                params: {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                }
            });
            const response = await api.put("/api/driver/go-online");
            setCab(response.data);
        } catch (requestError) {
            setError(requestError.response?.data?.message || requestError.message || "Could not share your location.");
        } finally {
            setUpdatingDuty(false);
        }
    };

    const goOffDuty = async () => {
        setUpdatingDuty(true);
        setError("");
        try {
            const response = await api.put("/api/driver/go-offline");
            setCab(response.data);
        } catch (requestError) {
            setError(requestError.response?.data?.message || requestError.response?.data || "Could not switch to off duty.");
        } finally {
            setUpdatingDuty(false);
        }
    };

    const updateRide = async (ride, action) => {
        setWorkingRide(ride.id);
        setError("");
        try {
            const response = await api.post(`/api/driver/${action}-ride/${ride.id}`);
            setRides((current) =>
                current.map((item) => item.id === ride.id ? response.data : item)
            );
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                requestError.response?.data ||
                "The ride could not be updated."
            );
        } finally {
            setWorkingRide(null);
        }
    };

    const activeRides = rides.filter((ride) =>
        ["REQUESTED", "ACCEPTED", "STARTED"].includes(ride.status)
    );
    const completedRides = rides.filter((ride) => ride.status === "COMPLETED");
    const earnings = completedRides.reduce(
        (total, ride) => total + (Number(ride.fare) || 0),
        0
    );

    return (
        <div className="driver-portal">
            <aside className="driver-sidebar">
                <a className="portal-side-brand" href="/driver/dashboard" aria-label="GoCab driver dashboard">
                    <span className="brand-mark portal-brand-mark">M</span>
                    <span className="brand-copy">
                        <span className="brand-word">Go<span>Cab</span></span>
                    </span>
                    <small>DRIVER</small>
                </a>

                <button className="driver-profile" type="button" onClick={openProfile} aria-label="View driver account details">
                    <span className="driver-avatar">{driverName.charAt(0).toUpperCase()}</span>
                    <span className="driver-profile-copy">
                        <strong>{driverName}</strong>
                        <span>Driver account</span>
                    </span>
                    <span className="driver-profile-action" aria-hidden="true">›</span>
                </button>

                <p className="side-nav-label">WORKSPACE</p>
                <a className="driver-side-link active" href="/driver/dashboard"><span>◫</span> Dashboard</a>
                <a className="driver-side-link" href="#assigned-trips"><span>↗</span> Assigned trips</a>

                <div className="driver-sidebar-bottom">
                    <p>Drive safe. We’ve got your back.</p>
                    <button className="sidebar-signout" type="button" onClick={() => {
                        dispatch(clearAuth());
                        window.location.assign("/");
                    }}>
                        ↪ <span>Sign out</span>
                    </button>
                </div>
            </aside>

            <main className="driver-main">
                <header className="driver-topbar">
                    <div>
                        <span className={`status-dot ${cab?.online ? "duty-status-on" : "duty-status-off"}`}></span>
                        {cab?.online ? "On duty" : "Off duty"}
                    </div>
                    <span>{email}</span>
                </header>

                <div className="driver-content">
                    <div className="dashboard-welcome">
                        <div>
                            <p className="eyebrow">YOUR DRIVER DASHBOARD</p>
                            <h1>Welcome back, {driverName.split(/\s+/)[0]}.</h1>
                            <p className="welcome-caption">
                                {cab?.online
                                    ? "You’re on duty. New ride requests appear here automatically."
                                    : "Go on duty to receive new ride requests."}
                            </p>
                        </div>
                        <button className="refresh-button" type="button" onClick={loadDashboard} disabled={loading || vehicleLoading}>
                            ↻ Refresh
                        </button>
                    </div>

                    {error && <p className="dashboard-message" role="alert">{String(error)}</p>}

                    {vehicleLoading ? (
                        <section className="dashboard-card vehicle-card">
                            <p className="empty-state">Loading your car details…</p>
                        </section>
                    ) : !cab ? (
                        <section className="dashboard-card vehicle-card">
                            <div className="card-heading">
                                <div>
                                    <p className="eyebrow">FIRST-TIME SETUP</p>
                                    <h2>Register your car</h2>
                                </div>
                                <span className="vehicle-badge">Required</span>
                            </div>
                            <p className="vehicle-description">
                                Add the car you’ll use for GoCab trips. Your assigned-trip dashboard will be ready as soon as it’s registered.
                            </p>
                            <form className="vehicle-form" onSubmit={registerVehicle}>
                                <label>
                                    Car model
                                    <input
                                        type="text"
                                        maxLength="100"
                                        placeholder="e.g. Maruti Suzuki Dzire"
                                        value={vehicleForm.model}
                                        onChange={(event) => setVehicleForm((form) => ({ ...form, model: event.target.value }))}
                                        required
                                    />
                                </label>
                                <label>
                                    Registration number
                                    <input
                                        type="text"
                                        maxLength="20"
                                        placeholder="e.g. MH 02 AB 1234"
                                        value={vehicleForm.carNumber}
                                        onChange={(event) => setVehicleForm((form) => ({ ...form, carNumber: event.target.value.toUpperCase() }))}
                                        required
                                    />
                                </label>
                                <label>
                                    Car category
                                    <select
                                        value={vehicleForm.vehicleType}
                                        onChange={(event) => setVehicleForm((form) => ({ ...form, vehicleType: event.target.value }))}
                                        required
                                    >
                                        <option value="">Select a category</option>
                                        <option value="Mini">Mini</option>
                                        <option value="Sedan">Sedan</option>
                                        <option value="SUV">SUV</option>
                                        <option value="XL">XL</option>
                                    </select>
                                </label>
                                <button type="submit" disabled={savingVehicle}>
                                    {savingVehicle ? "Registering car…" : "Register car →"}
                                </button>
                            </form>
                        </section>
                    ) : (
                        <section className="dashboard-card vehicle-card">
                            <div className="card-heading">
                                <div>
                                    <p className="eyebrow">YOUR REGISTERED CAR</p>
                                    <h2>{cab.model}</h2>
                                </div>
                                <span className={`vehicle-badge ${cab.online ? "vehicle-badge-online" : ""}`}>
                                    <span className="vehicle-duty-dot" aria-hidden="true"></span>
                                    {cab.online ? "On duty" : "Off duty"}
                                </span>
                            </div>
                            <div className="vehicle-details">
                                <span>Registration <strong>{cab.carNumber}</strong></span>
                                <span>Category <strong>{cab.vehicleType || "Car"}</strong></span>
                            </div>
                            <p className="vehicle-duty-help">
                                {cab.online
                                    ? "You’re available for assigned trips. Refresh your location to keep it current."
                                    : "Go on duty and share your location to become available for trips."}
                            </p>
                            <div className="vehicle-duty-actions">
                                <button
                                    className={`vehicle-location-button ${cab.online ? "vehicle-refresh-button" : "vehicle-on-duty-button"}`}
                                    type="button"
                                    onClick={shareLocation}
                                    disabled={updatingDuty}
                                >
                                    {updatingDuty ? "Updating…" : cab.online ? "Refresh location" : "Go on duty"}
                                </button>
                                {cab.online && (
                                    <button className="vehicle-off-duty-button" type="button" onClick={goOffDuty} disabled={updatingDuty}>
                                        Go off duty
                                    </button>
                                )}
                            </div>
                        </section>
                    )}

                    {!vehicleLoading && cab && (
                        <>
                            <section className="driver-stats">
                                <article className="driver-stat-card driver-stat-dark">
                                    <span>ACTIVE TRIPS</span>
                                    <strong>{loading ? "—" : activeRides.length}</strong>
                                    <small>Assigned to you</small>
                                    <b aria-hidden="true">↗</b>
                                </article>
                                <article className="driver-stat-card">
                                    <span>COMPLETED</span>
                                    <strong>{loading ? "—" : completedRides.length}</strong>
                                    <small>All-time completed trips</small>
                                    <b aria-hidden="true">✓</b>
                                </article>
                                <article className="driver-stat-card">
                                    <span>TRIP EARNINGS</span>
                                    <strong>{loading ? "—" : `₹${earnings.toLocaleString("en-IN")}`}</strong>
                                    <small>From completed trips</small>
                                    <b aria-hidden="true">₹</b>
                                </article>
                            </section>

                            <section id="assigned-trips" className="dashboard-card driver-trips-card">
                                <div className="card-heading">
                                    <div>
                                        <p className="eyebrow">ON THE ROAD</p>
                                        <h2>Your assigned trips</h2>
                                    </div>
                                    <span className="trip-count">
                                        {activeRides.filter((ride) => ride.status === "REQUESTED").length} requests · {activeRides.length} active
                                    </span>
                                </div>

                                {loading || refreshingRides ? (
                                    <p className="empty-state">
                                        {loading ? "Loading assigned trips…" : "Checking for new ride requests…"}
                                    </p>
                                ) : activeRides.length ? (
                                    <div className="driver-trip-list">
                                        {activeRides.map((ride) => (
                                            <article className="driver-trip" key={ride.id}>
                                                <div className="trip-heading">
                                                    <div>
                                                        <span className="trip-reference">GOCAB RIDE</span>
                                                        <h3>Trip #{ride.id}</h3>
                                                    </div>
                                                    <span className={`trip-status status-${ride.status?.toLowerCase()}`}>
                                                        {ride.status?.replace("_", " ")}
                                                    </span>
                                                </div>

                                                <div className="trip-route">
                                                    <span className="route-marker pickup-marker"></span>
                                                    <div>
                                                        <small>PICKUP</small>
                                                        <strong>{ride.pickupLat}, {ride.pickupLng}</strong>
                                                    </div>
                                                    <span className="route-stem"></span>
                                                    <span className="route-marker drop-marker"></span>
                                                    <div>
                                                        <small>DROP-OFF</small>
                                                        <strong>{ride.dropLat}, {ride.dropLng}</strong>
                                                    </div>
                                                </div>

                                                <div className="trip-footer">
                                                    <span>
                                                        Fare <strong>{ride.fare == null ? "Pending" : `₹${ride.fare}`}</strong>
                                                    </span>

                                                    {ride.status === "REQUESTED" && (
                                                        <button
                                                            type="button"
                                                            disabled={workingRide === ride.id}
                                                            onClick={() => updateRide(ride, "accept")}
                                                        >
                                                            {workingRide === ride.id ? "Accepting…" : "Accept trip →"}
                                                        </button>
                                                    )}

                                                    {ride.status === "ACCEPTED" && (
                                                        <button
                                                            type="button"
                                                            disabled={workingRide === ride.id}
                                                            onClick={() => updateRide(ride, "start")}
                                                        >
                                                            {workingRide === ride.id ? "Starting…" : "Start trip →"}
                                                        </button>
                                                    )}

                                                    {ride.status === "STARTED" && (
                                                        <>
                                                            <span className="trip-live-label">
                                                                <span className="status-dot"></span> Trip in progress
                                                            </span>
                                                            <button
                                                                type="button"
                                                                disabled={workingRide === ride.id}
                                                                onClick={() => updateRide(ride, "complete")}
                                                            >
                                                                {workingRide === ride.id ? "Completing…" : "Complete trip →"}
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <span className="empty-state-icon">↗</span>
                                        <strong>You’re all caught up.</strong>
                                        <p>New assigned trips will show up here.</p>
                                    </div>
                                )}
                            </section>
                        </>
                    )}
                </div>
            </main>

            {profileOpen && (
                <div
                    className="profile-modal-backdrop"
                    onMouseDown={(event) => {
                        if (
                            event.target === event.currentTarget &&
                            !savingProfile &&
                            !savingVehicle
                        ) {
                            setProfileOpen(false);
                        }
                    }}
                >
                    <section className="profile-modal" role="dialog" aria-modal="true" aria-labelledby="driver-profile-title">
                        <div className="profile-modal-heading">
                            <div>
                                <p className="eyebrow">DRIVER ACCOUNT</p>
                                <h2>{editingProfile || editingVehicle ? "Update your details" : "Your account details"}</h2>
                            </div>
                            <button
                                className="profile-close-button"
                                type="button"
                                aria-label="Close account details"
                                onClick={() => setProfileOpen(false)}
                                disabled={savingProfile || savingVehicle}
                            >
                                ×
                            </button>
                        </div>

                        {profileError && <p className="dashboard-message" role="alert">{String(profileError)}</p>}

                        {!profile || vehicleLoading ? (
                            <p className="empty-state">Loading your account details…</p>
                        ) : editingVehicle ? (
                            <form className="profile-form" onSubmit={updateVehicle}>
                                <p className="eyebrow profile-section-label">CAR DETAILS</p>
                                <label>
                                    Car model
                                    <input
                                        type="text"
                                        maxLength="100"
                                        value={vehicleForm.model}
                                        onChange={(event) => setVehicleForm((form) => ({ ...form, model: event.target.value }))}
                                        required
                                    />
                                </label>
                                <label>
                                    Registration number
                                    <input
                                        type="text"
                                        maxLength="20"
                                        value={vehicleForm.carNumber}
                                        onChange={(event) => setVehicleForm((form) => ({ ...form, carNumber: event.target.value.toUpperCase() }))}
                                        required
                                    />
                                </label>
                                <label>
                                    Car category
                                    <select
                                        value={vehicleForm.vehicleType}
                                        onChange={(event) => setVehicleForm((form) => ({ ...form, vehicleType: event.target.value }))}
                                        required
                                    >
                                        <option value="">Select a category</option>
                                        <option value="Mini">Mini</option>
                                        <option value="Sedan">Sedan</option>
                                        <option value="SUV">SUV</option>
                                        <option value="XL">XL</option>
                                    </select>
                                </label>
                                <div className="profile-modal-actions">
                                    <button className="profile-secondary-button" type="button" onClick={() => setEditingVehicle(false)} disabled={savingVehicle}>
                                        Cancel
                                    </button>
                                    <button className="profile-primary-button" type="submit" disabled={savingVehicle}>
                                        {savingVehicle ? "Saving…" : "Save car details"}
                                    </button>
                                </div>
                            </form>
                        ) : editingProfile ? (
                            <form className="profile-form" onSubmit={updateProfile}>
                                <label>
                                    Full name
                                    <input
                                        type="text"
                                        maxLength="100"
                                        autoComplete="name"
                                        value={profileForm.name}
                                        onChange={(event) => setProfileForm((form) => ({ ...form, name: event.target.value }))}
                                        required
                                    />
                                </label>
                                <label>
                                    Phone number
                                    <input
                                        type="tel"
                                        maxLength="20"
                                        autoComplete="tel"
                                        value={profileForm.phone}
                                        onChange={(event) => setProfileForm((form) => ({ ...form, phone: event.target.value }))}
                                        required
                                    />
                                </label>
                                <label>
                                    Driving licence number
                                    <input
                                        type="text"
                                        maxLength="50"
                                        value={profileForm.licenseNumber}
                                        onChange={(event) => setProfileForm((form) => ({ ...form, licenseNumber: event.target.value.toUpperCase() }))}
                                        required
                                    />
                                </label>
                                <div className="profile-modal-actions">
                                    <button className="profile-secondary-button" type="button" onClick={() => setEditingProfile(false)} disabled={savingProfile}>
                                        Cancel
                                    </button>
                                    <button className="profile-primary-button" type="submit" disabled={savingProfile}>
                                        {savingProfile ? "Saving…" : "Save changes"}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <>
                                <div className="profile-details">
                                    <div><span>Full name</span><strong>{profile.name}</strong></div>
                                    <div><span>Email</span><strong>{profile.email}</strong></div>
                                    <div><span>Phone number</span><strong>{profile.phone}</strong></div>
                                    <div><span>Driver ID</span><strong>{profile.driverId}</strong></div>
                                    <div><span>Driving licence</span><strong>{profile.licenseNumber}</strong></div>
                                </div>

                                <div className="profile-vehicle-section">
                                    <p className="eyebrow profile-section-label">CAR DETAILS</p>
                                    {cab ? (
                                        <div className="profile-details">
                                            <div><span>Car model</span><strong>{cab.model}</strong></div>
                                            <div><span>Registration</span><strong>{cab.carNumber}</strong></div>
                                            <div><span>Category</span><strong>{cab.vehicleType || "Car"}</strong></div>
                                        </div>
                                    ) : (
                                        <p className="profile-no-vehicle">
                                            No car registered yet. Register your car from the dashboard to enable trip assignments.
                                        </p>
                                    )}
                                </div>

                                <div className="profile-modal-actions profile-modal-actions-split">
                                    <button className="profile-secondary-button" type="button" onClick={() => setEditingProfile(true)}>
                                        Edit account
                                    </button>
                                    {cab && (
                                        <button
                                            className="profile-primary-button"
                                            type="button"
                                            onClick={() => {
                                                setVehicleForm({
                                                    model: cab.model || "",
                                                    carNumber: cab.carNumber || "",
                                                    vehicleType: cab.vehicleType || ""
                                                });
                                                setEditingVehicle(true);
                                            }}
                                        >
                                            Edit car
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </section>
                </div>
            )}
        </div>
    );
}

export default DriverDashboard;
