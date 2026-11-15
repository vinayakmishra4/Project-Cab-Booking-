import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

import Login from "./pages/Login.jsx"
import ChangePassword from "./pages/ChangePassword.jsx"
import Register from "./pages/Register.jsx"
import Dashboard from "./pages/Dashboard.jsx"
import BookRide from "./pages/BookRide.jsx"
import LiveTrack from "./pages/LiveTrack.jsx"
import RideHistory from "./pages/RideHistory.jsx"

import AdminDashboard from "./pages/AdminDashboard.jsx"
import AdminLayout from "./components/AdminLayout.jsx"
import AdminBookings from "./pages/AdminBookings.jsx"
import AdminLiveTrips from "./pages/AdminLiveTrips.jsx"
import AdminEmployees from "./pages/AdminEmployees.jsx"
import AdminFleet from "./pages/AdminFleet.jsx"
import AdminBilling from "./pages/AdminBilling.jsx"
import Drivers from "./pages/Drivers.jsx"
import Payment from "./pages/Payment.jsx"
import DriverDashboard from "./pages/DriverDashboard.jsx"
import PortalRoute from "./components/PortalRoute.jsx"
import SiteFooter from "./components/SiteFooter.jsx"

function App(){

    return(

        <BrowserRouter>

            <Routes>

                <Route path="/" element={<Login/>}/>
                <Route path="/forgot-password/:portal" element={<ChangePassword/>}/>
                <Route path="/register" element={<Register/>}/>

                <Route path="/dashboard" element={<PortalRoute portal="EMPLOYEE"><Dashboard/></PortalRoute>}/>
                <Route path="/book" element={<PortalRoute portal="EMPLOYEE"><BookRide/></PortalRoute>}/>
                <Route path="/live-track" element={<PortalRoute portal="EMPLOYEE"><LiveTrack/></PortalRoute>}/>
                <Route path="/history" element={<PortalRoute portal="EMPLOYEE"><RideHistory/></PortalRoute>}/>

                <Route path="/driver/dashboard" element={<PortalRoute portal="DRIVER"><DriverDashboard/></PortalRoute>}/>

                <Route path="/admin" element={<PortalRoute portal="ADMIN"><AdminLayout/></PortalRoute>}>
                    <Route index element={<AdminDashboard/>}/>
                    <Route path="bookings" element={<AdminBookings/>}/>
                    <Route path="live-trips" element={<AdminLiveTrips/>}/>
                    <Route path="employees" element={<AdminEmployees/>}/>
                    <Route path="drivers" element={<Drivers/>}/>
                    <Route path="fleet" element={<AdminFleet/>}/>
                    <Route path="billing" element={<AdminBilling/>}/>
                </Route>
                <Route path="/drivers" element={<PortalRoute portal="ADMIN"><Navigate to="/admin/drivers" replace/></PortalRoute>}/>
                <Route path="/add-driver" element={<PortalRoute portal="ADMIN"><Navigate to="/admin/drivers" replace/></PortalRoute>}/>

                <Route path="/payment" element={<PortalRoute portal="EMPLOYEE"><Payment/></PortalRoute>}/>

            </Routes>
            <SiteFooter/>

        </BrowserRouter>

    )

}

export default App