import Navbar from "../components/Navbar";
import DriverCard from "../components/DriverCard";
import { useEffect, useState } from "react";
import api from "../services/api";

function Drivers(){

    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let mounted = true;
        Promise.all([
            api.get("/api/admin/all-users"),
            api.get("/api/admin/all-cabs")
        ]).then(([usersResponse, cabsResponse]) => {
            if (!mounted) return;
            const cabsByDriverId = new Map(
                cabsResponse.data.map((cab) => [cab.driver?.id, cab])
            );
            setDrivers(usersResponse.data
                .filter((user) => user.role === "DRIVER")
                .map((driver) => ({ ...driver, cab: cabsByDriverId.get(driver.id) || null })));
        }).catch(() => {
            if (mounted) setError("Driver data could not be loaded. Check the backend connection and try again.");
        }).finally(() => {
            if (mounted) setLoading(false);
        });

        return () => { mounted = false; };
    }, []);

    return(

        <div>

            <Navbar/>

            <div style={{marginTop:"80px",padding:"20px"}}>

                <h2>All Drivers</h2>

                {loading ? (
                    <p role="status">Loading driver records…</p>
                ) : error ? (
                    <p role="alert">{error}</p>
                ) : drivers.length===0 ? (

                    <p>No drivers are registered yet.</p>

                ) : (

                    drivers.map((driver,i)=>(
                        <DriverCard key={i} driver={driver}/>
                    ))

                )}

            </div>

        </div>

    )

}

export default Drivers