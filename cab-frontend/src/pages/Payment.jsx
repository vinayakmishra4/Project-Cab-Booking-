import { useState,useEffect } from "react"
import Navbar from "../components/Navbar"
import { useNavigate, useSearchParams } from "react-router-dom"

function Payment(){

    const [method,setMethod]=useState("UPI")
    const [time,setTime]=useState(300)

    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    const requestedPrice = Number(searchParams.get("fare"))
    const price = Number.isFinite(requestedPrice) && requestedPrice > 0 ? requestedPrice : 327

    useEffect(()=>{

        const timer=setInterval(()=>{
            setTime(prev=>prev>0?prev-1:0)
        },1000)

        return()=>clearInterval(timer)

    },[])

    return(

        <div>

            <Navbar/>

            <div style={{
                display:"flex",
                justifyContent:"center",
                alignItems:"center",
                height:"80vh"
            }}>

                <div style={{
                    background:"var(--surface)",
                    padding:"35px",
                    borderRadius:"16px",
                    width:"320px",
                    textAlign:"center",
                    border:"1px solid var(--border)",
                    boxShadow:"var(--shadow)"
                }}>

                    <h2>Payment</h2>

                    <h3 style={{color:"var(--accent)"}}>₹ {price}</h3>

                    <div style={{
                        display:"flex",
                        gap:"10px",
                        marginTop:"15px"
                    }}>

                        <button
                            className="btn"
                            onClick={()=>setMethod("UPI")}
                            style={{
                                flex:1,
                                padding:"10px",
                                background:method==="UPI"?"var(--accent)":"#f3f4f6",
                                border:"none",
                                color:method==="UPI"?"#ffffff":"var(--text)",
                                borderRadius:"8px"
                            }}
                        >
                            UPI
                        </button>

                        <button
                            className="btn"
                            onClick={()=>setMethod("Cash")}
                            style={{
                                flex:1,
                                padding:"10px",
                                background:method==="Cash"?"var(--accent)":"#f3f4f6",
                                border:"none",
                                color:method==="Cash"?"#ffffff":"var(--text)",
                                borderRadius:"8px"
                            }}
                        >
                            Cash
                        </button>

                    </div>

                    {method==="UPI" &&(

                        <div style={{marginTop:"20px"}}>

                            <img
                                src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=GoCab"
                                alt="GoCab payment QR code"
                                style={{background:"white",padding:"10px",borderRadius:"10px"}}
                            />

                            <p>Scan & Pay using UPI</p>

                            <p style={{color:"var(--accent)"}}>Timer: {time} sec</p>

                        </div>

                    )}

                    {method==="Cash" &&(

                        <p style={{marginTop:"20px"}}>
                            Pay driver with cash
                        </p>

                    )}

                    <button
                        className="btn btn-primary"
                        onClick={()=>navigate("/history")}
                        style={{
                            marginTop:"20px",
                            width:"100%",
                            padding:"12px",
                            background:"var(--accent)",
                            border:"none"
                        }}
                    >
                        Confirm Payment
                    </button>

                </div>

            </div>

        </div>

    )

}

export default Payment