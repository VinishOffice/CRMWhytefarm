import { useContext, useEffect, useMemo, useState } from "react";
import { HubDropdown, ProductDropdown } from "./utility/productDropDown";
import { DateInputEnd } from "./Delivery";
import { FaSave, FaTimes } from "react-icons/fa";
import { useInventoryContext } from "./InventoryContext";
import FetchInventory from "./utility/queries";
import GlobalContext from "../../context/GlobalContext";
import Swal from "sweetalert2";

const Report = () => {

  const { dispatches, setDispatches } = useInventoryContext();
  const [create, setCreate] = useState(false);
  const [date, setDate] = useState(new Date());
  const [isIconLoaded, setIsIconLoaded] = useState(true);
  const inventoryFetch = new FetchInventory();

  const { permissible_roles } = useContext(GlobalContext);

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

  // Ensure icons are loaded
  useEffect(() => {
    const checkIconLoad = () => {
      try {
        FaSave && FaTimes ? setIsIconLoaded(true) : setIsIconLoaded(false);
      } catch (error) {
        setIsIconLoaded(false);
      }
    };
    checkIconLoad();
  }, []);

  // Fetch dispatches when the selected date changes
  useEffect(() => {
    const fetchDispatchesByDate = async () => {
      try {
        const data = await inventoryFetch.fetchDispatchesByDateRange(date);
        setDispatches(data);
      } catch (error) {
        console.error("Error fetching dispatches:", error);
      }
    };
    fetchDispatchesByDate();
  }, [date]);

  // Fetch all dispatches if the create state is false
  useEffect(() => {
    const fetchDispatches = async () => {
      if (!create) {
        try {
          const data = await inventoryFetch.fetchDispatchesByDateRange(new Date());
          setDispatches(data);
        } catch (error) {
          console.error("Error fetching dispatches:", error);
        }
      }
    };
    fetchDispatches();
  }, [create]);


  

  return (
    <>

      {/* Dispatch Overview Section */}
      <div className="card p-1 mb-4">
        <div className="container my-2">
          <div className="d-flex justify-content-between align-items-center mt-1">
            <div className="d-flex flex-column gap-2">
              <h3 className="">Inventory Report</h3>
              <div className="d-flex align-items-center gap-3">
                <p className="text-black text-bold fs-4 mb-0">Date:</p>
                <DateInputEnd
                  date={date}
                  setDate={setDate}
                  style={{ width: "140px", backgroundColor: "#F8F9FA", borderRadius: "0.375rem" }}
                />
              </div>
            </div>

            
          </div>
        </div>
      </div>

      <FinalHubProductReport data={date} />
    </>
  );

};


const FinalHubProductReport = ({date}) => {
  
  const [selectedHub, setSelectedHub] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState("All");
  const [stock, setStock] = useState([]);
  const [dispatched, setDispatched] = useState([]);
  const [hubDispatch, setHubDispatch] = useState([]);
  const inventory = new FetchInventory();
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const stock = await inventory.fetchStock();
        setStock(stock);
        
      } catch (error) {
        console.error(error);
      }
    }
    fetchData();
  }, []);
  
  
  useEffect(() => {
    const fetchDispatchesByDate = async () => {
      try {
        const data = await inventory.fetchDispatchesByDateRange(new Date());
        const hubData = data.filter(item => item?.type === "Hub Dispatch");
        const farmsData = data.filter(item => item?.type === "Farms Dispatch");
        setHubDispatch(hubData);
        setDispatched(farmsData);
      } catch (error) {
        console.error("Error fetching dispatches:", error);
      }
    };
      fetchDispatchesByDate();
    }, [date]);

    
