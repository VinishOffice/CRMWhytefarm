import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import { ROLES_REDIRECTION } from './constants';
import GlobalContext from "./context/GlobalContext";

import apiClient from "./services/apiClient";
import Swal from "sweetalert2";
function Login() {
    const [cookies, removeCookie] = useCookies(["permissions"]);
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility
    const [showSpinner, setShowSpinner] = useState(false);
    const { setStateUser } = useContext(GlobalContext)
    useEffect(() => {
        const storedPermissionsData = getCookie("permissions");
        if (storedPermissionsData) {
            const permissions = JSON.parse(storedPermissionsData);
        } else {
        }
    }, []);

    useEffect(() => {
        const loggedIn = localStorage.getItem("loggedIn") === "true";
        if (loggedIn) {
            navigate("/");
        }
    }, []);

    const setCookie = (name, value, days) => {
        const expirationDate = new Date();
        let json_data = JSON.parse(value);
        let temp_permessions = [];
        for (let key in json_data) {
            temp_permessions = temp_permessions.concat(json_data[key]);
        }
        document.cookie = "c_permissions=" + JSON.stringify(temp_permessions);
        expirationDate.setTime(expirationDate.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = "expires=" + expirationDate.toUTCString();
        document.cookie = name + "=" + value + ";" + expires + ";path=/";
    };

    const getCookie = (name) => {
        const cookieName = name + "=";
        const decodedCookie = decodeURIComponent(document.cookie);
        const cookieArray = decodedCookie.split(';');
        for (let i = 0; i < cookieArray.length; i++) {
            let cookie = cookieArray[i];
            while (cookie.charAt(0) === ' ') {
                cookie = cookie.substring(1);
            }
            if (cookie.indexOf(cookieName) === 0) {
                return cookie.substring(cookieName.length, cookie.length);
            }
        }
        return "";
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrorMessage("");
        // setShowSpinner(true);

        if (username.trim() === "") {
            setErrorMessage("Username cannot be blank.");
            setShowSpinner(false);
            return;
        }
        if (password.trim() === "") {
            setErrorMessage("Password cannot be blank.");
            setShowSpinner(false);
            return;
        }

        try {
            const loginResp = await apiClient.post("/api/users/login", {
                username,
                password,
            });
            const userData = loginResp?.data?.user;

                
                const permissionResp = await apiClient.get(`/api/user_permissions/${userData['role']}`);
                const permissionsData = permissionResp.data?.data;

                if (permissionsData) {
                    removeCookie("permissions");
                    setCookie("permissions", JSON.stringify(permissionsData), { maxAge: 30 });

                    localStorage.setItem("loggedIn", "true");
                    localStorage.setItem("userId", userData.user_id);
                    localStorage.setItem("username", userData.username);
                    localStorage.setItem("loggedIn_user", `${userData.first_name} ${userData.last_name}`);
                    localStorage.setItem("agent_name", `${userData.first_name} ${userData.last_name}`); // ✅ ADDED
                    localStorage.setItem("role", userData.role);
                    localStorage.setItem("hub_name", userData.hub_name);

                    setStateUser({
                        "loggedIn": true,
                        "userId": userData.user_id,
                        "username": userData.username,
                        "loggedIn_user": `${userData.first_name} ${userData.last_name}`,
                        "role": userData.role,
                        "hub_name": userData.hub_name
                    })
                    let redirected_role = ROLES_REDIRECTION[userData['role']]
                    navigate(redirected_role);
                } else {
                    setShowSpinner(false);
                }
        } catch (error) {
            console.error("Error during login: ", error);
            if (error?.response?.status === 429) {
                const limitMessage = error.response.data || "Too many login attempts, please try again later";
                
                Swal.fire({
                    title: 'Limit Exceeded',
                    text: limitMessage,
                    icon: 'warning',
                    confirmButtonText: 'Okay',
                    confirmButtonColor: '#337ab7' // Matching your login button color
                });

                setErrorMessage(limitMessage);
            } else {
                setErrorMessage(error?.response?.data?.error || "An error occurred during login. Please try again.");
            }
            setShowSpinner(false);
        }
    };

    const SpinnerOverlay = () => (
        <div className="">
            <div className="spinnerLogin"></div>
        </div>
    );

    return (
        <div className="container-scroller">
            <div className="container-fluid page-body-wrapper full-page-wrapper">
                <div className="content-wrapper d-flex align-items-center auth px-0">
                    <div className="row w-100 mx-0">
                        <div className="col-lg-6 mx-auto">
                            <div className="auth-form-light text-left py-5 px-4 px-sm-5">
                                <div className="brand-logo" style={{ display: "flex", justifyContent: "center" }}>
                                    <img src="https://www.whytefarms.com/img/sticky-logo.png" alt="logo" />
                                </div>
                                <div style={{ display: "flex", justifyContent: "center" }}> <h4>Welcome! Login to your account</h4></div>
                                <form onSubmit={handleSubmit} className="pt-3">
                                    <div className="form-group">
                                        <div style={{ marginBottom: "8px", fontWeight: "600", fontSize: "14px" }}>
                                            Username
                                        </div>
                                        <input
                                            type="text"
                                            className="form-control form-control-lg"
                                            placeholder="Username"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                        />
                                        {errorMessage === "Username cannot be blank." && (
                                            <div style={{ color: "red", marginTop: "8px" }}>
                                                {errorMessage}
                                            </div>
                                        )}
                                    </div>
                                    <div className="form-group">
                                        <div style={{ marginBottom: "8px", fontWeight: "600", fontSize: "14px" }}>
                                            Password
                                        </div>
                                        <div style={{ position: "relative" }}>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                className="form-control form-control-lg"
                                                placeholder="Password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                            />
                                            {showPassword ? (
                                                <i className="mdi mdi-eye-off" onClick={() => setShowPassword(false)} style={{ position: "absolute", top: "50%", right: "10px", transform: "translateY(-50%)", cursor: "pointer" }}></i>
                                            ) : (
                                                <i className="mdi mdi-eye" onClick={() => setShowPassword(true)} style={{ position: "absolute", top: "50%", right: "10px", transform: "translateY(-50%)", cursor: "pointer" }}></i>
                                            )}
                                        </div>

                                        {(errorMessage === "Incorrect username or password" || errorMessage === "Password cannot be blank") && (
                                            <div style={{ color: "red", marginTop: "8px" }}>
                                                {errorMessage}
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-3 d-grid gap-2">
                                        {showSpinner ? <><div className="spinner-container"><SpinnerOverlay /></div></> : <>  <button type="submit" className="btn btn-block btn-lg fw-medium auth-form-btn" style={{ backgroundColor: "#337ab7", color: "white" }}>
                                            LOGIN
                                        </button></>}

                                    </div>
                                    <div className="text-center mt-4 fw-light">
                                        Don't have an account? <a href="/signup" className="text-primary">Create</a>
                                    </div>
                                    <div className="text-center mt-4 fw-light">
                                        By signing in you indicate that you have read and agreed to our
                                        <a href="#" className="text-primary"> Terms of Service and Privacy Policy</a>.
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;