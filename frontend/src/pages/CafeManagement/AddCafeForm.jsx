import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { FaExclamationTriangle, FaInfoCircle } from "react-icons/fa";
import apiClient from "../../services/apiClient";

const Toast = Swal.mixin({
  toast: true,
  background: "#69aba6",
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  },
});


const fetchDeliveryHubs = async () => {
  let userRole = localStorage.getItem("role");
  try {
    let filters = [];
    if (userRole === "Hub Manager") {
      let hubName = localStorage.getItem("hub_name");
      filters.push({ field: "hub_name", op: "==", value: hubName });
    }
    const docs = await apiClient.post("/api/hubs_data/query", { filters }).then(res => res.data?.data || []);
    const hubs = docs.map((data) => {
      return { value: `${data.hub_name}`, label: `${data.hub_name}` };
    });
    return hubs;
  } catch (error) {
    console.error("Error fetching delivery hubs: ", error);
  }
};
const CreateCafeModal = ({
  cafeData,
  formData,
  setFormData,
  initialFormState,
  loggedInUser,
  edit,
  docId,
  fetchCafeDetails,
}) => {
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [deliverHubOptions, setDeliveryHubOptions] = useState([]);

  const generateCafeId = () => {
    const prefix = "CAFE";
    const namePart = formData.cafe_name ? formData.cafe_name.substring(0, 3).toUpperCase() : "XXX";
    const randomPart = Array.from({ length: 5 }, () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      return chars.charAt(Math.floor(Math.random() * chars.length));
    }).join("");
    return `${prefix}${namePart}${randomPart}`;
  };

  const cafes = useMemo(() => Array.from(new Set(cafeData.filter(item=>item.data.type === formData.type).map(item => item.data.cafe_name))), [cafeData, formData.type]);

 
 const handleFormSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  const cafeName = formData.cafe_name === "not_find" ? formData.other_cafe_name : formData.cafe_name;
  const cafeId = generateCafeId();
  const randomNum = Math.floor(100 + Math.random() * 900);
  const username = formData.user_name || formData.cafe_name.toLowerCase().replace(/\s+/g, "");
  const password = formData.password || `${formData.cafe_name.replace(/\s+/g, "")}${randomNum}`;
  const newData = { ...formData, user_name: username, password: password, cafe_name: cafeName, cafe_id: cafeId };
  if (newData.type === "E-Commerce") {
    if (docId) {
      await handleUpdateEcommerce(newData);
    } else {
      await handleAddNewEcommerce(newData);
    }
  } else if (newData.type === "Cafe") {
    if (docId) {
      await handleUpdateCafe(newData);
    } else {
      await handleAddNewCafe(newData);
    }
  } else {
    Toast.fire({ icon: "error", title: "Invalid Type" });
    setLoading(false);
  }
};

// Handle Add New for E-Commerce
const handleAddNewEcommerce = async (newData) => {
  setLoading(true);

  if (!newData.cafe_name || !newData.delivery_hub || !newData.user_name || !newData.password) {
    Toast.fire({
      icon: "error",
      title: "Please fill all required fields",
    });
    setLoading(false);
    return;
  }

  try {
    const productQuery = await apiClient.post("/api/cafe_master/query", {
        filters: [
            { field: "cafe_name", op: "==", value: newData.cafe_name },
            { field: "type", op: "==", value: "E-Commerce" }
        ]
    }).then(res => res.data?.data || []);

    if (productQuery.length > 0) {
      Toast.fire({ icon: "error", title: "E-Commerce Already Exists" });
      setLoading(false);
      return;
    }

    await apiClient.post("/api/cafe_master/add", {
      cafe_id: newData.cafe_id,
      type: newData.type,
      delivery_hub: newData.delivery_hub,
      cafe_name: newData.cafe_name,
      user_name: newData.user_name,
      password: newData.password,
      created_date: new Date(),
      created_by: loggedInUser,
    });

    resetForm();
    fetchCafeDetails();
    Toast.fire({ icon: "success", title: "E-Commerce Added Successfully" });
  } catch (error) {
    console.error("Error adding product: ", error);
  } finally {
    setLoading(false);
    window.modelhideCafe();
  }
};