const report = useMemo(() => {
  const map = {};
  for (const item of hubDispatch) {
    const key = `${item.hub}-${item.productName}`;
    if (!map[key]) {
      map[key] = {
        hub: item.hub,
        product: item.productName,
        totalDispatched: 0,
        received: 0,
        delivered: 0,
        damaged: 0,
        returnedToFarms: 0,
        availableStock: 0,
        yesterday_stock: 0,
      };
    }
    
    map[key].totalDispatched += item.quantity || 0;
    map[key].received += item.status === "Delivered" ? item.quantity || 0 : 0;
    map[key].delivered += item.deliveredQty || 0;
    map[key].damaged += item.damagedQty || 0;
    map[key].returnedToFarms += item.returnedQty || 0;
  }
  
  for (const item of stock) {
    const key = `${item.hub}-${item.productName}`;
    if (!map[key]) {
      map[key] = {
        hub: item.hub,
        product: item.productName,
        totalDispatched: 0,
        received: 0,
        delivered: 0,
        damaged: 0,
        returnedToFarms: 0,
        goodStock: 0,
        availableStock: 0,
        yesterday_stock: 0,
      };
    }
    
    map[key].goodStock = item.goodStock || 0;
    map[key].damaged = item.damagedStock || 0;
    map[key].availableStock = item.totalStock || 0;
    map[key].yesterday_stock = item.yesterday_stock || 0;
  }
  
  const reportData = Object.values(map).map(item => {
    const {
      received = 0,
      delivered = 0,
      damaged = 0,
      goodStock=0,
      returnedToFarms = 0,
      availableStock = 0,
      yesterday_stock = 0,
    } = item;
    
    const totalReceived = Number(received) - Number(delivered) - Number(damaged) - Number(returnedToFarms);
    const totalAvailable = Number(goodStock) - Number(yesterday_stock);
    
    
    return {
      ...item,
      consistency_status: totalReceived === totalAvailable,
    };
  });
  
  return reportData;
}, [stock, hubDispatch]);


const showData = useMemo(()=>{
  
  const filterd = report.filter((item)=>{
    return (selectedHub === "All Hubs" || item.hub === selectedHub) && (selectedProduct === "All Products" || item.product === selectedProduct);
  })
  
  return filterd
},[stock, hubDispatch, selectedHub, selectedProduct])



const handleExportCSV = () => {
  const rows = [
    ["Hub", "Product", "Dispatched", "Received", "Delivered", "Damaged", "Returned to Farms", "Available Stock"]
  ];
  
  showData.forEach(row => {
    rows.push([
      row.hub,
      row.product,
      row.totalDispatched,
      row.received,
      row.delivered,
      row.damaged,
      row.returnedToFarms,
      row.goodStock,
      row.yesterday_stock,
    ]);
  });
  
  const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "hub_product_consolidated_report.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

return (
  // <div className="card mb-5 shadow-sm">
  <div className="card p-1 mb-4">
      <div className="card-header  text-white">
        {/* First Row: Heading and Export Button */}
        <div className="d-flex justify-content-between align-items-center">
          <h3 className="mb-0 text-black">📋 Consolidated Report</h3>
          <button className="btn btn-success btn-rounded btn-sm" onClick={handleExportCSV}>
            ⬇️ Export CSV
          </button>
        </div>

        {/* Second Row: Hub and Product Filters */}
        <div className="d-flex flex-row justify-content-between mt-2">
          <HubDropdown selectedHub={selectedHub} setSelectedHub={setSelectedHub}/>
          <ProductDropdown selectedProduct={selectedProduct} setSelectedProduct={setSelectedProduct}/>
        </div>
      </div>

      <div className="card-body table-responsive">
      <table className="table table-striped table-bordered align-middle">
        <thead className="table-success">
          <tr>
            <th>Hub</th>
            <th>Product</th>
            <th>📤 Dispatched</th>
            <th>📥 Received</th>
            <th>✅ Delivered</th>
            <th>💔 Damaged</th>
            <th>↩️ Returned</th>
            <th>Current Stock</th>
            <th>Yesterday Stock</th>
          </tr>
        </thead>
        <tbody>
          {showData &&  showData.length ?
          showData.map((row, idx) => (
            <tr key={`${row.hub}-${row.product}-${idx}`} className={row.consistency_status ? "bg-success": "bg-danger"}>
              <td>{row.hub}</td>
              <td>{row.product}</td>
              <td>{row.totalDispatched}</td>
              <td>{row.received}</td>
              <td>{row.delivered}</td>
              <td>{row.damaged}</td>
              <td>{row.returnedToFarms}</td>
              <td>{row.goodStock || 0} </td>
              <td>{row.yesterday_stock || 0}</td>
            </tr>
          ))
          : (
            <tr>
            <td className="text-center" colSpan={9}>No data found.</td>
          </tr>
        )}
        </tbody>
      </table>
    </div>
    </div>
  );
};

export default Report;