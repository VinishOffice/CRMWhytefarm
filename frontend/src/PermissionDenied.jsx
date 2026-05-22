import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { useCookies } from "react-cookie";

function PermissionDenied() {
    const [cookies, setCookie, removeCookie] = useCookies(["permissions"]);
    const navigate = useNavigate();
    const handleLogout = () => {
        removeCookie("permissions");
        localStorage.removeItem("loggedIn");
        navigate("/login");
    };

    useEffect(() => {
        const loggedIn = localStorage.getItem("loggedIn") === "true";
       
    }, []);


    return (
        <>

            <div id="notfound">
                <div class="notfound">
                    <div class="notfound-404">
                        <h1>Permission Denied</h1>
                    </div>
                    <h2>You are not authorized user to access this page.Please login with valid user.</h2>

                    <a href="/login" onClick={handleLogout} style={{ marginTop: "2rem" }}><span class="arrow"></span>Go To Login Page</a>
                </div>
            </div>

        </>
    );
}

export default PermissionDenied;
