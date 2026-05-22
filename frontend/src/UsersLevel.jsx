import React, { useState, useEffect,useContext } from "react";
import Sidebar from "./Sidebar";
import TopPanel from "./TopPanel";
import Footer from "./Footer";
import { useNavigate } from 'react-router-dom';
import { USER_PERMESSION_LIST,AVAILABLE_ROLES } from './constants';
import { update_record } from './helpers';
import GlobalContext from "./context/GlobalContext";
import Swal from 'sweetalert2';
import { handleLogout } from "./Utility";
import apiClient from './services/apiClient';
function UsersLevel() {
    const navigate = useNavigate();
    const {permissible_roles} = useContext(GlobalContext);
    useEffect(() => {
        const loggedIn = localStorage.getItem("loggedIn") === "true";
        if (!loggedIn) {
            navigate("/login");
        }else{
            if(permissible_roles.length>0){
                if(!permissible_roles.includes('manage_users_roles')){
                    handleLogout()
                    navigate("/permission_denied");
                }
            }
        }
    }, [navigate,permissible_roles]);
    const [loading, setLoading] = useState(false);
    const [selectedRole, setSelectedRole] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [availablePermissions, setAvailablePermissions] = useState([]);
    const show_role_permission_error = () => {
        const Toast = Swal.mixin({
            toast: true,
            background: '#d7e7e6',
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
            }
        });

        Toast.fire({
            icon: 'error',
            title: 'You are not authorised to do this action'
        });

    }
    useEffect(() => {
        const fetchRoles = async () => {
            setLoading(true);
            try {
                const docs = await apiClient.post("/api/user_permissions/query", { filters: [] }).then(res => res.data?.data || []);
                const rolesData = docs.map(doc => doc._id);
            } catch (error) {
                console.error('Error fetching roles:', error);
            }
            setLoading(false);
        };

        fetchRoles();
    }, []);

    useEffect(() => {
        const fetchMenuPermissions = async () => {
            setLoading(true);
            try {
                const docs = await apiClient.post("/api/user_permissions/query", {
                    filters: [{ field: "_id", op: "==", value: selectedRole }],
                    limit: 1
                }).then(res => res.data?.data || []);
                
                const menuPermissionsData = docs[0];
                if (menuPermissionsData) {
                    if(menuPermissionsData.permission){
                    setAvailablePermissions(menuPermissionsData.permission);
                    }else{
                        setAvailablePermissions([]);
                    }
                } else {
                
                }
            } catch (error) {
                console.error('Error fetching menu permissions:', error);
            }
            setLoading(false);

        };

        if (selectedRole) {
            fetchMenuPermissions();
        }
    }, [selectedRole]);


    const handleRoleChange = (event) => {
        if(!permissible_roles.includes("manage_users_roles")){
            show_role_permission_error();
            return;
        }
        const newRole = event.target.value;
        setSelectedRole(newRole);
    };

    const handleAvailablePermessionChnage = (value,key) =>{
        if (value) {
            if (!availablePermissions.includes(key)) {
            setAvailablePermissions([...availablePermissions, key]);
            }
        } else {
            setAvailablePermissions(availablePermissions.filter(permission => permission !== key));
        }
    }


    const handleUpdatePermissions = async () => {

        setSubmitting(true);
        update_record('user_permissions', selectedRole, { permission: availablePermissions }).then(() => {
            alert('Permissions updated successfully');
        }).catch((error) => {
            console.error('Error updating permissions:', error);
            alert('Error updating permissions');
        }
        );
        setSubmitting(false);
    };

    return (
        <>
            {loading && (
                <div className="loader-overlay">
                    <div className="">
                        <img style={{ height: "6rem" }} src="images/loader.gif" alt="Loader"></img>
                    </div>
                </div>
            )}

            {submitting && (
                <div className="loader-overlay">
                    <div className="">
                        <img style={{ height: "6rem" }} src="images/loader.gif" alt="Loader"></img>
                    </div>
                </div>
            )}
            <div className="container-scroller">
                <TopPanel />

                <div className="container-fluid page-body-wrapper">
                    <Sidebar />

                    <div class="main-panel">
                        <div class="content-wrapper">
                            <div className="col-md-12 grid-margin stretch-card">
                                <div className="card">
                                    <div className="card-body">
                                        <div class="form-group row">
                                            <div class="col">
                                                <label htmlFor="roleDropdown">Select Role To Update:</label>
                                                <select id="roleDropdown" class="form-control" value={selectedRole} onChange={handleRoleChange}>
                                                    <option value="">Select Role</option>
                                                    {AVAILABLE_ROLES.map((role, index) => (
                                                        <option key={index} value={role}>{role}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div class="col">
                                                {selectedRole === "" ? <></> : <><button type="button" class="btn btn-success" onClick={handleUpdatePermissions} style={{ marginTop: "1.6rem", height: "2.5rem" }} disabled={submitting}>Update Permissions</button></>}
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>

                            {selectedRole === "" ? <>Please select a role</> :<>
                            <div class="col-lg-12 grid-margin stretch-card">
                                <div class="">
                                    <div class="card-body">
                                        <div className="row">
                                            {USER_PERMESSION_LIST.map((permission, index) => (
                                                <div className="col-md-4 grid-margin stretch-card">
                                                <div className="card" style={{ height: "14rem", overflow: "auto" }}>
                                                    <div style={{ display: "flex", justifyContent: "center" }}><span style={{ fontSize: "18px", color: "#288a84", fontWeight: "700", marginTop: "12px" }}>{permission.label}</span></div>
                                                    <div className="card-body">
                                                        <div className="d-sm-flex flex-row text-start align-items-center">
                                                            <div className="ms-sm-3 ms-md-0 ms-xl-3 mt-2 mt-sm-0 mt-md-2 mt-xl-0 form-group" style={{ marginBottom: "0rem" }} >
                                                                {permission.permissions.map((subPermission, index) => (

                                                                <div className="col" key={index}>
                                                                    <input type="checkbox" name="dashboard" checked={availablePermissions?.includes(subPermission.key)} onChange={(e) => handleAvailablePermessionChnage(e.target.checked,subPermission.key)} />
                                                                    <label htmlFor="Dashboard" style={{ marginLeft: '0.5rem' }}>{subPermission.label}</label>
                                                                </div>

                                                                ))}
                                                                

                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                                ))}
                                        </div>
                                    </div>

                                </div>
                            </div>
                            </>}

                        </div>



                        <Footer />

                    </div>

                </div>
            </div>
        </>
    );
}

export default UsersLevel;
