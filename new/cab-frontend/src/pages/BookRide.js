import { useEffect, useState } from "react"
import MapComponent from "../components/MapComponent"
import LocationSearchField from "../components/LocationSearchField"
import Navbar from "../components/Navbar"
import { useNavigate, useSearchParams } from "react-router-dom"
import { bookRide, estimateRide } from "../services/rideService"

const bookingDraftKey = "gocab.bookingDraft"

function readBookingDraft() {
    try {
        return JSON.parse(sessionStorage.getItem(bookingDraftKey) || "null")
    } catch (error) {
        sessionStorage.removeItem(bookingDraftKey)
        return null
    }
}

function BookRide(){

    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [recoveryDraft] = useState(readBookingDraft)

    const coordinateFromParams = (latitudeKey, longitudeKey) => {
        const latitude = searchParams.get(latitudeKey)
        const longitude = searchParams.get(longitudeKey)
        if (latitude === null || longitude === null) return null

        const lat = Number(latitude)
        const lng = Number(longitude)
        return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
    }

    const [pickup,setPickup] = useState(() => coordinateFromParams("pickupLat", "pickupLng") || recoveryDraft?.pickup || null)
    const [drop,setDrop] = useState(() => coordinateFromParams("dropLat", "dropLng") || recoveryDraft?.drop || null)
    const [pickupText,setPickupText] = useState(searchParams.get("pickup") || recoveryDraft?.pickupText || "")
    const [dropText,setDropText] = useState(searchParams.get("drop") || recoveryDraft?.dropText || "")
    const [locationError,setLocationError] = useState("")

    const [fareOptions,setFareOptions] = useState([])
    const [distance,setDistance] = useState(null)
    const [routeCoordinates,setRouteCoordinates] = useState(null)
    const [calculatingFare,setCalculatingFare] = useState(false)
    const [booking,setBooking] = useState(false)
    const [authRequired,setAuthRequired] = useState(false)
    const [bookingError,setBookingError] = useState(() => recoveryDraft
        ? "Your saved locations are restored. Recalculate the fare to continue."
        : "")

    const [carType,setCarType] = useState(recoveryDraft?.carType || "Mini")
    const fare = fareOptions.find((option) => option.vehicleType === carType)?.fare ?? null
    const gstAmount = fare === null ? null : Math.round(fare * 0.18 * 100) / 100
    const totalFare = fare === null ? null : Math.round((fare + gstAmount) * 100) / 100

    const saveBookingDraft = () => {
        sessionStorage.setItem(bookingDraftKey, JSON.stringify({
            pickup,
            drop,
            pickupText,
            dropText,
            carType
        }))
    }

    const signInToContinue = () => {
        saveBookingDraft()
        navigate("/", {
            state: {
                portal: "EMPLOYEE",
                returnTo: "/book?resume=1",
                message: "Sign in again to send this ride request. Your selected locations are saved."
            }
        })
    }

    useEffect(() => {
        if (recoveryDraft) sessionStorage.removeItem(bookingDraftKey)
    }, [recoveryDraft])

    const getRequestErrorMessage = (requestError, fallback) => {
        if (requestError.response?.status === 401) {
            return "Your session has expired. Sign in again to continue."
        }
        if (requestError.response?.status === 403) {
            return "Your account doesn't have permission to book rides. Sign in with an employee account."
        }
        const responseData = requestError.response?.data
        if (typeof responseData === "string" && responseData.trim()) return responseData
        if (responseData && typeof responseData === "object") {
            const message = responseData.message || responseData.detail || responseData.error
            if (typeof message === "string" && message.trim()) return message
        }
        if (requestError.response?.status) return requestError.message || fallback
        if (!requestError.isAxiosError && requestError.message) return requestError.message
        return "Could not connect to the GoCab backend. Check that the backend is running and try again."
    }

    const calculateFare = async ()=>{
        if(!pickup || !drop) {
            setLocationError("Select both pickup and destination from the location search results or map.")
            return
        }

        setLocationError("")
        setBookingError("")
        setAuthRequired(false)
        setFareOptions([])
        setDistance(null)
        setRouteCoordinates(null)
        setCalculatingFare(true)
        try {
            const response = await estimateRide({
                pickupLat: pickup.lat,
                pickupLng: pickup.lng,
                dropLat: drop.lat,
                dropLng: drop.lng
            })
            const estimate = response.data
            if (!Number.isFinite(Number(estimate?.distanceKm))
                || Number(estimate.distanceKm) <= 0
                || !Array.isArray(estimate?.fareOptions)
                || !estimate.fareOptions.length
                || estimate.fareOptions.some((option) => !option.vehicleType
                    || !Number.isFinite(Number(option.fare))
                    || !Number.isFinite(Number(option.ratePerKm)))) {
                throw new Error("The routing service returned an invalid fare estimate. Please try again.")
            }
            setDistance(Number(estimate.distanceKm))
            setFareOptions(estimate.fareOptions)
            setRouteCoordinates(Array.isArray(estimate.routeCoordinates) ? estimate.routeCoordinates : null)
        } catch (requestError) {
            if (requestError.response?.status === 401) {
                setAuthRequired(true)
                setLocationError("Your sign-in has expired. Sign in again to calculate the fare and request a driver.")
                return
            }
            setLocationError(getRequestErrorMessage(requestError, "Could not calculate the road route. Please try again."))
        } finally {
            setCalculatingFare(false)
        }
        setBookingError("")

    }

    const confirmRide = async () => {
        if (!pickup || !drop) {
            setBookingError("Select both pickup and destination before confirming your ride.")
            return
        }

        if (!localStorage.getItem("token")) {
            setAuthRequired(true)
            setBookingError("Sign in with your employee account to send this ride request.")
            return
        }

        setBooking(true)
        setBookingError("")
        try {
            const response = await bookRide({
                pickupLat: pickup.lat,
                pickupLng: pickup.lng,
                dropLat: drop.lat,
                dropLng: drop.lng,
                pickupAddress: pickupText,
                dropoffAddress: dropText,
                vehicleType: carType
            })
            const rideId = response.data?.id
            if (rideId == null) {
                throw new Error("The ride was submitted, but the booking reference was not returned. Check your ride history before trying again.")
            }

            const bookedFare = Number(response.data.fare ?? fare)
            const bookedTotal = response.data.billing?.totalAmount
                ?? Math.round(bookedFare * 1.18 * 100) / 100
            const params = new URLSearchParams({
                rideId: String(rideId),
                fare: String(bookedTotal)
            })
            navigate(`/live-track?${params.toString()}`)
        } catch (requestError) {
            if (requestError.response?.status === 401) {
                setAuthRequired(true)
                setBookingError("Your sign-in has expired. Sign in again to send this ride request.")
                return
            }
            setBookingError(getRequestErrorMessage(requestError, "Could not confirm your ride. Please try again."))
        } finally {
            setBooking(false)
        }
    }

    return(

        <div className="book-ride-page">

            <Navbar/>

            <div className="book-ride-layout" style={{display:"flex"}}>

                <div style={{
                    width:"350px",
                    padding:"20px",
                    background:"var(--surface)",
                    color:"var(--text)",
                    borderRight:"1px solid var(--border)",
                    minHeight:"calc(100vh - 112px)",
                    overflowY:"auto"
                }}>

                    <h2>Book Ride</h2>

                    <label className="bookride-location-label">
                        Pickup location
                        <LocationSearchField
                            label="Pickup location"
                            value={pickupText}
                            selected={Boolean(pickup)}
                            placeholder="Search pickup location"
                            inputClassName="bookride-location-input"
                            markerClassName="pickup-dot"
                            disabled={calculatingFare || booking}
                            onChange={(value)=>{
                                setPickupText(value)
                                setPickup(null)
                                setFareOptions([])
                                setDistance(null)
                                setRouteCoordinates(null)
                            }}
                            onSelect={(location)=>{
                                setPickupText(location.label)
                                setPickup({ lat:location.lat, lng:location.lng })
                                setFareOptions([])
                                setDistance(null)
                                setRouteCoordinates(null)
                                setLocationError("")
                            }}
                        />
                    </label>

                    <label className="bookride-location-label">
                        Destination
                        <LocationSearchField
                            label="Destination"
                            value={dropText}
                            selected={Boolean(drop)}
                            placeholder="Search destination"
                            inputClassName="bookride-location-input"
                            markerClassName="dropoff-dot"
                            disabled={calculatingFare || booking}
                            onChange={(value)=>{
                                setDropText(value)
                                setDrop(null)
                                setFareOptions([])
                                setDistance(null)
                                setRouteCoordinates(null)
                            }}
                            onSelect={(location)=>{
                                setDropText(location.label)
                                setDrop({ lat:location.lat, lng:location.lng })
                                setFareOptions([])
                                setDistance(null)
                                setRouteCoordinates(null)
                                setLocationError("")
                            }}
                        />
                    </label>

                    <h3>Compare cab fares</h3>
                    {fareOptions.length ? (
                        <div className="cab-comparison-list" role="group" aria-label="Choose a cab type">
                            {fareOptions.map((option) => {
                                const optionGst = Math.round(Number(option.fare) * 0.18 * 100) / 100
                                const optionTotal = Math.round((Number(option.fare) + optionGst) * 100) / 100
                                const selected = carType === option.vehicleType
                                return (
                                    <button
                                        key={option.vehicleType}
                                        type="button"
                                        className={`cab-comparison-option${selected ? " selected" : ""}`}
                                        aria-pressed={selected}
                                        disabled={booking || calculatingFare}
                                        onClick={() => {
                                            setCarType(option.vehicleType)
                                            setBookingError("")
                                            setAuthRequired(false)
                                        }}
                                    >
                                        <span className="cab-comparison-name">{option.vehicleType}</span>
                                        <span className="cab-comparison-rate">₹{Number(option.ratePerKm).toLocaleString("en-IN")}/km</span>
                                        <span className="cab-comparison-fare">₹{Number(option.fare).toLocaleString("en-IN")} fare</span>
                                        <span className="cab-comparison-total">₹{optionTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} incl. GST</span>
                                    </button>
                                )
                            })}
                        </div>
                    ) : (
                        <p className="cab-comparison-hint">Choose pickup and destination, then compare available cab fares.</p>
                    )}

                    <button
                        onClick={calculateFare}
                        disabled={calculatingFare || booking}
                        style={{
                            padding:"10px",
                            width:"100%",
                            background:"var(--accent)",
                            color:"white",
                            border:"none",
                            marginTop:"10px"
                        }}
                    >
                        {calculatingFare ? "Comparing cab fares…" : "Compare fares"}
                    </button>

                    {(locationError || bookingError) && (
                        <div className="bookride-error-group">
                            <p className="bookride-location-error" role="alert">{locationError || bookingError}</p>
                            {authRequired && <button className="bookride-signin-button" type="button" onClick={signInToContinue}>Sign in to continue</button>}
                        </div>
                    )}

                    {fare !== null && (

                        <div style={{marginTop:"20px"}}>

                            <p>Shortest road distance: {distance.toFixed(2)} km</p>

                            <p>Ride fare: ₹{fare.toLocaleString("en-IN")}</p>
                            <p>GST (18%): ₹{gstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            <p style={{fontSize:"18px", fontWeight:700}}>
                                Total including GST: ₹{totalFare.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            <p className="bookride-fare-note">{carType} fare is calculated at ₹{fareOptions.find((option) => option.vehicleType === carType)?.ratePerKm}/km; GST is added to the bill.</p>

                            <button
                                onClick={confirmRide}
                                disabled={booking || calculatingFare || authRequired}
                                style={{
                                    width:"100%",
                                    padding:"12px",
                                    background:"var(--accent)",
                                    border:"none",
                                    marginTop:"10px"
                                }}
                            >
                                {booking ? "Confirming ride…" : "Confirm Ride"}
                            </button>

                        </div>

                    )}

                </div>

                <div style={{flex:1,padding:"20px"}}>

                    <MapComponent
                        pickup={pickup}
                        drop={drop}
                        routeCoordinates={routeCoordinates}
                        setPickup={(location) => {
                            setPickup(location)
                            setFareOptions([])
                            setDistance(null)
                            setRouteCoordinates(null)
                        }}
                        setDrop={(location) => {
                            setDrop(location)
                            setFareOptions([])
                            setDistance(null)
                            setRouteCoordinates(null)
                        }}
                        interactive={!calculatingFare && !booking}
                    />

                </div>

            </div>

        </div>

    )

}

export default BookRide