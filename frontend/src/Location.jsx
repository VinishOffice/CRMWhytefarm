import React, { useState, useEffect,useContext } from "react";
import { useNavigate} from 'react-router-dom';
import Sidebar from "./Sidebar";
import Swal from 'sweetalert2'
import { useCookies } from "react-cookie";
import TopPanel from "./TopPanel";
import Footer from "./Footer";
import GlobalContext from "./context/GlobalContext";
import { handleLogout } from './Utility';
import apiClient from './services/apiClient';

function Location() {
    const {permissible_roles} = useContext(GlobalContext);
    const navigate = useNavigate();

    useEffect(() => {
        const loggedIn = localStorage.getItem("loggedIn") === "true";
        if (!loggedIn) {
            navigate("/login");
        }else{
            if(permissible_roles.length>0){
                if(!permissible_roles.includes('locations')){
                    handleLogout()
                    navigate("/permission_denied");
                }
            }
        }
    }, [navigate,permissible_roles]);
    const [cookies] = useCookies(["permissions"]);
    const rolePermissions = cookies.permissions ? cookies.permissions.Location || [] : [];

    const [data, setData] = useState([]);
    const [editID, setEditID] = useState("");
    const [edit, setEdit] = useState(false);
    const initialFormState = { hub_name: '', area: '', subarea: '', visible_on: 'Internal & External', status: '', updated_date: new Date(), created_date: new Date() }
    const [submit, setSubmit] = useState(initialFormState)
    const [hubNames, setHubNames] = useState([]);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);

    const [totalPages, setTotalPages] = useState(0);

    const [searchQuery, setSearchQuery] = useState("");

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { id, value } = e.target
        setSubmit({ ...submit, [id]: value.replace(/[^\w\s.@/:+\-=]/gi, "") })
    }

    const addNew = () => {
        setEdit(false)
        openModal();
        setSubmit({ hub_name: '', area: '', subarea: '', visible_on: 'Internal & External', status: '', updated_date: new Date(), created_date: new Date() });
    }

    const reset = () => {
        setSubmit({ hub_name: '', area: '', subarea: '', visible_on: 'Internal & External', status: '', updated_date: new Date(), created_date: new Date() })
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

    const fetchLocations = async () => {
        try {
            const docs = await apiClient.post("/api/locations_data/query", {
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
            console.error("Error fetching locations:", error);
        }
    };

    useEffect(() => {
        fetchLocations();
    }, []);



    const changeStatusForm = (data, id) => {
        setEdit(true)
        setEditID(id)
        setSubmit({ id: id, hub_name: data.hub_name, area: data.area, subarea: data.subarea, visible_on: data.visible_on, status: data.status, updated_date: new Date(), created_date: new Date() });
        openModal();
    }

    const openModal = () => {

        window.modelshow();
    }

    const closeModal = () => {
        window.modalHide();
    }

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };


    const handleSubmit = (e) => {
        e.preventDefault()
        setLoading(true);


        if (edit) {

            apiClient.put(`/api/locations_data/${editID}`, {
                'hub_name': submit.hub_name,
                'area': submit.area,
                'subarea': submit.subarea,
                'visible_on': submit.visible_on,
                'status': "1",
                'updated_date': new Date(),
            }).then(() => {
                fetchLocations();

                const Toast = Swal.mixin({
                    toast: true,
                    background: '#69aba6',
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                    didOpen: (toast) => {
                        toast.addEventListener('mouseenter', Swal.stopTimer)
                        toast.addEventListener('mouseleave', Swal.resumeTimer)
                    }
                })

                Toast.fire({
                    icon: 'success',
                    title: 'Location Updated Successfully'
                })
                closeModal();
                setLoading(false);

                setSubmit({ hub_name: '', area: '', subarea: '', visible_on: 'Internal & External', status: '', updated_date: new Date(), created_date: new Date() })
            })
            // setLoading(false);
        } else {
            apiClient.post("/api/locations_data/add", {
                'hub_name': submit.hub_name,
                'area': submit.area,
                'subarea': submit.subarea,
                'visible_on': submit.visible_on,
                'status': "1",
                'updated_date': new Date(),
                'created_date': new Date(),
            }).then(() => {
                fetchLocations();
                reset();
                // setshow(true)

                const Toast = Swal.mixin({
                    toast: true,
                    background: '#69aba6',
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                    didOpen: (toast) => {
                        toast.addEventListener('mouseenter', Swal.stopTimer)
                        toast.addEventListener('mouseleave', Swal.resumeTimer)
                    }
                })
                closeModal();
                setLoading(false);


                Toast.fire({
                    icon: 'success',
                    title: 'Location Added'
                })
            })
        }


    }

    const deleteData = (id) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                setLoading(true);
                apiClient.delete(`/api/locations_data/${id}`).then(() => {
                    fetchLocations();
                    setSubmit({ hub_name: '', area: '', subarea: '', visible_on: 'Internal & External', status: '', updated_date: new Date(), created_date: new Date() })
                    closeModal();
                    setLoading(false);
                    Swal.fire(
                        'Deleted!',
                        'Data has been deleted.',
                        'success'
                    )
                })

            }
        })

    }

    // Filter data based on search query
    const filteredDataLocation = data.filter(({ data }) => {
        // Filter based on search query
        return (
            data.hub_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            data.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
            data.subarea.toLowerCase().includes(searchQuery.toLowerCase())
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



    return (
        <>
            {loading && ( // Render loader when loading state is true
                <div className="loader-overlay">
                    <div className="">
                        <img style={{
                            height: "6rem"
                        }} src="images/loader.gif" alt="loading..."></img>
                    </div>
                </div>
            )}
            <div className="container-scroller">
                <TopPanel />

                <div className="container-fluid page-body-wrapper">


                    <Sidebar />

                    <div className="main-panel">
                        <div className="content-wrapper">

                            <div className="col-lg-12 grid-margin stretch-card">
                                <div className="card">
                                    <div className="card-body">
                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            <h4 className="card-title">Locations</h4>
                                            <p className="card-description">
                                                {permissible_roles.includes('add_location') ? <><button type="button" className="btn btn-success btn-rounded btn-sm" onClick={() => addNew()}>Add Locations</button></> : <><button type="button" className="btn btn-success btn-rounded btn-sm" onClick={() => rolePermission()}>Add Locations</button></>}

                                            </p>
                                        </div>
                                        <input
                                            style={{
                                                border: "1px solid grey",
                                                padding: "0px 4px 0px 1rem",
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
                                        <div className="table-responsive">
                                            <table className="table table-striped">
                                                <thead>
                                                    <tr>
                                                        <th>
                                                            Sr No.
                                                        </th>
                                                        <th>
                                                            Hub Name
                                                        </th>
                                                        <th>
                                                            Area
                                                        </th>
                                                        <th>
                                                            Subarea
                                                        </th>

                                                        <th>
                                                            Visible On
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
                                                                <td>{data.hub_name}</td>
                                                                <td>{data.area}</td>
                                                                <td>{data.subarea}</td>
                                                                <td>{data.visible_on}</td>
                                                                <td>
                                                                    {permissible_roles.includes('edit_location') ? <>
                                                                        <button style={{ marginRight: "1rem", padding: "0.2rem 0.85rem" }} onClick={() => changeStatusForm(data, id)} className="btn btn-dark btn-sm">
                                                                            <i className="menu-icon mdi mdi-pencil" style={{ color: "white" }}></i>
                                                                        </button></> : <>
                                                                        <button style={{ marginRight: "1rem", padding: "0.2rem 0.85rem" }} onClick={() => rolePermission()} className="btn btn-dark btn-sm">
                                                                            <i className="menu-icon mdi mdi-pencil" style={{ color: "white" }}></i>
                                                                        </button>
                                                                    </>}

                                                                    {permissible_roles.includes('delete_location') ? <>
                                                                        <button style={{ marginRight: "1rem", padding: "0.2rem 0.85rem" }} className="btn btn-dark btn-sm" onClick={() => deleteData(id)}>
                                                                            <i className="menu-icon mdi mdi-delete" style={{ color: "white" }}></i>
                                                                        </button></> : <>
                                                                        <button style={{ marginRight: "1rem", padding: "0.2rem 0.85rem" }} className="btn btn-dark btn-sm" onClick={() => rolePermission()} >
                                                                            <i className="menu-icon mdi mdi-delete" style={{ color: "white" }}></i>
                                                                        </button>
                                                                    </>}

                                                                </td>
                                                            </tr>
                                                        );
                                                    })}




                                                </tbody>
                                            </table>

                                        </div>

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


                        </div>

                        <Footer />

                    </div>

                </div>

            </div>

            <div className="modal fade" id="exampleModal-2" tabIndex="-1" role="dialog"
                aria-labelledby="exampleModalLabel-2" aria-hidden="true">
                <div className="modal-dialog" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="exampleModalLabel-2">Add Location</h5>
                            <button type="button" className="close" data-bs-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <form className="forms-sample" onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>Hub Name</label>
                                    <select className="form-select" onChange={handleChange} id="hub_name" value={submit.hub_name} required>
                                        <option>Select Hub Name</option>
                                        {hubNames.map((HubName) => (
                                            <option key={HubName} value={HubName}>
                                                {HubName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label >Area</label>
                                    <input type="text" className="form-control" onChange={handleChange} id="area" value={submit.area} required />
                                </div>
                                <div className="form-group">
                                    <label >Sub Area</label>
                                    <input type="text" className="form-control" onChange={handleChange} id="subarea" value={submit.subarea} required />
                                </div>

                                <div className="form-group">
                                    <label >Visible On</label>
                                    <select className="form-select" onChange={handleChange} id="visible_on" value={submit.visible_on || "Internal & External"}>
                                        <option>Select Visible On</option>
                                        <option value="Internal & External">Internal & External</option>
                                        <option value="Internal">Internal</option>
                                    </select>
                                </div>
                                <div className="modal-footer">
                                    <button type="submit" value="submit" className="btn btn-success">Submit</button>
                                    <button type="button" className="btn btn-light" data-bs-dismiss="modal">Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Location