// Handle Update for E-Commerce
const handleUpdateEcommerce = async (newData) => {

  setLoading(true);

  if (!newData.cafe_name || !newData.delivery_hub || !newData.password) {
    Toast.fire({ icon: "error", title: "Please fill all required fields" });
    setLoading(false);
    return;
  }

  try {
    await apiClient.put(`/api/cafe_master/${docId}`, {
      delivery_hub: newData.delivery_hub,
      cafe_name: newData.cafe_name,
      password: newData.password,
      updated_date: new Date(),
      updated_by: loggedInUser,
    });

    resetForm();
    fetchCafeDetails();
    Toast.fire({ icon: "success", title: "E-Commerce Updated Successfully" });
  } catch (error) {
    console.error("E-Commerce updating product: ", error);
  } finally {
    setLoading(false);
    window.modelhideCafe();
  }
};

const handleAddNewCafe = async (newData) => {

  setLoading(true);

  if (!newData.buyer_name || !newData.cafe_name || !newData.cafe_address || !newData.delivery_hub || !newData.consignee_name || !newData.user_name || !newData.password || !newData.consignee_address) {
    Toast.fire({ icon: "error", title: "Please fill all required fields" });
    setLoading(false);
    return;
  }

  try {
    let filters = [{ field: "cafe_location", op: "==", value: newData.cafe_address }];
    if (newData.type === "Cafe") {
      filters.push({ field: "cafe_name", op: "==", value: newData.cafe_name });
    }
    const cafeQuery = await apiClient.post("/api/cafe_master/query", { filters }).then(res => res.data?.data || []);

    if (cafeQuery.length > 0) {
      Toast.fire({ icon: "error", title: "Cafe Already Exists" });
      setLoading(false);
      return;
    }

    await apiClient.post("/api/cafe_master/add", {
      cafe_id: newData.cafe_id,
      type: newData.type,
      delivery_hub: newData.delivery_hub,
      cafe_name: newData.cafe_name,
      buyer_name: newData.buyer_name,
      cafe_address: newData.cafe_address,
      cafe_location: newData.cafe_address,
      consignee_name: newData.consignee_name ,
      consignee_address: newData.consignee_address || "" ,
      contact_person_name: newData.contact_person_name || "",
      gst_no_buyer: newData.gst_no_buyer || "", 
      gst_no_ship : newData.gst_no_ship || "", 
      user_name: newData.user_name,
      password: newData.password,
      created_date: new Date(),
      created_by: loggedInUser,
    });

    resetForm();
    fetchCafeDetails();
    Toast.fire({ icon: "success", title: "Cafe Added Successfully" });
  } catch (error) {
    console.error("Error adding cafe: ", error);
  } finally {
    setLoading(false);
    window.modelhideCafe();
  }
};

