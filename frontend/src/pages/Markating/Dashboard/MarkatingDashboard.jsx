import React, { useState, useEffect, useMemo } from "react";
import TopPanel from "../../../TopPanel";
import Sidebar from "../../../Sidebar";
import Footer from "../../../Footer";
import { addCartData, fetchCartData, fetchProductsList } from "../query";
import { CartMatrix, mapCartProducts } from "./fucntions";
import { DateTimeUtil, TimeAgo } from "../../../Utility";
import CustomDateRangePicker from "../../../components/CustomDateRangePicker";
import moment from "moment";
import apiClient from "../../../services/apiClient";


const MarkatingDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [pureData, setPureData] = useState([]);
  const [rawData, setRawData] = useState([]);
  const [details, setDetails] = useState(null);
  const [detailsMatrix, setDetailsMatrix] = useState(null);
  const [columns, setColumns] = useState([]);
  const [exportData, setExportData] = useState([["No Data Found"]]);
  const [selectedProduct, setSelectedProduct] = useState("All Product");
  const [productList, setProductList] = useState([]);
  const [exportSelectedData, setExportSelectedData] = useState([[]]);






  const [today] = useState(moment(Date()).format("YYYY-MM-DD"));
  const [dateRange, setDateRange] = useState({ start: today, end: today });
  const handleDateChange = (startDate, endDate) => {
    setDateRange({ start: moment(startDate).format("YYYY-MM-DD"), end: moment(endDate).format("YYYY-MM-DD") });
  };


const getCustomerDetailsFromFirestore = async (customer_id) => {
  try {
    const docs = await apiClient.post("/api/customers_data/query", {
      filters: [{ field: "customer_id", op: "==", value: customer_id }]
    }).then(res => res.data?.data || []);
    
    if (docs.length > 0) {
      const data = docs[0];
      
      return {
        name: data.customer_name || "N/A",
        phone: data.customer_phone || data.alt_phone || "N/A",
      };
    }
               
    return { name: "N/A", phone: "N/A" };
    
  } catch (err) {
    console.error("Error fetching customer details:", err);
    return { name: "Error", phone: "Error" };
  }
};

  


