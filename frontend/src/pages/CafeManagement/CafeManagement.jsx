
import DatePicker from "react-datepicker";
import { FaStore, FaShoppingCart, FaEdit, FaTrash, FaShoppingBag, FaHistory, FaSearch, FaCalendar } from "react-icons/fa";
import React, { useState, useEffect, useContext } from "react";
import TopPanel from "../../TopPanel";
import Sidebar from "../../Sidebar";
import Footer from "../../Footer";
import CreateCafeModal from "./AddCafeForm";
import PlaceOrderModal from "./PlaceOrderForm";
import Swal from 'sweetalert2'
import ViewCafeOrders from "./CafeOrderHistory";
import GlobalContext from "../../context/GlobalContext";
import { handleLogout } from '../../Utility';
import { useNavigate } from "react-router-dom";
import PdfGenerator from "./Degital Challan/PdfGenerator";
import { Card, CardBody, CardHeader } from "react-bootstrap";
import moment from "moment";
import DateInput from "../../components/Date";
import apiClient from "../../services/apiClient";

function CafeManagement() {
  const { permissible_roles } = useContext(GlobalContext);
  const navigate = useNavigate();

  useEffect(() => {
    const loggedIn = localStorage.getItem("loggedIn") === "true";
    if (!loggedIn) {
      navigate("/login");
    } else {
      if (permissible_roles.length > 0) {
        if (!permissible_roles.includes('locations')) {
          handleLogout()
          navigate("/permission_denied");
        }
      }
    }
  }, [navigate, permissible_roles]);
  const Toast = Swal.mixin({
    toast: true,
    background: '#69aba6',
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
  });
  const initialFormState = {
    type: "",
    cafe_name: "",
    cafe_location: "",
    delivery_hub: "",
    contact_person_name: "",
    username: "",
    password: ""
  };
  const [formData, setFormData] = useState({ ...initialFormState });
  const loggedInUser = localStorage.getItem("loggedIn_user")
  const [loading, setLoading] = useState(false);
  const [docId, setDocId] = useState("");
  const [edit, setEdit] = useState(false);
  const [cafeData, setCafeData] = useState([]);
  const [rowData, setRowData] = useState({})
  const [search, setSearch] = useState("")
  const userRole = localStorage.getItem("role")

  const notAuthorized = () => {
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

  const addCafe = () => {
    window.modelshowCafe()
  }

  const editCafe = (data, id) => {
    if (permissible_roles.includes('edit_cafe_ecommerce')) {
      setEdit(true)
      setDocId(id)
      // setFormData({ id: id, cafe_name: data.cafe_name, cafe_location: data.cafe_location, delivery_hub: data.delivery_hub, type: data.type, contact_person_name: data.contact_person_name, username: data.user_name, password: data.password });
      setFormData(data);
      addCafe();
    } else {
      notAuthorized()
    }
  }

  const handlePlaceOrderClick = () => {
    window.modelshowPlaceOrder()
  }

  const placeOrder = (data, id) => {
    setDocId(id)

    if (permissible_roles.includes("place_b2b_orders")) {
      setFormData({ id: id, cafe_name: data.cafe_name, cafe_id: data.cafe_id, cafe_location: data.cafe_location, delivery_hub: data.delivery_hub, type: data.type, contact_person_name: data.contact_person_name });
      handlePlaceOrderClick();
    } else {
      notAuthorized()
    }
  }

  const viewOrders = (data, id) => {

    if (permissible_roles.includes("view_b2b_orders")) {
      const sensitiveData = ["password", "user_name"];
      const nonSensitiveKeys = Object.keys(data).filter((key) => !sensitiveData.includes(key));
      const nonSensitiveData = Object.fromEntries(nonSensitiveKeys.map((key) => [key, data[key]]));
      setDocId(id);
      setRowData({ id: id, ...nonSensitiveData });
      window.modelshowCafeOrders()
    } else {
      notAuthorized()
    }

  }

  const fetchCafeDetails = async () => {
    try {
      let filters = [];
      if (userRole === "Hub Manager") {
        let hubName = localStorage.getItem("hub_name");
        filters.push({ field: "delivery_hub", op: "==", value: hubName });
      }
      const docs = await apiClient.post("/api/cafe_master/query", { filters, sort: [{ field: "cafe_name", direction: "asc" }] }).then(res => res.data?.data || []);
      const cafes = docs.map(doc => ({
        id: doc._id,
        data: doc,
      }));
      setCafeData(cafes);
    } catch (error) {
      console.error("Error fetchind cafe details", error)
    }
  }

  useEffect(() => {
    fetchCafeDetails()
  }, [])


  const [filters, setFilters] = useState({ name: "", hub: "", type: "" });
  const [filters1, setFilters1] = useState({ status: "" });
  const [date, setDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [summary, setSummary] = useState([0,0,0,0]);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const fetchCount = async (date, cafe = "") => {
  try {
    const formattedDate = moment(date).format("YYYY-MM-DD");

    // Build base filters
    const baseFilters = [{ field: 'delivery_date', op: '==', value: formattedDate }];

    if (cafe) {
      baseFilters.push({ field: 'delivering_to', op: '==', value: cafe });
    }

    const getAll = await apiClient.post("/api/b2b_orders/query", { filters: baseFilters }).then(res => res.data?.data || []);
    
    let countDelivered = 0;
    let countCancelled = 0;
    let countPending = 0;

    getAll.forEach(order => {
      if (order.status === 1 || String(order.status) === "1") countDelivered++;
      else if (order.status === 2 || String(order.status) === "2") countCancelled++;
      else if (order.status === 0 || String(order.status) === "0") countPending++;
    });

    const total = countDelivered + countCancelled + countPending;
    const data = [countDelivered, countCancelled, countPending, total];

    setSummary(data);
  } catch (error) {
    console.error("Error fetching count:", error);
  }
};


 useEffect(() => {
  const getSummary = async () => {
    setLoadingSummary(true);

    try {
      if (filters.name && date) {
        await fetchCount(date, filters.name);
      } else {
        await fetchCount(date);
      }
    } catch (error) {
      console.error("Error fetching summary:", error);
    } finally {
      setLoadingSummary(false);
    }
  };

  if (date) {
    getSummary();
  }
}, [date, filters.name]);


  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };
  const handleFilterChange1 = (key, value) => {
    setFilters1((prev) => ({ ...prev, [key]: value }));
  };
  const filteredCafeData = cafeData.filter(({ data }) => {
    const matchesName = filters.name ? data.cafe_name === filters.name : true;
    const matchesHub = filters.hub ? data.delivery_hub === filters.hub : true;
    const matchesType = filters.type ? data.type === filters.type : true;

    const matchesSearch = search
      ? [data.cafe_name, data.delivery_hub, data.type, data.cafe_address, data.buyer_name]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase())
      : true;

    return matchesName && matchesHub && matchesType && matchesSearch;
  });

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const handleClearFilters = () => {
    setFilters({ name: "", hub: "", type: "" }); // Reset all filter values
    setSearch("");
  };
  // const deleteCafe = (id) => {
  //   if (permissible_roles.includes('delete_cafe_ecommerce')){
  //     Swal.fire({
  //       title: 'Are you sure?',
  //       text: "You won't be able to revert this!",
  //       icon: 'warning',
  //       showCancelButton: true,
  //       confirmButtonColor: '#d33',
  //       cancelButtonColor: '#3085d6',
  //       confirmButtonText: 'Yes, delete it!',
  //       className: "p-5"
  //     }).then((result) => {
  //       if(result.isConfirmed) {
  //         setLoading(true)
  //         collection("cafe_master").doc(id).delete().then(() => {
  //           window.modelhideCafe();
  //           Toast.fire({
  //             icon: 'success',
  //             title: 'Cafe Deleted'
  //           });
  //           fetchCafeDetails();
  //           setLoading(false)
  //         })
  //       }
  //     })
  //   } else {
  //     notAuthorized()
  //   }
  // }

  return (
    <>
      {loading && (
        <div className="loader-overlay">
          <div className="">
            <img
              alt="loader"
              style={{
                height: "6rem",
              }}
              src="images/loader.gif"
            ></img>
          </div>
        </div>
      )}
      <div class="container-scroller">
        <TopPanel />
        <div class="container-fluid page-body-wrapper">
          <Sidebar />
          <div class="main-panel">
            <div class="content-wrapper">
              <div class="col-lg-12 grid-margin stretch-card">
                <div class="card">
                  <div class='card-body'>
                    <div className="d-flex justify-content-between align-items-start w-100 mb-4 flex-wrap">
                      {/* Title on the left */}
                      <h4 className="card-title mb-3 mb-md-0">Cafe / E-commerce Management</h4>

                      <div className="d-flex flex-column align-items-end gap-2">
                        {/* Right side: Search + Button in column */}
                        <div className="d-flex align-items-center">
                          {/* Search Input */}
                          <FaSearch className="me-2 text-success" size={18} />
                          <input
                            type="text"
                            className="form-control form-control-sm border-0 rounded-pill shadow-sm"
                            placeholder="Search"
                            value={search}
                            onChange={handleSearch}
                            style={{ minWidth: "220px" }}
                            aria-label="Search"
                          />
                        </div>

                        <div className="d-flex align-items-center">

                          {/* Add Button */}
                          <button
                            type="button"
                            className="btn btn-success btn-sm rounded-pill"
                            onClick={() => {
                              if (permissible_roles.includes("add_cafe_ecommerce")) {
                                addCafe();
                                setEdit(false);
                                setDocId("");
                              } else {
                                notAuthorized();
                              }
                            }}
                          >
                            Add Cafe / E-Commerce Platform
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Filters Section */}
                    <div className="mb-3 p-3 bg-light border rounded shadow-sm d-flex flex-wrap align-items-center gap-3 justify-content-between">
                      {/* Name Filter */}
                      <div className="flex-grow-1">
                        <label className="small fw-semibold text-success d-block mb-1">Name</label>
                        <select className="form-select form-select-sm border-secondary-subtle shadow-sm"
                          value={filters.name}
                          onChange={(e) => handleFilterChange("name", e.target.value)}>
                          <option value="">All</option>
                          {Array.from(new Set(cafeData.map(({ data }) => data.cafe_name))).map((name, index) => (
                            <option key={index} value={name}>{name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Delivery Hub Filter */}
                      <div className="flex-grow-1">
                        <label className="small fw-semibold text-success d-block mb-1">Delivery Hub</label>
                        <select className="form-select form-select-sm border-secondary-subtle shadow-sm"
                          value={filters.hub}
                          onChange={(e) => handleFilterChange("hub", e.target.value)}>
                          <option value="">All</option>
                          {Array.from(new Set(cafeData.map(({ data }) => data.delivery_hub))).map((hub, index) => (
                            <option key={index} value={hub}>{hub}</option>
                          ))}
                        </select>
                      </div>

                      {/* Type Filter */}
                      <div className="flex-grow-1">
                        <label className="small fw-semibold text-success d-block mb-1">Type</label>
                        <select className="form-select form-select-sm border-secondary-subtle shadow-sm"
                          value={filters.type}
                          onChange={(e) => handleFilterChange("type", e.target.value)}>
                          <option value="">All</option>
                          {Array.from(new Set(cafeData.map(({ data }) => data.type))).map((type, index) => (
                            <option key={index} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>

                      {/* Clear Filters Button */}
                      <div className="text-end">
                        <button
                          className="btn btn-sm btn-outline-danger fw-semibold px-3"
                          onClick={handleClearFilters}
                        >
                          Reset Filters
                        </button>
                      </div>
                    </div>


                    {/* Summary */}
                    <DeliveryStats date={date} setDate={setDate} summary={summary} setShowCalendar={setShowCalendar} loadingSummary={loadingSummary} />


                    {/* Table */}
                    <div className="table-responsive">
                      <table className="table table-hover table-bordered">
                        <thead className="table-dark text-center align-middle">
                          <tr>
                            <th style={{ textAlign: "left" }}>Name</th>
                             <th>Place Order</th>
                             <th>order History</th>

                             
                            <th style={{ textAlign: "left" }}>Buyer Name</th>
                            <th>Address</th>
                            <th>Delivery Hub</th>
                            {/* <th>Place Order</th> */}
                           
                            <th>Action</th>
                            <th>Type</th>
                          </tr>
                        </thead>

                        <tbody>
                          {filteredCafeData?.map(({ id, data }) => (
                            <tr key={id} className={data.type === "Cafe" ? "table-light" : "table-primary"}>
                              {/* Cafe / E-commerce Icon + Name */}
                              <td style={{ textAlign: "left" }}>
                                <div className="d-flex align-items-center gap-2">
                                  {data.type === "Cafe" ? (
                                    <FaStore size={18} color="#ff9800" />
                                  ) : (
                                    <FaShoppingCart size={18} color="#3f51b5" />
                                  )}
                                  <span>{data.cafe_name}</span>
                                </div>
                              </td>
                                 {/* Place Order Button */}
                              <td className="text-center">
                                <button className="btn btn-outline-dark btn-sm d-flex align-items-center gap-1" onClick={() => placeOrder(data, id)}>
                                  <FaShoppingBag /> Place Order
                                </button>
                              </td>
                              {/* Order History Button */}
                              <td className="text-center">
                                <button className="btn btn-outline-info btn-sm d-flex align-items-center gap-1" onClick={() => viewOrders(data, id)}>
                                  <FaHistory /> View Orders
                                </button>
                              </td>

                              <td style={{ textAlign: "left" }}>
                                <span>{data.buyer_name}</span>
                              </td>

                              {/* Address */}
                              <td className="text-center">{data.cafe_location || data.cafe_address}</td>

                              {/* Delivery Hub */}
                              <td className="text-center">{data.delivery_hub}</td>

                              

                              {/* Edit & Delete Actions */}
                              <td className="text-center">
                                <button className="btn btn-warning btn-sm me-2" onClick={() => editCafe(data, id)}>
                                  <FaEdit />
                                </button>
                                {/* <button className="btn btn-danger btn-sm" onClick={() => deleteCafe(id, data.cafe_name)}>
                                  <FaTrash />
                                </button> */}
                              </td>

                              {/* Type Column with Badge */}
                              <td className="text-center">
                                <span className={`badge ${data.type === "Cafe" ? "bg-warning text-dark" : "bg-primary"}`}>
                                  {data.type}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                  </div>
                </div>
              </div>
              <div class="modal cafe fade" tabindex="-1" role="dialog" style={{ overflow: 'hidden' }}>
                <div role="document" className="modal-dialog modal-lg d-flex justify-content-center align-items-center p-4 m-4" >
                  <div class="modal-content">
                    <CreateCafeModal cafeData={cafeData} formData={formData.type === "Cafe" ? formData?.hasOwnProperty("cafe_address") ? formData : { ...formData, cafe_address: formData?.cafe_location } : formData} setFormData={setFormData} initialFormState={initialFormState} loggedInUser={loggedInUser}
                      edit={edit} docId={docId} fetchCafeDetails={fetchCafeDetails} />
                  </div>
                </div>
              </div>
              <div class="modal order fade" tabindex="-1" role="dialog">
                <div class="modal-dialog modal-md" role="document" style={{ marginTop: "10px" }}>
                  <div class="modal-content" >
                    <PlaceOrderModal orderFormData={formData} />
                  </div>
                </div>
              </div>
              <div class="modal oh fade" tabindex="-1" role="dialog" style={{ overflow: 'hidden' }}>
                {/* <div class="modal-dialog modal-lg" role="document"> */}
                <div role="document" className="modal-dialog modal-lg d-flex justify-content-center align-items-center p-4 m-4" >
                  <div class="modal-content">
                    <ViewCafeOrders rowData={rowData} />
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

export default CafeManagement;



const SummaryCard = ({ title, value, color = "", bgHover = "", isLoading = false }) => (
  <div
    className={`flex-grow-1 card text-center shadow-sm border-0 h-100 transition-all ${color} ${bgHover}`}
    style={{
      borderRadius: '15px',
      minWidth: 'min(220px, 100%)',
    }}
  >
    <div className="card-body p-3">
      <h5 className="card-title mb-2 text-muted fw-bold fs-6">{title}</h5>
      {!isLoading ? (
        <h2 className="card-text fw-bold">{value}</h2>
      ) : (
        <div className="spinner-border text-secondary" role="status" style={{ width: '1.5rem', height: '1.5rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
      )}
    </div>
  </div>
);


const DeliveryStats = ({ date, setDate, summary, setShowCalendar ,loadingSummary}) => {
  const cardData = [
    {
      title: 'Total Orders',
      value: summary[3],
      color: 'text-primary',
      bgHover: 'bg-light-primary',
    },
    {
      title: 'Delivered',
      value: summary[0],
      color: 'text-success',
      bgHover: 'bg-light-success',
    },
    {
      title: 'Pending',
      value: summary[1],
      color: 'text-warning',
      bgHover: 'bg-light-warning',
    },
    {
      title: 'Cancelled',
      value: summary[2],
      color: 'text-danger',
      bgHover: 'bg-light-danger',
    },
  ];

  return (
    <div
      className="card mb-4 shadow-sm bg-light"
      style={{ borderRadius: '15px' }}
    >
      <div className="container my-3 my-md-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
          <h4 className="text-primary fw-bold mb-0">Delivery Stats</h4>
          <div className="input-group input-group-sm" style={{ maxWidth: '200px', flexWrap: "nowrap" }}>
            <span className="input-group-text" style={{ flexWrap: "nowrap" }}>Date
            </span>
            <DatePicker
              selected={date}
              onChange={setDate}
              dateFormat="dd-MM-yyyy"
              placeholderText="Select a date"
              className="form-control form-control-sm"
              onClickOutside={() => setShowCalendar(false)}
              aria-label="Select date for delivery stats"
            />
          </div>
        </div>
        <div className="d-flex flex-column gap-4">
          <div className="d-flex flex-wrap justify-content-between gap-3">
            {cardData.map((card, index) => (
              <SummaryCard
                key={index}
                title={card.title}
                value={card.value}
                color={card.color}
                bgHover={card.bgHover}
                isLoading={loadingSummary}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
