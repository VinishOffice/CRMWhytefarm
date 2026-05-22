import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Swal from "sweetalert2";
import TopPanel from "./TopPanel";
import DatePicker from "react-datepicker";
import { storage, ref, getDownloadURL, uploadBytesResumable } from './services/uploadService';
import Moment from "moment";
import { extendMoment } from "moment-range";
import Footer from "./Footer";
import GlobalContext from "./context/GlobalContext";
import { handleLogout } from "./Utility";
import apiClient from './services/apiClient';
import { normalizeDateValue } from "./helpers";
function Banner() {
  const navigate = useNavigate();

  const { permissible_roles } = useContext(GlobalContext);
  useEffect(() => {
     setLoading(true);
    const loggedIn = localStorage.getItem("loggedIn") === "true";
   
    if (!loggedIn) {
      navigate("/login");
    } else {
      if (permissible_roles.length > 0) {
        if (!permissible_roles.includes("marketing")) {
          handleLogout();
          navigate("/permission_denied");
        }
      }
      setLoading(false);
    }
  }, [navigate, permissible_roles]);
  const moment = extendMoment(Moment);
  const [data, setData] = useState([]);
  const [editID, setEditID] = useState("");
  const [edit, setEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hubNames, setHubNames] = useState([]);
  const fileInputRef = useRef(null);

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const docs = await apiClient.post("/api/banners/query", {
          filters: [],
          sort: [{ field: "created_date", direction: "desc" }]
        }).then(res => res.data?.data || []);
        
        setData(docs.map(doc => ({ id: doc._id || doc.id, data: doc })));
      } catch (error) {
        console.error("Error fetching banners:", error);
      }
    };
    fetchBanners();
  }, []);
  
  const initialFormData = {
    image: "",
    hub_name: "",
    click_action_type: "",
    navigation_type: "",
    start_date_time: "",
    end_date_time: "",
    banner_order: "",
    platform: "",
    status: "",
    updated_date: new Date(),
    created_date: new Date(),
  };

  const [formData, setFormData] = useState(initialFormData);

  const openModal = () => {
    // alert("ooo")
    window.modelshow();
  };

  const closeModal = () => {
    window.modalHide();
  };

  useEffect(() => {
    const fetchHubs = async () => {
      try {
        const docs = await apiClient.post("/api/hubs_data/query", { filters: [] })
          .then(res => res.data?.data || []);
        setHubNames(docs.map(doc => doc.hub_name));
      } catch (error) {
        console.error("Error fetching hubs:", error);
      }
    };
    fetchHubs();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "checkbox") {
      setFormData((prevState) => ({
        ...prevState,
        [name]: checked,
      }));
    } else if (type === "file") {
      // File input, handle files separately
      const file = files[0]; // Assuming single file selection
      // You may want to perform additional checks or validation on the file here
      setFormData((prevState) => ({
        ...prevState,
        [name]: file,
      }));
    } else {
      setFormData((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (edit) {
      if (formData.image && typeof formData.image !== "string") {
        // New image selected, upload it to Firebase Storage
        const storageRef = ref(storage, `banner/${formData.image.name}`);
        const uploadTask = uploadBytesResumable(storageRef, formData.image);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            // progress tracking removed (unused)
          },
          (error) => {
            console.error("Error uploading image: ", error);
          },
          () => {
            // File uploaded successfully, now obtain the download URL
            getDownloadURL(uploadTask.snapshot.ref)
              .then((downloadURL) => {
                // Update Banner data in Firestore with the new image URL
                apiClient.put(`/api/banners/${editID}`, {
                  ...formData,
                  start_date_time: startDate,
                  end_date_time: endDate,
                  image: downloadURL, // Replace image with the download URL of the new image
                  updated_date: new Date()
                })
                  .then(() => {
                    // Reset the form after successful submission
                    setFormData(initialFormData);
                    closeModal();
                  })
                  .catch((error) => {
                    console.error("Error updating Banner: ", error);
                  });
              })
              .catch((error) => {
                console.error("Error getting download URL: ", error);
              });
          }
        );
      } else {
        // No new image selected, update Banner data without changing the image URL
        apiClient.put(`/api/banners/${editID}`, {
          ...formData,
          start_date_time: startDate,
          end_date_time: endDate,
          updated_date: new Date()
        })
          .then(() => {
            // Reset the form after successful submission
            setFormData(initialFormData);
            closeModal();
          })
          .catch((error) => {
            console.error("Error updating product: ", error);
          });
      }
    } else {
      // Upload image file to Firebase Storage if formData.image exists
      if (formData.image) {
        const storageRef = ref(storage, `banner/${formData.image.name}`);
        const uploadTask = uploadBytesResumable(storageRef, formData.image);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            // progress tracking removed (unused)
          },
          (error) => {
            console.error("Error uploading image: ", error);
          },
          () => {
            // File uploaded successfully, now add form data to Firestore
            getDownloadURL(uploadTask.snapshot.ref)
              .then((downloadURL) => {
                // Add form data to Firestore
                return apiClient.post("/api/banners", {
                  ...formData,
                  start_date_time: startDate,
                  end_date_time: endDate,
                  image: downloadURL, // Replace image with the download URL from Firebase Storage
                  created_date: new Date(),
                  updated_date: new Date()
                });
              })
              .then(() => {
                // document.getElementById("image-input").value = "";
                // Reset the form after successful submission
                setFormData(initialFormData);
                closeModal();

                // Clear the file input field
              })
              .catch((error) => {
                console.error("Error adding Banner: ", error);
              });
          }
        );
      } else {
        // No image to upload, directly add form data to Firestore
        apiClient.post("/api/banners", {
          ...formData,
          start_date_time: startDate,
          end_date_time: endDate,
          created_date: new Date(),
          updated_date: new Date()
        })
          .then(() => {
            // Reset the form after successful submission
            setFormData(initialFormData);
            closeModal();
          })
          .catch((error) => {
            console.error("Error adding Banner: ", error);
          });
      }
    }
  };
  const addNew = () => {
    fileInputRef.current.value = "";
    setEdit(false);
    // setEdit(false)
    openModal();
  };
  const editData = (id, data) => {
    setEdit(true);
    setEditID(id);

    setFormData({
      image: data.image,
      hub_name: data.hub_name,
      click_action_type: data.click_action_type,
      navigation_type: data.navigation_type,
      start_date_time: data.start_date_time instanceof Date ? data.start_date_time : new Date(data.start_date_time),
      end_date_time: data.end_date_time instanceof Date ? data.end_date_time : new Date(data.end_date_time),
      banner_order: data.banner_order,
      platform: data.platform,
      status: data.status,
      updated_date: new Date(),
    });
    openModal();
  };

  const deleteData = (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        setLoading(true); // Start loading indicator
        apiClient.delete(`/api/banners/${id}`)
          .then(() => {
            setLoading(false);
            Swal.fire("Deleted!", "Banner has been deleted.", "success");
            // Refresh explicitly since onSnapshot is removed
            const fetchBanners = async () => {
              const docs = await apiClient.post("/api/banners/query", { filters: [] })
                .then(res => res.data?.data || []);
              setData(docs.map(doc => ({ id: doc._id || doc.id, data: doc })));
            };
            fetchBanners();
          })
          .catch((error) => {
            console.error("Error deleting banner:", error);

            setLoading(false);
            Swal.fire(
              "Error!",
              "An error occurred while deleting banner.",
              "error"
            );
          });
      }
    });
  };

  const rolePermission = () => {
    const Toast = Swal.mixin({
      toast: true,
      background: "#d7e7e6",
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener("mouseenter", Swal.stopTimer);
        toast.addEventListener("mouseleave", Swal.resumeTimer);
      },
    });

    Toast.fire({
      icon: "error",
      title: "You are not authorised to do this action",
    });
  };

  return (
    <>
      {loading && ( // Render loader when loading state is true
        <div className="loader-overlay">
          <div className="">
            <img
              style={{
                height: "6rem",
              }}
              src="images/loader.gif"
              alt="loading..."
            ></img>
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
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <h4 className="card-title">Banners</h4>
                      <div className="card-description">
                        {permissible_roles.includes("create_banner") ? (
                          <>
                            <button
                              type="button"
                              className="btn btn-success btn-rounded btn-sm"
                              onClick={() => addNew()}
                            >
                              Add Banner
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="btn btn-success btn-rounded btn-sm"
                              onClick={() => rolePermission()}
                            >
                              Add Banner
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="table-responsive">
                      <table className="table table-striped">
                        <thead>
                          <tr>
                            <th>Image</th>
                            <th>Hub Name</th>
                            <th>Start Date Time</th>

                            <th>End Date Time</th>
                            <th>Status</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.map(({ id, data }, index) => {
                            return (
                              <tr key={id}>
                                <td>
                                  <img
                                    src={data.image}
                                    style={{
                                      height: "5rem",
                                      width: "8rem",
                                      borderRadius: "10%",
                                    }}
                                    alt="banner"
                                  ></img>
                                </td>
                                <td>{data.hub_name}</td>
                                <td>
                                  {moment(normalizeDateValue(data.start_date_time)).format(
                                    "YYYY-MM-DD, HH:mm:ss"
                                  )}
                                </td>
                                <td>
                                  {moment(
                                    normalizeDateValue(data.end_date_time)
                                  ).format("YYYY-MM-DD, HH:mm:ss")}
                                </td>
                                <td>{data.status}</td>
                                <td>
                                  {permissible_roles.includes("edit_banners") ? (
                                    <>
                                      <button
                                        style={{
                                          marginRight: "1rem",
                                          padding: "0.2rem 0.85rem",
                                        }}
                                        onClick={() => editData(id, data)}
                                        className="btn btn-dark btn-sm"
                                      >
                                        <i
                                          className="menu-icon mdi mdi-pencil"
                                          style={{ color: "white" }}
                                        ></i>
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        style={{
                                          marginRight: "1rem",
                                          padding: "0.2rem 0.85rem",
                                        }}
                                        onClick={() => rolePermission()}
                                        className="btn btn-dark btn-sm"
                                      >
                                        <i
                                          className="menu-icon mdi mdi-pencil"
                                          style={{ color: "white" }}
                                        ></i>
                                      </button>
                                    </>
                                  )}

                                  {permissible_roles.includes("delete_banner") ? (
                                    <>
                                      <button
                                        style={{
                                          marginRight: "1rem",
                                          padding: "0.2rem 0.85rem",
                                        }}
                                        className="btn btn-dark btn-sm"
                                        onClick={() => deleteData(id)}
                                      >
                                        <i
                                          className="menu-icon mdi mdi-delete"
                                          style={{ color: "white" }}
                                        ></i>
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        style={{
                                          marginRight: "1rem",
                                          padding: "0.2rem 0.85rem",
                                        }}
                                        className="btn btn-dark btn-sm"
                                        onClick={() => rolePermission()}
                                      >
                                        <i
                                          className="menu-icon mdi mdi-delete"
                                          style={{ color: "white" }}
                                        ></i>
                                      </button>
                                    </>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="modal fade"
              id="exampleModal-2"
              tabIndex="-1"
              role="dialog"
              aria-labelledby="exampleModalLabel-2"
              aria-hidden="true"
            >
              <div className="modal-dialog modal-lg" role="document">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title" id="exampleModalLabel-2">
                      Add Banner
                    </h5>
                    <button
                      type="button"
                      className="close"
                      data-bs-dismiss="modal"
                      aria-label="Close"
                    >
                      <span aria-hidden="true">&times;</span>
                    </button>
                  </div>
                  <div className="modal-body">
                    <form onSubmit={handleSubmit}>
                      <div className="form-group row">
                        <div className="col">
                          <label>Select Banner Image:</label>
                          <input
                            className="form-control"
                            type="file"
                            style={{ padding: "10px" }}
                            name="image"
                            ref={fileInputRef}
                            // Note: value should not be set for file inputs, it's read-only
                            onChange={handleChange}
                          />
                        </div>
                        <div className="col">
                          <label>Hub Name</label>
                          <select
                            className="form-select"
                            onChange={handleChange}
                            id="hub_name"
                            name="hub_name"
                            value={formData.hub_name}
                            required
                          >
                            <option>Select Hub Name</option>
                            {hubNames.map((HubName) => (
                              <option key={HubName} value={HubName}>
                                {HubName}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col">
                          <label>Click Action Type:</label>
                          <select
                            name="click_action_type"
                            value={formData.click_action_type}
                            onChange={handleChange}
                            required
                            className="form-control"
                          >
                            <option value="">Select Click Action Type</option>
                            <option value="In-app Section">
                              In-app Section
                            </option>
                            <option value="Internal Web View">
                              Internal Web View
                            </option>
                            <option value="External Web View">
                              External Web View
                            </option>
                          </select>
                        </div>
                      </div>

                      <div className="form-group row">
                        <div className="col">
                          <label>Navigation Type:</label>
                          <select
                            name="navigation_type"
                            value={formData.navigation_type}
                            onChange={handleChange}
                            required
                            className="form-control"
                          >
                            <option value="">Select Navigation Type</option>
                            <option value="Product">Product</option>
                          </select>
                        </div>
                        <div className="col">
                          <label>Start Date Time:</label>
                          <div>
                            <DatePicker
                              selected={startDate}
                              onChange={(date) => setStartDate(date)}
                              showTimeSelect
                              placeholderText="Start Date Time"
                              className="form-control"
                              dateFormat="MMMM d, yyyy h:mm aa"
                            />
                          </div>
                        </div>
                        <div className="col">
                          <label>End Date Time:</label>
                          <div>
                            <DatePicker
                              selected={endDate}
                              onChange={(date) => setEndDate(date)}
                              showTimeSelect
                              placeholderText="End Date Time"
                              className="form-control"
                              dateFormat="MMMM d, yyyy h:mm aa"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="form-group row">
                        <div className="col">
                          <label>Banner Order:</label>
                          <input
                            className="form-control"
                            type="text"
                            name="banner_order"
                            value={formData.banner_order}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        <div className="col">
                          <label>Platform:</label>
                          <select
                            name="platform"
                            value={formData.platform}
                            onChange={handleChange}
                            required
                            className="form-control"
                          >
                            <option value="">Select Platform</option>
                            <option value="Mobile App">Mobile App</option>
                            <option value="Web App">Web App</option>
                            <option value="Both">Both</option>
                          </select>
                        </div>
                        <div className="col">
                          <label>Status:</label>
                          <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            required
                            className="form-control"
                          >
                            <option value="">Select Status</option>
                            <option value="Active"> Active</option>
                            <option value="Inactive"> Inactive</option>
                          </select>
                        </div>
                      </div>

                      <div
                        className=""
                        style={{ display: "flex", justifyContent: "end" }}
                      >
                        <button type="submit" className="btn btn-success btn-sm">
                          {edit ? "Update" : "Submit"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>

            <Footer />
          </div>
        </div>
      </div>
    </>
  );
}
export default Banner;
