import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import apiClient from "./services/apiClient";
import Swal from 'sweetalert2';

function Signup() {
    const navigate = useNavigate();
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNo, setPhoneNo] = useState("");
    const [role, setRole] = useState("customer");
    const [showSpinner, setShowSpinner] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrorMessage("");
        setShowSpinner(true);

        if (!username || !password || !email || !phoneNo || !role) {
            setErrorMessage("All fields are required.");
            setShowSpinner(false);
            return;
        }

        try {
            await apiClient.post("/api/users/signup", {
                first_name: firstName,
                last_name: lastName,
                username,
                password,
                email,
                phone_no: phoneNo,
                role
            });

            Swal.fire({
                icon: 'success',
                title: 'Signup Successful',
                text: 'You can now login with your credentials.',
                timer: 3000,
                showConfirmButton: false
            });

            setTimeout(() => {
                navigate("/login");
            }, 3000);

        } catch (error) {
            console.error("Error during signup: ", error);
            setErrorMessage(error?.response?.data?.error || "An error occurred during signup. Please try again.");
            setShowSpinner(false);
        }
    };

    const SpinnerOverlay = () => (
        <div className="spinner-container">
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
                                <div style={{ display: "flex", justifyContent: "center" }}> <h4>Create your account</h4></div>
                                <form onSubmit={handleSubmit} className="pt-3">
                                    <div className="form-group">
                                        <div style={{ marginBottom: "8px", fontWeight: "600", fontSize: "14px" }}>First Name</div>
                                        <input
                                            type="text"
                                            className="form-control form-control-lg"
                                            placeholder="First Name"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <div style={{ marginBottom: "8px", fontWeight: "600", fontSize: "14px" }}>Last Name</div>
                                        <input
                                            type="text"
                                            className="form-control form-control-lg"
                                            placeholder="Last Name"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <div style={{ marginBottom: "8px", fontWeight: "600", fontSize: "14px" }}>Username</div>
                                        <input
                                            type="text"
                                            className="form-control form-control-lg"
                                            placeholder="Username"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <div style={{ marginBottom: "8px", fontWeight: "600", fontSize: "14px" }}>Email</div>
                                        <input
                                            type="email"
                                            className="form-control form-control-lg"
                                            placeholder="Email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <div style={{ marginBottom: "8px", fontWeight: "600", fontSize: "14px" }}>Phone Number</div>
                                        <input
                                            type="text"
                                            className="form-control form-control-lg"
                                            placeholder="Phone Number"
                                            value={phoneNo}
                                            onChange={(e) => setPhoneNo(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <div style={{ marginBottom: "8px", fontWeight: "600", fontSize: "14px" }}>Password</div>
                                        <input
                                            type="password"
                                            className="form-control form-control-lg"
                                            placeholder="Password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <div style={{ marginBottom: "8px", fontWeight: "600", fontSize: "14px" }}>Role</div>
                                        <select 
                                            className="form-control form-control-lg"
                                            value={role}
                                            onChange={(e) => setRole(e.target.value)}
                                            style={{ color: "black" }}
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="customer">Customer</option>
                                            <option value="hub manager">Hub Manager</option>
                                            <option value="customer support team lead">Customer Support Team Lead</option>
                                            <option value="customer care agent part lead">Customer Care Agent Part Lead</option>
                                            <option value="accounts team lead">Accounts Team Lead</option>
                                            <option value="junior accounts">Junior Accounts</option>
                                        </select>
                                    </div>
                                    
                                    {errorMessage && (
                                        <div style={{ color: "red", marginBottom: "16px", textAlign: "center" }}>
                                            {errorMessage}
                                        </div>
                                    )}

                                    <div className="mt-3 d-grid gap-2">
                                        {showSpinner ? <SpinnerOverlay /> : (
                                            <button type="submit" className="btn btn-block btn-lg fw-medium auth-form-btn" style={{ backgroundColor: "#337ab7", color: "white" }}>
                                                SIGN UP
                                            </button>
                                        )}
                                    </div>
                                    <div className="text-center mt-4 fw-light">
                                        Already have an account? <Link to="/login" className="text-primary">Login</Link>
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

export default Signup;
