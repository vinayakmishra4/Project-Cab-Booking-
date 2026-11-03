import { BrowserRouter, Routes, Route } from "react-router-dom"

import Login from "./pages/Login"
import ChangePassword from "./pages/ChangePassword"
import Register from "./pages/Register"
import Dashboard from "./pages/Dashboard"
import BookRide from "./pages/BookRide"
import LiveTrack from "./pages/LiveTrack"
import RideHistory from "./pages/RideHistory"

import AdminDashboard from "./pages/AdminDashboard"
import Drivers from "./pages/Drivers"
import AddDriver from "./pages/AddDriver"
import Payment from "./pages/Payment"
import DriverDashboard from "./pages/DriverDashboard"
import PortalRoute from "./components/PortalRoute"

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

                <Route path="/admin" element={<PortalRoute portal="ADMIN"><AdminDashboard/></PortalRoute>}/>
                <Route path="/drivers" element={<PortalRoute portal="ADMIN"><Drivers/></PortalRoute>}/>
                <Route path="/add-driver" element={<PortalRoute portal="ADMIN"><AddDriver/></PortalRoute>}/>

                <Route path="/payment" element={<PortalRoute portal="EMPLOYEE"><Payment/></PortalRoute>}/>

            </Routes>

        </BrowserRouter>

    )

}

export default App