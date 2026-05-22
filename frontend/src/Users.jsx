import React, { useState, useEffect, useRef,useContext } from "react";
import { useNavigate, Link, useParams } from 'react-router-dom';
import Sidebar from "./Sidebar";
import Swal from 'sweetalert2'
import TopPanel from "./TopPanel";
import { uploadFile } from './services/uploadService';
import Footer from "./Footer";
import GlobalContext from "./context/GlobalContext";
import { handleLogout } from "./Utility";
import { AVAILABLE_ROLES,AVAILABLE_HUBS } from './constants';
import apiClient from './services/apiClient';
function Users() {
    const navigate = useNavigate()

    const {permissible_roles} = useContext(GlobalContext);

   useEffect(() => {
    const loggedIn = localStorage.getItem("loggedIn") === "true";
    if (!loggedIn) {
        navigate("/login");
    } else {
        if (permissible_roles === null) return; // wait until roles loaded

        if (permissible_roles.length > 0) {
            if (!permissible_roles.includes("view_users")) {
                handleLogout();
                navigate("/permission_denied");
            }
        }
    }
}, [navigate, permissible_roles]);


    const [timeOfDay, setTimeOfDay] = useState('');
    const [data, setData] = useState([]);
    const [editID, setEditID] = useState("");
    const [edit, setEdit] = useState(false);
    const [roles, setRoles] = useState([]);

    const initialFormState = {
        user_id: "",
        first_name: "",
        last_name: "",
        email: "",
        role: "",
        username: "",
        password: "",
        phone_no: "",
        status: true,
        user_image: null,
        created_date: new Date(),
        updated_date: new Date(),
        hub_name: ""
    }
    const [submit, setSubmit] = useState(initialFormState)
    const [hubNames, setHubNames] = useState([]);


    const fileInputRef = useRef(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    const [totalPages, setTotalPages] = useState(0);

    const [searchQuery, setSearchQuery] = useState("");

    const [loading, setLoading] = useState(false);
    const rolePermission = () => {
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
                setRoles(
                    docs.map((doc) => ({
                        id: doc._id,
                        data: doc,
                    }))
                );

            } catch (error) {
                console.error('Error fetching roles:', error);
            }
            setLoading(false);
        };

        fetchRoles();
    }, []);

    const fetchUsers = async () => {
        try {
            const docs = await apiClient.post("/api/users/query", {
                filters: [],
                sort: [{ field: "updated_date", direction: "desc" }]
            }).then(res => res.data?.data || []);
            setData(
                docs.map((doc) => ({
                    id: doc._id,
                    data: doc,
                }))
            );
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);


    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        if (type === "checkbox") {
            setSubmit(prevState => ({
                ...prevState,
                [name]: checked
            }));
        } else if (type === "file") {
            const file = files[0];
            setSubmit(prevState => ({
                ...prevState,
                [name]: file
            }));
        } else {
            setSubmit(prevState => ({
                ...prevState,
                [name]: value
            }));
        }
    };


    const addNew = () => {
        fileInputRef.current.value = '';
        setEdit(false)
        openModal();
        setSubmit({
            user_id: "",
            first_name: "",
            last_name: "",
            email: "",
            role: "",
            username: "",
            password: "",
            phone_no: "",
            status: true,
            user_image: null,
            created_date: new Date(),
            updated_date: new Date(),
        });
    }



    useEffect(() => {
        const fetchHubNames = async () => {
            try {
                const docs = await apiClient.post("/api/hubs_data/query", { filters: [] }).then(res => res.data?.data || []);
                setHubNames(
                    docs.map((doc) => doc.hub_name)
                );
            } catch (error) {
                console.error("Error fetching hubs:", error);
            }
        };
        fetchHubNames();
    }, []);

    useEffect(() => {
        const getCurrentTimeOfDay = () => {
            const currentTime = new Date().getHours();
            if (currentTime < 12) {
                setTimeOfDay('Good Morning');
            } else if (currentTime >= 12 && currentTime < 18) {
                setTimeOfDay('Good Afternoon');
            } else {
                setTimeOfDay('Good Evening');
            }
        };

        getCurrentTimeOfDay();
    }, []);

    function generateUniqueId() {
        const now = new Date();
        const timestamp = now.getTime();
        const random4Digits = Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, "0");
        const customerId =
            (timestamp % 10000).toString().padStart(4, "0") + random4Digits;

        return customerId;
    }

    const changeStatusForm = (data, id) => {
        setEdit(true)
        setEditID(id)
        setSubmit({
            id: id, user_id: data.user_id,
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            role: data.role,
            username: data.username,
            password: data.password,
            phone_no: data.phone_no,
            status: true,
            user_image: null,
            created_date: new Date(),
            updated_date: new Date(),
        });
        openModal();
    }

    const openModal = () => {
        // alert("ooo")
        window.modelshow();
    }

    const closeModal = () => {
        window.modalHide();
    }

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleSubmit = async (e) => {
        const uid = generateUniqueId();
        e.preventDefault()

        if (edit) {
            if (submit.user_image && typeof submit.user_image !== "string") {
                const { url } = await uploadFile(
                    submit.user_image,
                    `users/${submit.user_image.name}`
                );

                await apiClient.put(`/api/users/${editID}`, {
                    ...submit,
                    user_image: url
                });

                fetchUsers();
                setLoading(false);
                setSubmit({
                    user_id: "",
                    first_name: "",
                    last_name: "",
                    email: "",
                    role: "",
                    username: "",
                    password: "",
                    phone_no: "",
                    status: true,
                    user_image: null,
                    created_date: new Date(),
                    updated_date: new Date(),
                });
                closeModal();
            } else {
                // No new image selected, update user data without changing the image URL
                apiClient.put(`/api/users/${editID}`, submit)
                    .then(() => {
                        // Reset the form after successful submission
                        fetchUsers();
                        setLoading(false);
                        setSubmit({
                            user_id: "",
                            first_name: "",
                            last_name: "",
                            email: "",
                            role: "",
                            username: "",
                            password: "",
                            phone_no: "",
                            status: true,
                            user_image: null,
                            created_date: new Date(),
                            updated_date: new Date(),
                        });
                        closeModal()
                    })
                    .catch(error => {
                        console.error("Error updating user: ", error);
                    });
            }

        } else {
            if (submit.user_image) {
                const { url } = await uploadFile(
                    submit.user_image,
                    `users/${submit.user_image.name}`
                );

                await apiClient.post("/api/users/add", {
                    ...submit,
                    user_id: uid,
                    user_image: url
                });

                fetchUsers();
                setLoading(false);
                setSubmit({
                    user_id: "",
                    first_name: "",
                    last_name: "",
                    email: "",
                    role: "",
                    username: "",
                    password: "",
                    phone_no: "",
                    status: true,
                    user_image: null,
                    created_date: new Date(),
                    updated_date: new Date(),
                });
                closeModal();

            } else {
                apiClient.post("/api/users/add", { ...submit, user_id: uid })
                    .then(() => {
                        fetchUsers();
                        setLoading(false);
                        // Reset the form after successful submission
                        setSubmit({
                            user_id: "",
                            first_name: "",
                            last_name: "",
                            email: "",
                            role: "",
                            username: "",
                            password: "",
                            phone_no: "",
                            status: true,
                            user_image: null,
                            created_date: new Date(),
                            updated_date: new Date(),
                        });
                        closeModal()
                    })
                    .catch(error => {
                        console.error("Error adding user: ", error);
                    });

            }

        }


    }

  
    const filteredDataLocation = data.filter(({ data }) => {
        // Filter based on search query
        const firstName = data?.first_name || "";
        const lastName = data?.last_name || "";
        return (
            firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lastName.toLowerCase().includes(searchQuery.toLowerCase())
        );
    });

    // Determine the range of page numbers to display
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredDataLocation.slice(indexOfFirstItem, indexOfLastItem);


    // Logic for Pagination
    // const indexOfLastItem = currentPage * itemsPerPage;
    // const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    // const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    useEffect(() => {
        const total = Math.ceil(data.length / itemsPerPage);
        setTotalPages(total);
    }, [data.length, itemsPerPage]);


    const renderPageButtons = () => {
        const pageButtons = [];
        // Determine the range of page numbers to display
        let startPage = Math.max(1, currentPage - 5);
        let endPage = Math.min(totalPages, startPage + 9);

        // If the total number of pages is less than 10, adjust the endPage
        if (totalPages <= 10) {
            endPage = totalPages;
        } else {
            // If the current page is near the start, display the first 10 pages
            if (currentPage <= 5) {
                startPage = 1;
                endPage = 10;
            }
            // If the current page is near the end, display the last 10 pages
            else if (currentPage >= totalPages - 4) {
                endPage = totalPages;
                startPage = endPage - 9;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            pageButtons.push(
                <li key={i} className={`page-item ${currentPage === i ? 'active' : ''}`}>
                    <button onClick={() => paginate(i)} className="page-link" style={{ color: "black" }}>{i}</button>
                </li>
            );
        }
        return pageButtons;
    };




    return (
        <>
            {loading && ( // Render loader when loading state is true
                <div className="loader-overlay">
                    <div className="">
                        <img style={{
                            height: "6rem"
                        }} src="images/loader.gif" alt="loader"></img>
                    </div>
                </div>
            )}
            <div class="container-scroller">
                <TopPanel />

                <div class="container-fluid page-body-wrapper">


                    <Sidebar />

                    <div class="main-panel">
                        <div class="content-wrapper">


                            <div class="col-md-6 col-xl-12 grid-margin stretch-card">
                                <div class="card">
                                    <div class="card-body">
                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            <h4 class="card-title">Manage Users & Roles</h4>
                                            <p class="card-description">
                                                {permissible_roles.includes("add_users") ? <button type="button" class="btn btn-success btn-rounded btn-sm" onClick={() => addNew()}>Add User</button> : <button type="button" class="btn btn-success btn-rounded btn-sm" onClick={rolePermission}>Add User</button>}
                                                <Link to="/users_level"><button type="button" style={{ marginLeft: "1rem" }} class="btn btn-success btn-rounded btn-sm">Manage Roles</button></Link>
                                            </p>
                                        </div>
                                        <div class="home-tab">
                                            <div class="d-sm-flex align-items-center justify-content-between border-bottom">
                                                <ul class="nav nav-tabs" role="tablist">
                                                    <li class="nav-item">
                                                        <a class="nav-link active ps-0" id="home-tab" data-bs-toggle="tab" href="#overview" role="tab"
                                                            aria-controls="overview" aria-selected="true">Users</a>
                                                    </li>
                                                    <li class="nav-item">
                                                        <a class="nav-link" id="profile-tab" data-bs-toggle="tab" href="#audiences" role="tab"
                                                            aria-selected="false">Roles</a>
                                                    </li>

                                                </ul>
                                            </div>
                                            <div class="tab-content tab-content-basic">
                                                <div class="tab-pane fade show active" id="overview" role="tabpanel" aria-labelledby="home-tab">
                                                    <div class="media">
                                                        <div class="card-body">
                                                            <input
                                                                style={{
                                                                    border: "1px solid grey",
                                                                    padding: "0px 4px 0px 1rem;",
                                                                    borderRadius: "1rem",
                                                                    marginTop: "3px",
                                                                    marginBottom: "1rem",
                                                                    paddingLeft: "1rem",
                                                                    height: "32px",
                                                                    paddingBottom: "0px"
                                                                }}
                                                                type="text"
                                                                placeholder="Search here"
                                                                value={searchQuery}
                                                                onChange={handleSearchChange}
                                                            />
                                                            <div class="table-responsive">
                                                                <table class="table table-striped">
                                                                    <thead>
                                                                        <tr>
                                                                            <th>
                                                                                Sr No.
                                                                            </th>
                                                                            <th>
                                                                                First Name
                                                                            </th>
                                                                            <th>
                                                                                Last Name
                                                                            </th>
                                                                            <th>
                                                                                Phone No
                                                                            </th>
                                                                            <th>
                                                                                Email
                                                                            </th>
                                                                            <th>
                                                                                Action
                                                                            </th>

                                                                        </tr>

                                                                    </thead>
                                                                    <tbody>

                                                                        {currentItems.map(({ id, data }, index) => {
                                                                            // Calculate the correct index based on the current page
                                                                            const itemIndex = indexOfFirstItem + index + 1;
                                                                            return (
                                                                                <tr key={id}>
                                                                                    <td>{itemIndex}</td>
                                                                                    <td>{data.first_name}</td>
                                                                                    <td>{data.last_name}</td>
                                                                                    <td>{data.phone_no}</td>
                                                                                    <td>{data.email}</td>
                                                                                    <td>
                                                                                        <button style={{ marginRight: "1rem", padding: "0.2rem 0.85rem" }} onClick={() => changeStatusForm(data, id)} className="btn btn-dark btn-sm">
                                                                                            <i className="menu-icon mdi mdi-pencil" style={{ color: "white" }}></i>
                                                                                        </button>

                                                                                    </td>
                                                                                </tr>
                                                                            );
                                                                        })}

                                                                    </tbody>
                                                                </table>

                                                            </div>
                                                            {/* Pagination */}
                                                            <ul className="pagination">
                                                                <li className="page-item">
                                                                    <button onClick={() => paginate(currentPage - 1)} className="page-link" disabled={currentPage === 1}>Previous</button>
                                                                </li>
                                                                {renderPageButtons()}
                                                                <li className="page-item">
                                                                    <button onClick={() => paginate(currentPage + 1)} className="page-link" disabled={currentPage === totalPages}>Next</button>
                                                                </li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="tab-pane fade" id="audiences" role="tabpanel" aria-labelledby="profile-tab">
                                                    <div class="media">
                                                        <div class="card-body">

                                                            <div class="table-responsive">
                                                                <table class="table table-striped">
                                                                    <thead>

                                                                        <tr>
                                                                            <th>
                                                                                Sr No.
                                                                            </th>
                                                                            <th>
                                                                                User Role
                                                                            </th>
                                                                            <th>
                                                                                Role Type
                                                                            </th>
                                                                            {/* <th>
                                                                                Action
                                                                            </th> */}

                                                                        </tr>

                                                                    </thead>
                                                              
                                                                </table>

                                                            </div>
                                                            {/* Pagination */}
                                                            <ul className="pagination">
                                                                <li className="page-item">
                                                                    <button onClick={() => paginate(currentPage - 1)} className="page-link" disabled={currentPage === 1}>Previous</button>
                                                                </li>
                                                                {renderPageButtons()}
                                                                <li className="page-item">
                                                                    <button onClick={() => paginate(currentPage + 1)} className="page-link" disabled={currentPage === totalPages}>Next</button>
                                                                </li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="tab-pane fade" id="demographics" role="tabpanel" aria-labelledby="contact-tab">
                                                    <h4>Contact us </h4>
                                                    <p>
                                                        Feel free to contact us if you have any questions!
                                                    </p>
                                                    <p>
                                                        <i class="ti-headphone-alt text-info"></i>
                                                        +123456789
                                                    </p>
                                                    <p>
                                                        <i class="ti-email text-success"></i>
                                                        contactus@example.com
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>


                        </div>

                        <Footer />

                    </div>

                </div>

            </div>

            <div class="modal fade" id="exampleModal-2" tabindex="-1" role="dialog"
                aria-labelledby="exampleModalLabel-2" aria-hidden="true">
                <div class="modal-dialog modal-lg" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="exampleModalLabel-2">Add User</h5>
                            <button type="button" class="close" data-bs-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            <form class="forms-sample" onSubmit={handleSubmit}>
                                <div class="form-group row">
                                    <div class="col">
                                        <label>User Image:</label>
                                        <input
                                            className="form-control"
                                            type="file"
                                            ref={fileInputRef}
                                            style={{ padding: "10px" }}
                                            name="user_image"
                                            onChange={handleChange}

                                        />
                                    </div>
                                    <div class="col">
                                        <label>First Name:</label>
                                        <input class="form-control" type="text" name="first_name" value={submit.first_name} onChange={handleChange} required />
                                    </div>
                                    <div class="col">
                                        <label>Last Name:</label>
                                        <input class="form-control" type="text" name="last_name" value={submit.last_name} onChange={handleChange} required />
                                    </div>

                                </div>
                                <div class="form-group row">
                                    <div class="col">
                                        <label>Email:</label>
                                        <input class="form-control" type="email" name="email" value={submit.email} onChange={handleChange} required />
                                    </div>
                                    <div class="col">
                                        <label>Role:</label>
                                        <select
                                            name="role"
                                            value={submit.role}
                                            onChange={handleChange}
                                            required
                                            class="form-control"
                                        >
                                            {AVAILABLE_ROLES.map((roles, index) => (
                                                <option value={roles} key={index}>
                                                    {roles}
                                                </option>
                                            ))}
                                        </select>


                                    </div>
                                    {submit.role === "Hub Manager" ? <div class="col">
                                        <label>Hub Name:</label>
                                        <select
                                            name="hub_name"
                                            value={submit.hub_name}
                                            onChange={handleChange}
                                            required
                                            class="form-control"
                                        >
                                            {AVAILABLE_HUBS.map((hub, index) => (
                                                <option value={hub} key={index}>
                                                    {hub}
                                                </option>
                                            ))}
                                        </select>


                                    </div> : <></>}
                                    <div class="col">
                                        <label>Username:</label>
                                        <input class="form-control" type="text" name="username" value={submit.username} onChange={handleChange} required />
                                    </div>

                                </div>

                                <div class="form-group row">
                                    <div class="col">
                                        <label>Password:</label>
                                        <input class="form-control" type="text" name="password" value={submit.password} onChange={handleChange} required />
                                    </div>
                                    <div class="col">
                                        <label>Phone No:</label>
                                        <input class="form-control" type="number" name="phone_no" value={submit.phone_no} onChange={handleChange} required />
                                    </div>


                                </div>
                                <div class="modal-footer">
                                    <button type="submit" value="submit" class="btn btn-success">Submit</button>
                                    <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Users