// Handle Update for Cafe
const handleUpdateCafe = async (newData) => {

  setLoading(true);

  if (!newData.buyer_name || !newData.cafe_name || !newData.cafe_address || !newData.delivery_hub || !newData.consignee_name || !newData.password) {
    Toast.fire({ icon: "error", title: "Please fill all required fields" });
    setLoading(false);
    return;
  }

  try {
    await apiClient.put(`/api/cafe_master/${docId}`, {
      delivery_hub: newData.delivery_hub,
      buyer_name: newData.buyer_name,
      cafe_name: newData.cafe_name,
      cafe_address: newData.cafe_address,
      cafe_location: newData.cafe_address,
      consignee_name: newData.consignee_name ,
      consignee_address: newData.consignee_address || "" ,
      contact_person_name: newData.contact_person_name || "",
      gst_no_buyer: newData.gst_no_buyer || "", 
      gst_no_ship : newData.gst_no_ship || "", 
      password: newData.password,
      updated_date: new Date(),
      updated_by: loggedInUser,
    });

    resetForm();
    fetchCafeDetails();
    Toast.fire({ icon: "success", title: "Cafe Updated Successfully" });
  } catch (error) {
    console.error("Error updating cafe: ", error);
  } finally {
    setLoading(false);
    window.modelhideCafe();
  }
};


  const handleChange = (event) => {
    const { id, value } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  const resetForm = () => {
    setFormData({ ...initialFormState });
  };

  const handleClose = () => {
    resetForm();
  };

  const types = ["Cafe", "E-Commerce"];


  useEffect(() => {
    const loadHub = async () => {
      const hubs = await fetchDeliveryHubs();
      setDeliveryHubOptions(hubs);
    }
    loadHub();
  }, []);
  
  useEffect(() => {
    setIsCafe(formData.type === "Cafe");
    setFormData((prev) => ({
      ...prev,
      not_find: false,
      cafe_name : docId !== "" ? formData.cafe_name : "" ,
    }));
  }, [formData.type]);

  const [isCafe, setIsCafe] = useState(false);


  return (
    <div className="modal-content shadow-lg rounded-4 border-0" style={{  maxHeight: "85vh" }}>
      {loading && (
        <div className="loader-overlay d-flex align-items-center justify-content-center">
          <img style={{ height: "6rem" }} src="images/loader.gif" alt="Loading..." />
        </div>
      )}

      {/* Header */}
      <div className="modal-header bg-primary text-white rounded-top-3 shadow-sm d-flex justify-content-between align-items-center p-3">
        <h5 className="modal-title fw-bold text-white m-0">
          <i className="bi bi-shop me-2"></i> Add Café / E-Commerce Platform
        </h5>
        <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" onClick={handleClose}></button>
      </div>

      {/* Body */}
      <div className="modal-body px-4 py-3" style={{ overflowY: "auto" }}>
        <form className="needs-validation" onSubmit={handleFormSubmit} noValidate>
          {/* Select Type & Delivery Hub */}
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label fw-semibold text-primary">Choose Type</label>
              <select
                className={`form-select shadow-sm border-0 rounded-3 p-2 ${errors.type ? "is-invalid" : ""}`}
                onChange={handleChange}
                id="type"
                value={formData.type}
                required
                disabled={edit}
              >
                <option value="">Select Type</option>
                {types.map((type, index) => (
                  <option key={index} value={type}>{type}</option>
                ))}
              </select>
              {errors.type && <div className="invalid-feedback">Please select a type.</div>}
            </div>

            { formData.type !== "" && (
              <div className="col-md-8">
                <label className="form-label fw-semibold text-primary">Delivery Hub *</label>
                <select
                  className={`form-select shadow-sm border-0 rounded-3 p-2 ${errors.delivery_hub ? "is-invalid" : ""}`}
                  onChange={handleChange}
                  id="delivery_hub"
                  value={formData.delivery_hub}
                  required
                >
                  <option value="">Select Delivery Hub</option>
                  {deliverHubOptions.map((deliveryHub) => (
                    <option key={deliveryHub.value} value={deliveryHub.value}>{deliveryHub.label}</option>
                  ))}
                </select>
                {errors.delivery_hub && <div className="invalid-feedback">This field is required.</div>}
              </div>
              )}
          </div>
          {/* Business Name */}
          {formData.type && (
            <>
              <div className="row g-3 mt-3">
              {/* If E-Commerce, Show Input Field Only */}
                {formData.type === "E-Commerce" ? (
                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-primary">
                      E-Commerce Platform Name *
                    </label>
                    <input
                      className={`form-control shadow-sm border-0 rounded-3 p-2 ${errors.cafe_name ? "is-invalid" : ""}`}
                      type="text"
                      onChange={handleChange}
                      id="cafe_name"
                      value={formData.cafe_name}
                      required
                      autoComplete="off"
                      placeholder="Enter E-Commerce platform name"
                      readOnly={docId !== ""}  
                    />
                    {errors.cafe_name && <div className="invalid-feedback">This field is required.</div>}
                  </div>
                ) : (
                  <>
                    {/* Check if "Not Found" is selected */}
                    {formData.not_find ? (
                      // Input Field for "Not Found" Case
                      <div className="col-md-6">
                        <label className="form-label fw-semibold text-primary" htmlFor="other_cafe_name">
                          Cafe Not Found – Enter Manually *
                        </label>
                        <input
                          className={`form-control shadow-sm border-0 rounded-3 p-2 mt-2 ${errors.other_cafe_name ? "is-invalid" : ""}`}
                          type="text"
                          onChange={handleChange}
                          id="other_cafe_name"
                          value={formData.other_cafe_name}
                          required={formData.type === "E-Commerce" && formData.docId !== ""}
                          autoComplete="off"
                          placeholder="Enter organization name"
                        />
                        {errors.other_cafe_name && <div className="invalid-feedback">This field is required.</div>}
                      </div>
                    ) : (
                      // Select Dropdown
                      <div className="col-md-6">
                        <label className="form-label fw-semibold text-primary">
                          {isCafe ? "Café Name" : "E-Commerce Platform Name"} *
                        </label>
                        <select
                          className={`form-select shadow-sm border-0 rounded-3 p-2 ${errors.cafe_name ? "is-invalid" : ""}`}
                          onChange={(e) => {
                            const selectedValue = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              cafe_name: selectedValue,
                              not_find: selectedValue === "not_find",
                              other_cafe_name: selectedValue === "not_find" ? "" : prev.other_cafe_name,
                            }));
                          }}
                          id="cafe_name"
                          value={formData.cafe_name}
                          required
                        >
                          <option value="">Select {isCafe ? "Café" : "E-Commerce"} Name</option>
                          {cafes.map((org, index) => (
                            <option key={index} value={org}>
                              {org}
                            </option>
                          ))}
                          <option key={-1} value="not_find">Not Found</option>
                        </select>
                        {errors.cafe_name && <div className="invalid-feedback">This field is required.</div>}
                      </div>
                    )}
                  </>
                )}


                {/* Cafe Address */}
                {formData.type === "Cafe" && (
                <div className="col-md-6">
                  <label className="form-label fw-semibold text-primary">Buyer Billing Name*</label>
                  <input
                    className={`form-control shadow-sm border-0 rounded-3 p-2 ${errors.buyer_name ? "is-invalid" : ""}`}
                    type="text"
                    onChange={handleChange}
                    id="buyer_name"
                    value={formData.buyer_name}
                    autoComplete="off"
                    placeholder="Enter Buyer Billing Name"
                    required
                  />
                  {errors.buyer_name && <div className="invalid-feedback">This field is required.</div>}
                </div>
                )}
                {/* Cafe Address */}
                {formData.type === "Cafe" && (
                <div className="col-md-6">
                  <label className="form-label fw-semibold text-primary">Cafe Address *</label>
                  <input
                    className={`form-control shadow-sm border-0 rounded-3 p-2 ${errors.cafe_address ? "is-invalid" : ""}`}
                    type="text"
                    onChange={handleChange}
                    id="cafe_address"
                    value={formData.cafe_address}
                    autoComplete="off"
                    placeholder="Enter cafe address"
                    required
                  />
                  {errors.cafe_address && <div className="invalid-feedback">This field is required.</div>}
                </div>
                )}
              </div>
            </>
          )}


          {/* Additional Data Fields */}
          {isCafe && (
            <div className="row g-3 mt-3 p-3 rounded-3 shadow-sm bg-light">
              
              {/* Consignee Name (Ship to) - Mandatory */}
              <div className="col-md-6">
                <label className="form-label fw-semibold text-primary">Consignee Name (Ship to) *</label>
                <input
                  className={`form-control shadow-sm border-0 rounded-3 p-2 ${errors.consignee_name ? "is-invalid" : ""}`}
                  type="text"
                  onChange={handleChange}
                  id="consignee_name"
                  value={formData.consignee_name}
                  autoComplete="off"
                  placeholder="Enter consignee name"
                  required
                />
                {errors.consignee_name && <div className="invalid-feedback">This field is required.</div>}
              </div>

              {/* Contact Person Name - Optional */}
              <div className="col-md-6">
                <label className="form-label fw-semibold text-primary">Contact Person Name</label>
                <input
                  className="form-control shadow-sm border-0 rounded-3 p-2"
                  type="text"
                  onChange={handleChange}
                  id="contact_person_name"
                  value={formData.contact_person_name}
                  autoComplete="off"
                  placeholder="Enter contact person's name"
                />
              </div>

              {/* GST No. Buyer - Optional */}
              <div className="col-md-6">
                <label className="form-label fw-semibold text-primary">GST No. Buyer</label>
                <input
                  className="form-control shadow-sm border-0 rounded-3 p-2"
                  type="text"
                  onChange={handleChange}
                  id="gst_no_buyer"
                  value={formData.gst_no_buyer}
                  autoComplete="off"
                  placeholder="Enter buyer's GST number"
                />
              </div>

              {/* GST No. Ship - Optional */}
              <div className="col-md-6">
                <label className="form-label fw-semibold text-primary">GST No. Ship</label>
                <input
                  className="form-control shadow-sm border-0 rounded-3 p-2"
                  type="text"
                  onChange={handleChange}
                  id="gst_no_ship"
                  value={formData.gst_no_ship}
                  autoComplete="off"
                  placeholder="Enter ship GST number"
                />
              </div>
              {/* Consignee Address- Optional */}
              <div className="col-md-6">
                <label className="form-label fw-semibold text-primary">Consignee Address</label>
                <input
                  className="form-control shadow-sm border-0 rounded-3 p-2"
                  type="text"
                  onChange={handleChange}
                  id="consignee_address"
                  value={formData.consignee_address}
                  autoComplete="off"
                  placeholder="Enter ship GST number"
                />
              </div>

            </div>
          )}
          {/* Cadantital Data Fields */}
          {formData.type !== "" && (
            <div className="row g-3 mt-3 p-3 rounded-3 shadow-sm bg-light">
              {/* User Name*/}
              <div className="col-md-6">
                <label className="form-label fw-semibold text-primary">User Name</label>
                <input
                  className="form-control shadow-sm border-0 rounded-3 p-2"
                  type="text"
                  onChange={handleChange}
                  id="user_name"
                  value={formData.user_name}
                  readOnly = {docId !== ""}
                  autoComplete="off"
                  placeholder="Enter User Name"
                />
              </div>

              {/* Password  */}
              <div className="col-md-6">
                <label className="form-label fw-semibold text-primary">Password</label>
                <input
                  className="form-control shadow-sm border-0 rounded-3 p-2"
                  type="text"
                  onChange={handleChange}
                  id="password"
                  value={formData.password}
                  autoComplete="off"
                  placeholder="Enter Password"
                />
              </div>
              <div className="alert alert-info d-flex align-items-center gap-2 p-3 mb-3" role="alert">
                <div>
                  <p>

                <FaInfoCircle className="fs-5" />
                  <strong>Note:</strong> No username or password? We'll create them for you.{' '}
                  </p>
                  <p>

                  <FaExclamationTriangle className="text-warning me-1" />
                  <strong className="text-warning">Warning:</strong>{' '}
                  <span className="text-warning">
                    Username is permanent once your cafe/e-commerce site is set up.
                  </span>
                  </p>
                </div>
              </div>
            </div>
          )}

      {/* Footer */}
      <div className="modal-footer mt-3 d-flex justify-content-end p-2">
        <button
          type="submit"
          className="btn btn-success btn-sm px-3 py-1 fw-semibold shadow-sm rounded-pill d-flex align-items-center gap-2"
        >
          <i className="bi bi-check-circle"></i> Submit
        </button>

        <button
          type="button"
          className="btn btn-outline-secondary btn-sm px-3 py-1 fw-semibold shadow-sm rounded-pill d-flex align-items-center gap-2"
          data-bs-dismiss="modal"
          onClick={handleClose}
        >
          <i className="bi bi-x-circle"></i> Cancel
        </button>
      </div>
        </form>
      </div>

    </div>
  );
};

export default CreateCafeModal;