useEffect(() => {
  const updateDetailsWithCustomerInfo = async () => {
    const updated = await Promise.all(
      rawData.map(async (row) => {
        if (row.customer_id) {

          const info = await getCustomerDetailsFromFirestore(row.customer_id);
          return {
            ...row,
            customer_name: info.name,
            customer_phone: info.phone,
          };
        }
        return row;
         

      })
       
    );
 
    setRawData(updated.filter(item=>item));
       
    
     // update the state to trigger re-render
  };

  if (rawData && rawData.length > 0) {
    updateDetailsWithCustomerInfo();
  }
}, [rawData]);


  // Memoized table headers based on the selected product
  const tableHeader = useMemo(() => {
    if (selectedProduct === "All Product") {
      return [
        "Customer ID",
        "Customer Name",
        "Customer Phone",
        ...(Array.isArray(productList)
          ? productList.filter((product) => product !== "All Product")
          : []),
        "Total Quantity",
      ];
    } else {
      return [
        "Customer ID",
        "Customer Name",
        "Customer Phone",
        `${selectedProduct}`,
      ];
    }
  }, [selectedProduct, productList]);

  // Prepare table data based on the selected product
  const tableData = useMemo(() => {
    if (!details || !selectedProduct) {
      return [["No data found"]];
    }

    const customerList =
      selectedProduct === "All Product"
        ? details["Total Quantity"]?.customer_list || []
        : details[selectedProduct]?.customer_list || [];

    return customerList.map((customer) => {
      const row = [
        customer.customer_id || "N/A",
        customer.customer_name || "N/A",
        customer.
          customer_phone
        || "N/A",
      ];

      const sortedProducts = productList
        .filter((product) => product !== "All Product")
        .sort();

      sortedProducts.forEach((product) => {
        const productData = customer.products.find(
          (p) => p.product_name === product
        );
        row.push(productData ? productData.quantity : 0);
      });

      if (selectedProduct === "All Product") {
        row.push(row.slice(3).reduce((total, value) => total + (Number(value) || 0), 0));
      }

      return row;
    });
  }, [details, selectedProduct, productList]);

  // Sync table data with export data
  useEffect(() => {
    setExportData(tableData);
  }, [tableData]);

  // Prepare export-selected data based on selected product
  useEffect(() => {
    const prepareExportData = () => {
      if (!exportData || selectedProduct === "All Product") {
        setExportSelectedData(exportData);
        return;
      }

      const productIndex = productList.indexOf(selectedProduct);
      const data = exportData.map((row) => [
        row[0],
        row[1],
        row[2],
        row[productIndex + 3] || 0,
      ]);

      setExportSelectedData(data);
    };

    prepareExportData();
  }, [selectedProduct, exportData, productList]);

  // Fetch data and initialize state
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await fetchCartData();

        if (data) {
          setPureData(data)

        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);


  useEffect(() => {
    if (pureData.length > 0) {
      const filteredData = pureData
        .map((customer) => {
          const filteredProducts = Array.isArray(customer.products) ? customer.products.filter(
            (product) =>
              product.Timestamp &&
              DateTimeUtil.timestampToISOHyphenDate(new Date(product.Timestamp)) >= dateRange.start &&
              DateTimeUtil.timestampToISOHyphenDate(new Date(product.Timestamp)) <= dateRange.end
          ) : [];

          return filteredProducts.length > 0 ? { ...customer, products: filteredProducts } : null;
        })
        .filter((customer) => customer !== null);

      if (filteredData.length > 0) {
        setRawData(filteredData);
        const productCustomerMap = mapCartProducts(filteredData);
        if (productCustomerMap) {
          setDetails(productCustomerMap);
        }
      }
    }
  }, [dateRange, pureData]); // Added pureData to dependencies

  // Generate product list
  useEffect(() => {
    if (details) {
      const products = Object.keys(details).filter(
        (key) => key !== "Total Quantity"
      );
      setProductList(["All Product", ...products.sort()]);
    }
  }, [details]);

  // Set columns for the matrix
  useEffect(() => {
    if (productList?.length > 0) {
      const filteredProducts = productList.filter((p) => p !== "All Product");

      const expandedColumns = filteredProducts.flatMap((p) => [
        p,
        `${p} added on`,
        // `${p} added at`,
      ]);

      setColumns([
        "Customer ID",
        "Customer Name",
        "Customer Phone",
        ...expandedColumns,
        "Total Quantity",
      ]);
    }
  }, [productList]);


  // Generate details matrix
  useEffect(() => {
    if (columns.length > 0 && rawData) {
      const matrixData = CartMatrix(rawData, columns);
      setDetailsMatrix(matrixData);
    }
  }, [columns, rawData]);

  // Utility to convert data to CSV format
  const convertToCSV = (data) =>
    data.map((row) => row.join(",")).join("\n");

  const formatDataForCSV = () => {
    if (selectedProduct === "All Product") {
      // Return all data for "All Product" selection
      const filteredProducts = productList.filter((p) => p !== "All Product");

      const expandedColumns = filteredProducts.flatMap((p) => [
        p,
        `${p} added on`,
      ]);
      return [
        [
          "Customer ID",
          "Customer Name",
          "Customer Phone",
          ...expandedColumns,
          "Total Quantity",
        ],
        ...(detailsMatrix?.data || [["No Data Found"]]),
      ];
    } else {
      // Prepare data for individual product selection
      const exportData = [];

      if (details && selectedProduct && selectedProduct !== "All Product") {
        const customerList = details[selectedProduct]?.customer_list || [];

        customerList.forEach((customer) => {
          // Base row with customer information
          const newRow = [
            customer.customer_name || "N/A",
            customer.customer_id || "N/A",
            customer.
customer_phone
|| "N/A",
          ];

          // Find and add details for the selected product
          customer.products.forEach(({ product_name, quantity, Timestamp, subscriptionType }) => {
            if (selectedProduct === product_name) {
              exportData.push([
                ...newRow,
                quantity || 0,
                Timestamp ? `${DateTimeUtil.timestampToDate(Timestamp)}  ${DateTimeUtil.timestampToTimeAMPM(Timestamp)}` : "-",
                subscriptionType || "-",
              ]);
            }
          });
        });
      }

      // Add column headers dynamically
      return [
        ["Customer Name", "Customer ID", "Customer Phone", "Quantity", "Date", "Subscription Type"],
        ...exportData,
      ];
    }
  };


  // Export data as a CSV file
  const exportToCSV = () => {
    const csvData = convertToCSV(formatDataForCSV());
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "abandoned_cart_data.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return (
    <>
      {loading && <Loader />}
      <div className="container-scroller">
        <TopPanel />
        <div className="container-fluid page-body-wrapper">
          <Sidebar />
          <div className="main-panel">
            <div className="content-wrapper">
              <div className="home-tab d-flex justify-content-between align-items-start my-2">
                <h3 className="fw-bold text-primary border-bottom pb-2 mb-0">
                  Cart Products
                </h3>
                <div className="d-flex flex-column justify-content-start align-items-end my-2">
                  <button
                    className="btn btn-primary ms-3" style={{ color: "white" }}
                    onClick={exportToCSV}
                    disabled={loading || exportSelectedData.length === 0}
                  >
                    Export to CSV
                  </button>
                  <CustomDateRangePicker onDateChange={handleDateChange} />


                </div>
              </div>
              <div className="home-tab">
                <div className="tab-content tab-content-basic">
                  <div
                    className="tab-pane fade show active"
                    id="overview"
                    role="tabpanel"
                    aria-labelledby="overview"
                  >
                    <div className="d-flex justify-content-start gap-3 flex-wrap">
                      <Card
                        key={-1}
                        title={details ? details["Total Quantity"].title : "Total Quantity"}
                        value={details ? details["Total Quantity"].quantity : "0"}
                        onClick={() => setSelectedProduct("All Product")}
                        selected={selectedProduct === "All Product"}
                      />
                      {details && (
                        <>
                          {Object.entries(details).map(
                            ([key, value], index) =>
                              key !== "Total Quantity" && (
                                <Card
                                  key={index}
                                  title={value.title}
                                  value={value.quantity}
                                  selected={selectedProduct === value.title}
                                  onClick={() => setSelectedProduct(value.title)}
                                />
                              )
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {details ? (
                <div className="row">
                  <div className="d-flex flex-column">
                    <div className="row flex-grow">
                      <DetailedCard
                        details={details}
                        rawData={rawData}
                        selectedProduct={selectedProduct}
                        setSelectedProduct={setSelectedProduct}
                        productList={productList}
                      />
                    </div>
                  </div>
                </div>
              )
                :
                <div className="row">
                  <div className="d-flex flex-column">
                    <div className="row flex-grow">
                      <EmptyDetailedCard />
                    </div>
                  </div>
                </div>

              }
            </div>
            <Footer />
          </div>
        </div>
      </div>
    </>
  );
};

const Loader = () => (
  <div className="loader-overlay">
    <div>
      <img alt="loader" style={{ height: "6rem" }} src="images/loader.gif" />
    </div>
  </div>
);

const Card = ({ title, value, selected, onClick }) => (
  <div
    className={`card d-flex align-items-start m-2 ${selected ? "text-white border border-light" : ""
      }`}
    style={{
      cursor: "pointer",
      minWidth: "100px",
      backgroundColor: selected ? "#84BF93" : "",
    }}
    onClick={onClick}
  >
    <div className="card-body w-100">
      <p
        className="statistics-title text-end font-bold"
        style={{ fontSize: "1rem" }}
      >
        {title}
      </p>
      <h3 className="rate-percentage text-end">{value}</h3>
    </div>
  </div>
);

const DetailedCard = ({
  details,
  selectedProduct,
  setSelectedProduct,
  productList,
  rawData,
  
  
}) => {
  const getCustomersToDisplay = () => {
    return selectedProduct === "All Product"
      ? details["Total Quantity"]?.customer_list || []
      : details[selectedProduct]?.customer_list || [];
      
      
  };

  const customersToDisplay = getCustomersToDisplay();

  return (
    <div className="col-lg-12 grid-margin stretch-card">
      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center">
              <h4 className="card-title me-2">Product:</h4>
              <select
                className="form-select"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                style={{ width: "200px" }}
              >
                {productList.map((product, index) => (
                  <option key={index}>{product}</option>
                ))}
              </select>
            </div>
            <h4 className="card-title">
              Total Customer: {customersToDisplay.length}
            </h4>
          </div>
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th className="text-center">Customer ID</th>
                  <th className="text-center">Customer Name</th>
                  <th className="text-center">Quantity</th>
                  {selectedProduct !== "All Product" && <th className="text-center">Subscription Type</th>}
                  <th className="text-center">Customer Phone</th>
                  {selectedProduct !== "All Product" && <th className="text-center">Duration</th>}
                  {selectedProduct !== "All Product" && <th className="text-center">Date & Time</th>}
                </tr>
              </thead>
              <tbody>

                 {rawData && rawData.length > 0 ? (
  rawData.map((row, index) => (
    <TableRow
      key={index} // Prefer using row.id if available
      row={row}
      selectedProduct={selectedProduct}
    />
  ))
) : (
  <tr>
    <td colSpan="6" className="text-center">
      No orders found.
    </td>
  </tr>
)}

              
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
const EmptyDetailedCard = ({ }) => {

  return (
    <div className="col-lg-12 grid-margin stretch-card">
      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center">
              <h4 className="card-title me-2">Product:</h4>
              <select
                className="form-select"
                value="All Product"
                style={{ width: "200px" }}
              >
                <option>All Product</option>
              </select>
            </div>
            <h4 className="card-title">
              Total Customer: 0
            </h4>
          </div>
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th className="text-center">Customer ID</th>
                  <th className="text-center">Customer Name</th>
                  <th className="text-center">Quantity</th>
                  <th className="text-center">Subscription Type</th>
                  <th className="text-center">Customer Phone</th>
                  <th className="text-center">Duration</th>
                  <th className="text-center">Date & Time</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="7" className="text-center">
                    No orders found.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const TableRow = ({ row, selectedProduct }) => {
  const [expandRow, setExpandRow] = useState(false);
  

  const handleRowClick = () => {
    if (selectedProduct === "All Product") {
      setExpandRow(!expandRow);
    } else {
      setExpandRow(false);
    }
  };

  useEffect(()=>{
    return ()=>{
      setExpandRow(false);
    }
  },[])




  const goTOCUstomerProfile = (customer_id) => {
    window.open(`/profile/${customer_id}`, "_blank");
  };
  return (
    <>
      {
        selectedProduct === "All Product" ? (
          <tr className="hover-highlight">
            <td  onClick={handleRowClick} className="text-center">{row.customer_id}</td>
            <td onClick={()=>{goTOCUstomerProfile(row.customer_id)}} className="text-center">{row.customer_name || "N/A"}</td>


            <td  onClick={handleRowClick}  className="text-center">
              {row.products.reduce((acc, product) => acc + product.quantity, 0)}
            </td>
            <td  onClick={handleRowClick} className="text-center">{row.customer_phone || "N/A"}</td>

          </tr>

        ) : (
          <>
            {row.products
            
              .filter((product) => product.product_name === selectedProduct)
              .map((product, index) => (
                <tr className="hover-highlight" key={index} onClick={()=>{handleRowClick(); goTOCUstomerProfile(row.customer_id);}}>

                  <td className="text-center">{row.customer_id}</td>
                  <td className="text-center">{row.customer_name || "N/A"}</td>
                  <td className="text-center">{product.quantity}</td>
                  <td className="text-center">{product.subscriptionType || "-"}</td>
                  <td className="text-center">{row.customer_phone || "N/A"}</td>
                  <td className="text-center">
                    {product.Timestamp ? TimeAgo.fromTimestamp(product.Timestamp) : "-"}
                  </td>
                  <td className="text-center">
                    {product.Timestamp ? DateTimeUtil.timestampToDate(product.Timestamp) + " " + DateTimeUtil.timestampToTimeAMPM(product.Timestamp) : "-"}
                  </td>
                </tr>
                

              ))
             
              }
              

                                        
          </>
        )
      }
      



      {expandRow && (
        <tr className="hover-highlight" style={{ background: "#f8f9fa" }}>
          <td colSpan="4" className="p-2">
            {row.products && row.products.length > 0 ? (
              <ul className="d-flex flex-wrap mx-4 justify-content-start p-1 list-unstyled">
                {row.products.map(({ product_name, quantity, Timestamp, subscriptionType }, index) => (
                  <li key={index} className="m-1" style={{ flex: "0 1 auto" }}>
                    <div
                      className="card d-flex flex-row align-items-center justify-content-between p-3 shadow-sm gap-2"
                      style={{ maxWidth: "250px" }}
                    >
                      <div className="d-flex flex-column align-items-start" style={{ flex: "1" }}>
                        <p className="statistics-title mb-0 text-truncate fw-bold">{product_name}</p>
                        <span className="text-muted">{subscriptionType || "-"}</span>
                      </div>

                      <div className="d-flex flex-column align-items-end" style={{ flex: "1" }}>
                        <h3 className="rate-percentage text-end mb-0 fw-bold">{quantity}</h3>
                        <span className="text-muted">{Timestamp ? TimeAgo.fromTimestamp(Timestamp) : "-"}</span>
                      </div>
                    </div>
                  </li>

                ))}
              </ul>
            ) : (
              <p>Can't find any product</p>
            )}
          </td>
        </tr>
      )}
    </>
  );
};

export default MarkatingDashboard;
