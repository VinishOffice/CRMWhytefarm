import React, { useState, useEffect,useContext } from "react";
import { useNavigate } from 'react-router-dom';
import Sidebar from "./Sidebar";
import Swal from 'sweetalert2'
import Select from 'react-select';
import { useCookies } from "react-cookie";
import TopPanel from "./TopPanel";
import Footer from "./Footer";
import { handleLogout } from "./Utility";
import GlobalContext from "./context/GlobalContext";
import apiClient from './services/apiClient';


function RoutesData() {
    const navigate = useNavigate();
    const { permissible_roles } = useContext(GlobalContext);
    useEffect(() => {
        const loggedIn = localStorage.getItem("loggedIn") === "true";
        if (!loggedIn) {
            navigate("/login");
        }else{
            if(permissible_roles.length>0){
                if(!permissible_roles.includes('routes')){
                    handleLogout()
                    navigate("/permission_denied");
                }
            }
        }
    }, [navigate,permissible_roles]);
    useCookies(["permissions"]);
    const [data, setData] = useState([]);
    const [editID, setEditID] = useState("");
    const [edit, setEdit] = useState(false);
    const initialFormState = { route: '', hub_name: '', locations: [], status: '', updated_date: new Date(), created_date: new Date() }
    const [submit, setSubmit] = useState(initialFormState)
    const [hubOptions, setHubOptions] = useState([]);
    const [selectedHub, setSelectedHub] = useState(null); // Set initial state to null
    const [locationOptions, setLocationOptions] = useState([]);
    const [selectedHubName, setSelectedHubName] = useState('');
    const [selectedMapOption, setSelectedMapOption] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");

    const [loading, setLoading] = useState(false);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };




    useEffect(() => {
        const fetchRoutes = async () => {
            try {
                const docs = await apiClient.post("/api/routes_data/query", {
                    filters: [],
                    sort: [{ field: "route", direction: "asc" }]
                }).then(res => res.data?.data || []);
                
                setData(docs.map(doc => ({ id: doc._id || doc.id, data: doc })));
            } catch (error) {
                console.error("Error fetching routes:", error);
            }
        };
        fetchRoutes();
    }, []);



    const handleChange = (e) => {
        const { id, value } = e.target
        setSubmit({ ...submit, [id]: value.replace(/[^\w\s.@/:+\-=]/gi, "") })
    }



    useEffect(() => {
        const fetchHubNames = async () => {
            try {
                const docs = await apiClient.post('/api/hubs_data/query', { filters: [] })
                    .then(res => res.data?.data || []);
                const hubNames = docs.map(doc => doc.hub_name);
                const uniqueHubNames = [...new Set(hubNames)];
                const options = uniqueHubNames.map(name => ({ value: name, label: name }));
                setHubOptions(options);
            } catch (error) {
                console.error('Error fetching hub names:', error);
            }
        };

        fetchHubNames();
    }, []);

    // useEffect(() => {
    //     const fetchHubNames = async () => {
    //         try {
    //             const snapshot = await collection('locations_data').get();
    //             const hubNames = snapshot.docs.map(doc => doc.data().hub_name);
    //             const uniqueHubNames = [...new Set(hubNames)];
    //             const options = uniqueHubNames.map(name => ({ value: name, label: name }));
    //             setHubOptions(options);
    //         } catch (error) {
    //             console.error('Error fetching hub names:', error);
    //         }
    //     };

    //     fetchHubNames();
    // }, []);


    const fetchLocations = React.useCallback(async () => {
        try {
            if (!selectedHub) {
                setLocationOptions([]);
                return;
            }
            const docs = await apiClient.post('/api/locations_data/query', {
                filters: [{ field: 'hub_name', op: '==', value: selectedHub }]
            }).then(res => res.data?.data || []);
            
            const locations = docs.map(data => {
                return { value: `${data.area}, ${data.subarea}`, label: `${data.area}, ${data.subarea}` };
            });
            setLocationOptions(locations);
            setSubmit({ ...submit, locations: [] }); // Clear selected locations when hub changes
        } catch (error) {
            console.error('Error fetching locations:', error);
        }
    }, [selectedHub, submit]);

    useEffect(() => {
        fetchLocations();
    }, [fetchLocations, selectedHub]);


    // const handleHubChange = (selectedOption) => {
    //     setSelectedHubName(selectedOption ? selectedOption.value : null);
    //     setSelectedHub(selectedOption ? selectedOption.value : null);
    //     setSelectedMapOption(null);// Clear selected locations when hub changes
    // };
    const handleHubChange = (selectedOption) => {
        if (selectedOption) {
            const selectedValue = selectedOption.value;
            setSelectedHubName(selectedValue);
            setSelectedHub(selectedValue);
            setSelectedMapOption(null); // Clear selected locations when hub changes
        } else {
            // Handle case when selectedOption is null (no option selected)
            setSelectedHubName(null);
            setSelectedHub(null);
            setSelectedMapOption(null); // Clear selected locations when hub changes
        }
    };


    // const addNew = () => {
    //     setSelectedHub(null); // Clear selected Hub Name
    //     setSelectedMapOption([]); // Clear selected Map Locations
    //     setEdit(false)
    //     openModal();
    //     setSubmit({ route: '', hub_name: '', locations: [], status: '', updated_date: new Date(), created_date: new Date() });
    // }

    const addNew = () => {
        setSelectedHub(null); // Clear selected Hub Name
        setSelectedMapOption([]); // Clear selected Map Locations
        setEdit(false)
        openModal();
        setSubmit({ route: '', hub_name: '', locations: [], status: '', updated_date: new Date(), created_date: new Date() });
    }

    const reset = () => {
        setSubmit({ route: '', hub_name: '', locations: [], status: '', updated_date: new Date(), created_date: new Date() })
    }


    // const changeStatusForm = (data, id) => {
    //     setEdit(true)
    //     setEditID(id)
    //     setSubmit({ id: id, route: data.route, hub_name: data.hub_name, locations: data.locations, status: data.status, updated_date: new Date(), created_date: new Date() });
    //     openModal();
    // }

    const changeStatusForm = (data, id) => {
        setEdit(true);
        setEditID(id);
        setSelectedHub(data.hub_name)
        // setSelectedHubName(data.hub_name)
        setSelectedMapOption(data.locations.map(location => ({ value: location, label: location })))
        setSubmit({
            id: id,
            route: data.route,
            hub_name: data.hub_name,
            // locations: data.locations.map(location => ({ value: location, label: location })), // Format locations properly
            locations: data.locations, // Format locations properly
            status: data.status,
            updated_date: new Date(),
            created_date: new Date()
        });
        openModal();
    };


    const openModal = () => {
        // alert("ooo")
        window.modelshow();
    }

    const closeModal = () => {
        window.modalHide();
    }




    const checkRouteExists = async (route) => {
        try {
            const docs = await apiClient.post("/api/routes_data/query", {
                filters: [{ field: 'route', op: '==', value: route }],
                limit: 1
            }).then(res => res.data?.data || []);
            return docs.length > 0;
        } catch (error) {
            console.error('Error checking route existence: ', error);
            return false;
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        // Extract selected hub and locations
        // const selectedLocations = submit.locations.map(location => location.value);
        const selectedLocations = selectedMapOption.map(location => location.value);

        // Check if any required field is empty
        if (!submit.route || !selectedHub || selectedLocations.length === 0) {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Please fill out all required fields!',
            });
            return;
        }




        if (edit) {
            setLoading(true);
            // Update existing record
            apiClient.put(`/api/routes_data/${editID}`, {
                'route': submit.route,
                'hub_name': selectedHubName,
                'locations': selectedLocations,
                'status': "1",
                'updated_date': new Date(),
            }).then(() => {
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
                    title: 'Route Updated Successfully'
                })
                closeModal();
                setLoading(false);

                // Reset form state after successful update
                setSubmit(initialFormState);
                setSelectedHub(null);
                setSelectedMapOption(null);
                setLocationOptions([]);
            }).catch(error => {
                console.error('Error updating document: ', error);
            });
        } else {
            // Check if route exists in the database
            const routeExists = await checkRouteExists(submit.route);

            if (routeExists) {
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'Route already exists in the database!',
                });
                return;
            }
            setLoading(true);
            // Add new record
            apiClient.post("/api/routes_data/add", {
                'route': submit.route,
                'hub_name': selectedHubName,
                'locations': selectedLocations,
                'status': "1",
                'updated_date': new Date(),
                'created_date': new Date(),
            }).then(() => {
                reset();
                setSelectedHubName('')
                setSelectedMapOption(null);
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
                    title: 'Route Added'
                })
            }).catch(error => {
                console.error('Error adding document: ', error);
            });
        }
    };

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
            setLoading(true);
            if (result.isConfirmed) {
                apiClient.delete(`/api/routes_data/${id}`).then(() => {

                    setSubmit(initialFormState)
                    closeModal();
                    setLoading(false);
                    Swal.fire(
                        'Deleted!',
                        'Data has been deleted.',
                        'success'
                    )
                    // Refresh data
                    const fetchRoutes = async () => {
                        const docs = await apiClient.post("/api/routes_data/query", { filters: [] })
                            .then(res => res.data?.data || []);
                        setData(docs.map(doc => ({ id: doc._id || doc.id, data: doc })));
                    };
                    fetchRoutes();
                })

            }
        })

    }



    // Filter data based on search query
    const filteredDataLocation = data.filter(({ data }) => {
        // Filter based on search query
        return (
            data.hub_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            data.route.toLowerCase().includes(searchQuery.toLowerCase()) ||
            data.locations.some(location => location.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    });

    // Determine the range of page numbers to display
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredDataLocation.slice(indexOfFirstItem, indexOfLastItem);


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
                                            <h4 className="card-title">Routes</h4>

                                            <p className="card-description">
                                                {permissible_roles.includes('add_route') ? <> <button type="button" className="btn btn-success btn-rounded btn-sm" onClick={() => addNew()}>Create Routes</button></> : <> <button type="button" className="btn btn-success btn-rounded btn-sm" onClick={() => rolePermission()}>Create Routes</button></>}

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
                                                            Routes
                                                        </th>

                                                        <th>
                                                            Hub Name
                                                        </th>
                                                        <th>
                                                            Location
                                                        </th>

                                                        <th>
                                                            Action
                                                        </th>

                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {currentItems.map(({ id, data }, index) => {
                                                        const itemIndex = indexOfFirstItem + index + 1;
                                                        return (
                                                            <tr key={id}>
                                                                <td>{itemIndex}</td>
                                                                <td style={{ width: "10%" }}>
                                                                    {data.route}
                                                                </td>
                                                                <td>
                                                                    {data.hub_name}
                                                                </td>
                                                                <td>
                                                                    <div style={{ display: "flex", flexWrap: "wrap" }}>
                                                                        {data.locations.map((location, index) => (
                                                                            <label key={index} className="badge badge-success mr-2" style={{ color: "black", marginRight: "0.5rem", marginBottom: "0.5rem", marginTop: "0.5rem", fontSize: "60%", fontWeight: "700" }}>{location}</label>
                                                                        ))}
                                                                    </div>
                                                                </td>


                                                                <td>
                                                                    {permissible_roles.includes('edit_route') ? <> <button style={{ marginRight: "1rem", padding: "0.2rem 0.85rem" }} onClick={() => changeStatusForm(data, id)} className="btn btn-dark btn-sm"><i className="menu-icon mdi mdi-pencil" style={{ color: "white" }}></i></button></> : <> <button style={{ marginRight: "1rem", padding: "0.2rem 0.85rem" }} onClick={() => rolePermission()} className="btn btn-dark btn-sm"><i className="menu-icon mdi mdi-pencil" style={{ color: "white" }}></i></button></>}
                                                                    {permissible_roles.includes('delete_route') ? <><button style={{ marginRight: "1rem", padding: "0.2rem 0.85rem" }} className="btn btn-dark btn-sm" onClick={() => deleteData(id)}><i className="menu-icon mdi mdi-delete" style={{ color: "white" }}></i></button></> : <><button style={{ marginRight: "1rem", padding: "0.2rem 0.85rem" }} className="btn btn-dark btn-sm" onClick={() => rolePermission()}><i className="menu-icon mdi mdi-delete" style={{ color: "white" }}></i></button></>}

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

                            <div className="modal fade" id="exampleModal-2" tabIndex="-1" role="dialog"
                                aria-labelledby="exampleModalLabel-2" aria-hidden="true">
                                <div className="modal-dialog" role="document">
                                    <div className="modal-content">
                                        <div className="modal-header">
                                            <h5 className="modal-title" id="exampleModalLabel-2">Create Routes</h5>
                                            <button type="button" className="close" data-bs-dismiss="modal" aria-label="Close">
                                                <span aria-hidden="true">&times;</span>
                                            </button>
                                        </div>
                                        <div className="modal-body">
                                            <form className="forms-sample" onSubmit={handleSubmit}>
                                                <div className="form-group">
                                                    <label >Route</label>
                                                    <input type="text" className="form-control" onChange={handleChange} id="route" value={submit.route} required />
                                                </div>

                                                <div className="form-group">
                                                    <label htmlFor="exampleSelectGender">Hub Name</label>

                                                    <Select
                                                        options={hubOptions}
                                                        onChange={handleHubChange}
                                                        value={hubOptions.find((option) => option.value === selectedHub)}
                                                        placeholder="Select Hub Name"
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label htmlFor="exampleSelectGender">Map Locations</label>

                                                    <Select
                                                        value={selectedMapOption}
                                                        onChange={setSelectedMapOption}
                                                        options={locationOptions}
                                                        isMulti
                                                    />
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


                        </div>

                        <Footer />

                    </div>

                </div>

            </div>
        </>
    )
}

export default RoutesData