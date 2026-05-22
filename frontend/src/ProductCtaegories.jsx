import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useParams } from 'react-router-dom';
import Sidebar from "./Sidebar";
import Swal from 'sweetalert2'
import {storage} from './services/uploadService';
import {ref, getDownloadURL, uploadBytesResumable} from './services/uploadService';
import TopPanel from "./TopPanel";
import Footer from "./Footer";
import apiClient from "./services/apiClient";

function ProductCategories() {
    const navigate = useNavigate();

    useEffect(() => {
        const loggedIn = localStorage.getItem("loggedIn") === "true";
        if (loggedIn) {
            // navigate("/");
        } else {
            navigate("/login");
        }
    }, [navigate]);
    const [timeOfDay, setTimeOfDay] = useState('');
    const [data, setData] = useState([]);
    const [editID, setEditID] = useState("");
    const [edit, setEdit] = useState(false);
    const initialFormState = { parent_category: '', product_category: '', category_order: '', category_image: '', status: '', updated_date: new Date(), created_date: new Date() }
    const [submit, setSubmit] = useState(initialFormState)
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [loading, setLoading] = useState(false);


    const thumbnailInputRef = useRef(null);

    const handleThumbnailChange = (e) => {
        setThumbnailFile(e.target.files[0]); // Set the selected file as the thumbnailFile state
    };

    const handleChange = (e) => {
        const { id, value } = e.target
        setSubmit({ ...submit, [id]: value })
    }

    const addNew = () => {
        setEdit(false)
        openModal();
        setSubmit({ parent_category: '', product_category: '', category_order: '', category_image: '', status: '', updated_date: new Date(), created_date: new Date() });
    }

    const reset = () => {
        setSubmit({ parent_category: '', product_category: '', category_order: '', category_image: '', status: '', updated_date: new Date(), created_date: new Date() })
    }

    useEffect(() => {
        let isMounted = true;
        apiClient.post("/api/product_categories/query", { filters: [] })
            .then((res) => {
                if(isMounted) {
                    const sortedData = (res.data?.data || []).sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date));
                    setData(sortedData.map((doc) => ({
                        id: doc._id,
                        data: doc,
                    })));
                }
            })
            .catch(err => console.error(err));
        return () => { isMounted = false; };
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

    const changeStatusForm = (data, id) => {
        setEdit(true)
        setEditID(id)
        setSubmit({ id: id, parent_category: data.parent_category, product_category: data.product_category, category_order: data.category_order, category_image: data.category_image, status: data.status, updated_date: new Date(), created_date: new Date() });
        openModal();
    }

    const openModal = () => {
        // alert("ooo")
        window.modelshow();
    }

    const closeModal = () => {
        window.modalHide();
    }

    const uploadFilesAndSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {

            // Upload thumbnail image
            const thumbnailRef = ref(storage, `brand_category/${thumbnailFile.name}`);
            const thumbnailUploadTask = uploadBytesResumable(thumbnailRef, thumbnailFile);
            await thumbnailUploadTask;
            const thumbnailDownloadURL = await getDownloadURL(thumbnailRef);

            // Update submit object with download URLs
            const updatedSubmit = {
                ...submit,
                status: "1",
                category_image: thumbnailDownloadURL,
            };

            if(edit) {
                await apiClient.patch(`/api/product_categories/${submit.id}`, updatedSubmit);
            } else {
                await apiClient.post("/api/product_categories", updatedSubmit);
            }
            // Reset the file state variables
            setThumbnailFile(null);
            // Clear the file input fields
            thumbnailInputRef.current.value = '';
            closeModal();
        } catch (error) {
            console.error("Error uploading files and submitting form:", error);
            // Handle error appropriately, such as displaying an error message to the user
            Swal.fire('Error', 'Failed to upload files and submit form', 'error');
        } finally {
            setLoading(false); // Set loading state to false when upload completes or encounters an error
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
            if (result.isConfirmed) {
                apiClient.delete(`/api/product_categories/${id}`).then(() => {
                    setSubmit({ parent_category: '', product_category: '', category_order: '', category_image: '', status: '', updated_date: new Date(), created_date: new Date() })
                    closeModal();
                    Swal.fire(
                        'Deleted!',
                        'Data has been deleted.',
                        'success'
                    )
                })

            }
        })

    }

    return (
        <>
            <div class="container-scroller">

                <TopPanel />

                <div class="container-fluid page-body-wrapper">

                    <Sidebar />

                    <div class="main-panel">
                        <div class="content-wrapper">

                            <div class="col-lg-12 grid-margin stretch-card">
                                <div class="card">
                                    <div class="card-body">
                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            <h4 class="card-title">Product Categories</h4>

                                            <p class="card-description">
                                                {/* <code><button type="button" class="btn btn-success btn-rounded btn-sm" data-bs-toggle="modal" data-bs-target="#exampleModal-1">Add Parent Categories</button></code> */}
                                                <button type="button" class="btn btn-success btn-rounded btn-sm" onClick={() => addNew()}>Add Categories</button>
                                            </p>
                                        </div>
                                        <div class="table-responsive">
                                            <table class="table table-striped">
                                                <thead>
                                                    <tr>
                                                        <th>
                                                            ID
                                                        </th>
                                                        <th>
                                                            Parent Category
                                                        </th>
                                                        <th>
                                                            Category
                                                        </th>
                                                        <th>
                                                            Category Order
                                                        </th>
                                                        <th>
                                                            Category Image
                                                        </th>
                                                        <th>
                                                            Active/Inactive
                                                        </th>
                                                        <th>Action</th>

                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data?.map(({ id, data }, index) => (
                                                        <>
                                                            <tr>
                                                                <td>
                                                                    {index + 1}
                                                                </td>
                                                                <td>
                                                                    {data.parent_category}
                                                                </td>
                                                                <td>
                                                                    {data.product_category}
                                                                </td>
                                                                <td>
                                                                    {data.category_order}
                                                                </td>

                                                                <td>
                                                                    <img src={data.category_image}></img>

                                                                </td>
                                                                <td>
                                                                    {data.status === "1" ? "Active" : "In Active"}
                                                                </td>
                                                                <td>
                                                                    <button style={{ marginRight: "1rem", padding: "0.2rem 0.85rem" }} onClick={() => changeStatusForm(data, id)} class="btn btn-dark btn-sm"><i class="menu-icon mdi mdi-pencil" style={{ color: "white" }}></i></button>
                                                                    <button style={{ marginRight: "1rem", padding: "0.2rem 0.85rem" }} class="btn btn-dark btn-sm" onClick={() => deleteData(id)}><i class="menu-icon mdi mdi-delete" style={{ color: "white" }}></i></button>
                                                                </td>
                                                            </tr>
                                                        </>
                                                    ))}



                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* <div class="modal fade" id="exampleModal-1" tabindex="-1" role="dialog"
                                aria-labelledby="exampleModalLabel-2" aria-hidden="true">
                                <div class="modal-dialog" role="document">
                                    <div class="modal-content">
                                        <div class="modal-header">
                                            <h5 class="modal-title" id="exampleModalLabel-2">Add Product Parent Category</h5>
                                            <button type="button" class="close" data-bs-dismiss="modal" aria-label="Close">
                                                <span aria-hidden="true">&times;</span>
                                            </button>
                                        </div>
                                        <div class="modal-body">
                                            <form class="forms-sample">
                                                <div class="form-group">
                                                    <label >Product Category Name</label>
                                                    <select class="form-select" onChange={handleChange} id="visible_on" value={submit.visible_on}>
                                                        <option>Select Visible On</option>
                                                        <option value="Dairy">Dairy</option>
                                                        <option value="letter">letter</option>
                                                        <option value="Gift Box">Gift Box</option>
                                                        <option value="Eggs">Eggs</option>
                                                        <option value="Breads">Breads</option>
                                                        <option value="Coffee">Coffee</option>
                                                    </select>
                                                </div>
                                                <div class="form-group">
                                                    <label for="exampleInputEmail1">Product Category Order</label>
                                                    <input type="email" class="form-control" id="exampleInputEmail1" placeholder="Product Category Order" />
                                                </div>

                                                <div class="form-group">
                                                    <label for="exampleInputEmail1">Product Category Image</label>
                                                    <input type="email" class="form-control" id="exampleInputEmail1" placeholder="Product Category Image" />
                                                </div>


                                                <p style={{ fontWeight: "600" }}>NOTE : Resolution of the image needs to be 200 x 200</p>
                                            </form>
                                        </div>
                                        <div class="modal-footer">
                                            <button type="button" class="btn btn-success">Submit</button>
                                            <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
                                        </div>
                                    </div>
                                </div>
                            </div> */}

                            <div class="modal fade" id="exampleModal-2" tabindex="-1" role="dialog"
                                aria-labelledby="exampleModalLabel-2" aria-hidden="true">
                                <div class="modal-dialog" role="document">
                                    <div class="modal-content">
                                        <div class="modal-header">
                                            <h5 class="modal-title" id="exampleModalLabel-2">Add Product Sub Category</h5>
                                            <button type="button" class="close" data-bs-dismiss="modal" aria-label="Close">
                                                <span aria-hidden="true">&times;</span>
                                            </button>
                                        </div>
                                        <div class="modal-body">
                                            <form class="forms-sample" onSubmit={uploadFilesAndSubmit}>
                                                <div class="form-group">
                                                    <label >Product Category Name</label>
                                                    <select class="form-select" onChange={handleChange} id="parent_category" value={submit.parent_category}>
                                                        <option>Select Visible On</option>
                                                        <option value="Dairy">Dairy</option>
                                                        <option value="letter">letter</option>
                                                        <option value="Gift Box">Gift Box</option>
                                                        <option value="Eggs">Eggs</option>
                                                        <option value="Breads">Breads</option>
                                                        <option value="Coffee">Coffee</option>
                                                    </select>
                                                </div>
                                                <div class="form-group">
                                                    <label for="exampleInputUsername1">Product Category Name</label>
                                                    <input type="text" class="form-control" onChange={handleChange} id="product_category" value={submit.product_category} placeholder="Product Category Name" />
                                                </div>
                                                <div class="form-group">
                                                    <label for="exampleInputUsername1">Product Category Order</label>
                                                    <input type="text" class="form-control" onChange={handleChange} id="category_order" value={submit.category_order} placeholder="Product Category Order" />
                                                </div>
                                                <div class="form-group">
                                                    <label>Category Image</label>
                                                    <input type="file" id="thumbnail" ref={thumbnailInputRef} class="form-control" style={{ padding: "10px" }} onChange={handleThumbnailChange} required />
                                                    {edit ? <img src={submit.category_image} style={{ height: "6rem", padding: "1rem" }}></img> : <></>}
                                                </div>

                                                <div class="form-group mt-0">
                                                    <label class="form-check-label">
                                                        <input class="checkbox" type="checkbox" />
                                                        <span style={{ marginLeft: "11px" }}>Same Image use as Parent Category Image</span>
                                                    </label>
                                                </div>

                                                <p style={{ fontWeight: "600" }}>NOTE : Resolution of the image needs to be 200 x 200</p>

                                                <div class="modal-footer">
                                                    {loading ? <div className="loading">Uploading, please wait...</div> : <button type="submit" value="submit" class="btn btn-success">Submit</button>}
                                                    <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
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

export default ProductCategories
