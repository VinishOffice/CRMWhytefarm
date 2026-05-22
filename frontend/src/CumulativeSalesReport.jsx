import React, { useState, useEffect,useContext } from 'react';
import DatePicker from 'react-datepicker';
import Select from 'react-select';
import 'react-datepicker/dist/react-datepicker.css';
import { useNavigate } from 'react-router-dom';
import ExportTableToExcel from './ExportTableToExcel';
import { Button,Alert } from 'react-bootstrap';
import GlobalContext from './context/GlobalContext';
import { handleLogout } from './Utility';
import { fetchReportOptions, fetchCumulativeSalesReport } from "./services/reportsOperationsService";

const CumulativeSalesReport = () => {
    const {permissible_roles} = useContext(GlobalContext);
    const navigate = useNavigate();
    useEffect(() => {
        const loggedIn = localStorage.getItem("loggedIn") === "true";
        if (!loggedIn) {
            navigate("/login");
        }else{
            if(permissible_roles.length>0){
                if(!permissible_roles.includes('cumalative_sales_report')){
                    handleLogout()
                    navigate("/permission_denied");
                }
            }
        }
    }, [navigate,permissible_roles]);
    const [selectedHub, setSelectedHub] = useState('');
    const [dataLoaded, setDataLoaded] = useState(false);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [endDateQuery, setEndDateQuery] = useState(null);
    const [hubNames, setHubNames] = useState([]);
    const [showNodataFound, setshowNodataFound] = useState(false);
    const [fileName, setFileName] = useState("");
    const [deliveryExecutiveNames, setDeliveryExecutiveNames] = useState([]);
    const [selectedDeliveryExecutive, setSelectedDeliveryExecutive] = useState();
    const [showSpinner, setShowSpinner] = useState(false);
    const [cumulativeSalesData, setCumulativeSalesData] = useState([]);
    const [initialValue, setInitialValue] = useState("");
    const [grandTotalQuantity, setGrandTotalQuantity] = useState(0);
    const [grandTotalPrice, setGrandTotalPrice] = useState(0);
    const [grandTotal, setGrandTotal] = useState({ quantity: 0, price: 0 });

    const moment = require('moment');


    useEffect(() => {
        fetchReportOptions()
            .then((resp) => {
                setHubNames((resp.hubs || []).map((h) => ({ label: h, value: h })));
            })
            .catch((e) => console.error(e));
    }, []);

    useEffect(() => {
        const fetchDeliveryExeList = async () => {

            try {
                if (!selectedHub) {
                    setDeliveryExecutiveNames([]);
                    return;
                }
                const resp = await fetchReportOptions();
                const de = (resp.deliveryExecutives || [])
                    .filter((d) => d.hub_name === selectedHub.value)
                    .map((d) => ({ value: `${d.hub_user_id}`, label: d.name }));
                setDeliveryExecutiveNames(de);
            } catch (error) {
                console.error("Error fetching delivery executive:", error);
            }
        };

        fetchDeliveryExeList();
    }, [selectedHub]);

    // useEffect(() => {

    // }, [endDate]);
    const handleStartDateChange = (date) => {

        if (date) {
            const updatedEndDate = new Date(date);
            //updatedEndDate.setDate(updatedEndDate.getDate() - 1);
            updatedEndDate.setHours(0, 0, 0, 0);
            setStartDate(updatedEndDate);
            //setEndDate(updatedEndDate);
        }
    }

    const handleEndDateChange = (date) => {

        if (date) {
            const updatedEndDate = new Date(date);
            //updatedEndDate.setDate(updatedEndDate.getDate() - 1);
            updatedEndDate.setHours(23, 59, 59, 999); // Set the time to 11:59:59 PM
            setEndDateQuery(updatedEndDate);
            setEndDate(updatedEndDate);
        }
    }

    useEffect(() => {
        if (dataLoaded && cumulativeSalesData.length > 0) {
            const totals = cumulativeSalesData.reduce((totals, sale) => {
                totals.quantity += sale.quantity;
                totals.price += sale.totalSellingPrice;
                return totals;
            }, { quantity: 0, price: 0 });
            setGrandTotal(totals);
        } else {
            setGrandTotal({ quantity: 0, price: 0 });
        }
    }, [dataLoaded, cumulativeSalesData]);

  
    const handleSearch = async () => {
        const startDateString = moment(new Date()).format('DD-MM-YYYY');
        setFileName(`cumulative_Sales_report_${startDateString}`);
        setshowNodataFound(false);
        setShowSpinner(true);
        setDataLoaded(false);
        setInitialValue("");
        let grandTotalQuantity = 0;
        let grandTotalPrice = 0;

        try {
            const resp = await fetchCumulativeSalesReport({
                startDate: startDate?.toISOString(),
                endDate: endDateQuery?.toISOString(),
                hubName: selectedHub?.value,
                deliveryExeId: selectedDeliveryExecutive?.value,
            });

            const rows = resp.data || [];
            if (rows.length === 0) {
                setInitialValue("No Data Found");
                setShowSpinner(false);
                setDataLoaded(false);
                setCumulativeSalesData([]);
                return;
            }

            setCumulativeSalesData(rows);
            setDataLoaded(true);
            setGrandTotalPrice(resp.totals?.price || 0);
            setGrandTotalQuantity(resp.totals?.quantity || 0);
            setShowSpinner(false);
        } catch (error) {
            console.error("Error fetching data:", error);
            setShowSpinner(false);
        }
    };
    const handleDEchange = async (selectedOption) => {
        setSelectedDeliveryExecutive(selectedOption);
    };

    const handleReset = () => {
        setStartDate(null);
        setEndDate(null);
        setSelectedHub("");
        setSelectedDeliveryExecutive("");
        setshowNodataFound(false);
        setCumulativeSalesData("");
        setDataLoaded(false);
        setInitialValue("");

    };
    const downloadCSV = () => {
        const csvData = [];
        const headers = ["Sr No.", "Product", "Package", "Unit Price", "Total Quantity", "Total Price"];
        csvData.push(headers.join(",")); // Add headers
    
        cumulativeSalesData.forEach((sale, index) => {
            const row = [
                index + 1, 
                sale.product_name, 
                sale.package_unit, 
                sale.price, 
                sale.quantity, 
                sale.totalSellingPrice
            ];
            csvData.push(row.join(",")); // Add each row
        });
    
        // Create a Blob from the CSV data and trigger a download
        const blob = new Blob([csvData.join("\n")], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${fileName}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    // Inside your render method
    
    
    return (
        <>
            {showSpinner && ( // Render loader when loading state is true
                <div className="loader-overlay">
                    <div className="">
                        <img style={{
                            height: "6rem"
                        }} src="images/loader.gif"></img>
                    </div>
                </div>
            )}
            <div class="container-scroller">
                <div class="container-fluid">
                    <div class="main-panel" style={{ width: '100%' }}>
                    <div className='panel' style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
                    <div>
                        <span style={{ fontSize: "18px", color: "#288a84", fontWeight: "700", marginTop: "12px" }}>CUMULATIVE SALES REPORT</span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}> {/* Added flexbox and gap to align buttons */}
                        {dataLoaded && (
                        <>
                            <ExportTableToExcel
                            tableId="cumulativeSalesReportTable"
                            fileName={fileName}
                            />
                            <Button variant="outline-success" onClick={downloadCSV} size="sm">
                            Export CSV
                            </Button>
                        </>
                        )}
                    </div>
                    </div>


                        <div className="panel" style={{ marginTop: '10px' }}>
                            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '85%' }}>
                                <div style={{ marginTop: '10px' }}>
                                    <label>Hub Name</label>
                                    <br />
                                    <Select
                                        options={hubNames}
                                        onChange={value => setSelectedHub(value)}
                                        value={selectedHub}
                                        placeholder="Select Hub Name"
                                    />
                                </div>
                                <div className='inputPanels'>
                                    <label>Delivery Executive</label>
                                    <Select
                                        options={deliveryExecutiveNames}
                                        onChange={handleDEchange}
                                        value={selectedDeliveryExecutive}
                                        placeholder="Select Delivery Executive"
                                        required
                                    />
                                </div>
                                <div className='inputPanels'>
                                    <label>From </label>
                                    <br />
                                    <DatePicker
                                        selected={startDate}
                                        onChange={handleStartDateChange}
                                        maxDate={endDate}
                                        dateFormat="dd/MM/yyyy"
                                        className="datepicker-input"
                                        placeholderText="Enter From date"
                                    />
                                </div>
                                <div className='inputPanels'>
                                    <label>To</label>
                                    <br />
                                    <DatePicker
                                        selected={endDate}
                                        minDate={startDate}
                                        onChange={handleEndDateChange}
                                        dateFormat="dd/MM/yyyy"
                                        className="datepicker-input"
                                        placeholderText="Enter To date"
                                    />
                                </div>
                                <div className='inputPanels' style={{ marginTop: '30px' }}>
                                    <Button variant="outline-success"
                                        onClick={handleSearch}
                                        size="sm"
                                    >
                                        Search
                                    </Button>
                                    <Button
                                        variant="outline-success"
                                        onClick={handleReset}
                                        style={{ marginLeft: "10px" }}
                                        size="sm"
                                    >
                                        Reset
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <div className='panel' style={{ marginTop: '10px' }}>
                            <div className="panel2">
                                <div className="table-responsive">
                                    <table className="table" id="cumulativeSalesReportTable">
                                        <thead>
                                            <tr>
                                                <th>Sr No.</th>
                                                <th>Product</th>
                                                <th>Package</th>
                                                <th>Unit Price</th>
                                                <th>Total Quantity</th>
                                                <th>Total Price</th>
                                                {/* <th>Discounted Price</th> */}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dataLoaded ? (cumulativeSalesData.map((sale, index) => (
                                                <>
                                                    <tr>
                                                        <td>{index + 1}</td>
                                                        <td>{sale.product_name}</td>
                                                        <td>{sale.package_unit}</td>
                                                        <td>{sale.price}</td>
                                                        <td>{sale.quantity}</td>
                                                        <td>{sale.totalSellingPrice}</td>
                                                        {/* <td>0.00</td> */}
                                                    </tr>
                                                </>

                                            ))) : (
                                                <tr>
                                                    <td colSpan="6" style={{ textAlign: "center" }}>{initialValue}</td>
                                                </tr>
                                            )

                                            }
                                            {dataLoaded && cumulativeSalesData.length > 0 && (
                                                <tr>
                                                    <td colSpan="4" style={{ textAlign: "right", fontWeight: "bold" }}>Grand Total</td>
                                                    <td style={{ fontWeight: "bold" }}>{grandTotal.quantity}</td>
                                                    <td style={{ fontWeight: "bold" }}>{grandTotal.price}</td>
                                                </tr>
                                            )}

                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        <Alert show={showNodataFound} variant="success">
                            <Alert.Heading>No data found for selected criteria</Alert.Heading>
                            <div className="d-flex justify-content-end">
                                <Button onClick={() => setshowNodataFound(false)} variant="outline-success">
                                    Close
                                </Button>
                            </div>
                        </Alert>
                    </div>
                </div>
            </div>




        </>
    );
};

export default CumulativeSalesReport;
