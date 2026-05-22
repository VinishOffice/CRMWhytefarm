import React, { useState, useEffect,useContext } from 'react';
import Moment from "moment";
import { extendMoment } from "moment-range";
import ExportTableToExcel from './ExportTableToExcel';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import GlobalContext  from './context/GlobalContext';
import { handleLogout } from './Utility';
import { fetchPredictiveAnalysis } from "./services/analyticsOperationsService";
function PredictiveAnalysis () {
  const {permissible_roles} = useContext(GlobalContext);

  const navigate = useNavigate();

  useEffect(() => {
    const loggedIn = localStorage.getItem("loggedIn") === "true";
    if (!loggedIn) {
      navigate("/login");
  }else{
      if(permissible_roles.length>0){
          if(!permissible_roles.includes('predictive_analysis')){
              handleLogout()
              navigate("/permission_denied");
          }
      }
  }
  }, [navigate,permissible_roles]);

  const moment = extendMoment(Moment);
  const [cummulativeHubDeliveryList, setCummulativeHubDeliveryList] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  //const [analysisDate, setAnalysisDate] = useState(new Date());
  const [fileName, setFileName] = useState('');

  const [calendarMap, setCalendarMap] = useState(new Map());

  const calculatePredictAnalysisQty = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const resp = await fetchPredictiveAnalysis({ date: tomorrow.toISOString() });
      setCummulativeHubDeliveryList(resp.data || []);
      setDataLoaded(true);
      createFileName();
    } catch (error) {
      console.error("Error calculating predictive analysis:", error);
      setCummulativeHubDeliveryList([]);
      setDataLoaded(false);
    } finally {
      setLoading(false);
    }
  };
    

    useEffect (()=> {
       calculatePredictAnalysisQty();

    },[]);


    const createFileName = () => {
        const today= new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const startDateString = moment(tomorrow).format('DD-MM-YYYY');
        setFileName(`Hub_deliveries_${startDateString}`);
      }
      /** export pdf */
      const exportToPDF = () => {
        const doc = new jsPDF();
        const tableColumn = [
          "SR.NO",
          "Date",
          "Day",
          "Product",
          "Packaging",
          "Unit Price",
          "Total Quantity	",
        ];
        const tableRows = cummulativeHubDeliveryList.map((customer ,index) => [
            index + 1,
            customer.analysisDate,
            customer.day,
            customer.product_name,
            customer.packaging,
            customer.unit_price,
            customer.quantity
        ]);
        doc.autoTable({
          head: [tableColumn],
          body: tableRows,
        });
    
        doc.save("PredictiveReport.pdf");
      };


      const exportToCSV = () => {
        const csvRows = [];
        // Add header
        csvRows.push(['Date', 'Day', 'Product', 'Packaging', 'Unit Price', 'Total Quantity'].join(','));

        // Add data
        for (const delivery of cummulativeHubDeliveryList) {
            const row = [
                delivery.analysisDate,
                delivery.day,
                delivery.product_name,
                delivery.packaging,
                delivery.unit_price,
                delivery.quantity
            ].join(',');
            csvRows.push(row);
        }

        // Create a CSV blob and download it
        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `${fileName}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

  return (
    <>
      {loading && ( // Render loader when loading state is true
        <div className="loader-overlay">
          <div className="">
            <img style={{
              height: "6rem"
            }} src="images/loader.gif" alt=""></img>
          </div>
        </div>
      )}
      <div class="container-scroller">
        <div class="container-fluid">
          <div class="main-panel" style={{ width: '100%' }}>
          <div className='panel' style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: "18px", color: "#288a84", fontWeight: "700", marginTop: "12px" }}>Predictive Analysis</span>
            <div style={{ display: 'flex', gap: '10px' }}>
              {dataLoaded && (
                <ExportTableToExcel
                  tableId="predictive_analysis"
                  fileName={fileName}
                />
              )}
              <button className="btn btn-success btn-rounded btn-sm mt-1" onClick={exportToPDF}>Export to PDF</button>
              <button className="btn btn-success btn-rounded btn-sm mt-1" onClick={exportToCSV}>Export to CSV</button>
            </div>
          </div>

            <br />
            {}
            <table class="table table-striped" id="predictive_analysis">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Day</th>
                  <th>Product</th>
                  <th>Packaging</th>
                  <th>Unit Price</th>
                  <th>Total Quantity</th>
                </tr>
              </thead>
              <tbody>
                {dataLoaded &&
                  cummulativeHubDeliveryList.map((delivery, index) => (
                    <tr key={index}>
                      <td>{delivery.analysisDate}</td>
                      <td>{delivery.day}</td>
                      <td>{delivery.product_name}</td>
                      <td>{delivery.packaging}</td>
                      <td>{delivery.unit_price}</td>
                      <td>{delivery.quantity}</td>

                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>




    </>
  )
}

export default PredictiveAnalysis
