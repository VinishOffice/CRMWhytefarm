import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { saveAs } from 'file-saver';
import {
  fetchCurrentSubscriptions,
  fetchSubscriptionOptions,
} from "./services/subscriptionOperationsService";

const currentSubStyles = `
  .main-container {
    padding: 20px;
    background: #f4f7fc;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    max-width: 1100px;
    margin: 30px auto;
  }
  .main-container h3 {
    color: #3c4b64;
    font-size: 24px;
    margin-bottom: 20px;
    font-weight: 600;
  }
  .main-container p {
    color: #646c79;
    font-size: 14px;
    margin-bottom: 10px;
  }
  .btn-csl {
    background-color: #007bff;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    font-size: 16px;
    cursor: pointer;
    transition: background-color 0.3s ease;
    margin-bottom: 20px;
  }
  .btn-csl:hover {
    background-color: #0056b3;
  }
  .btn-csl:disabled {
    background-color: #d6e0f0;
    cursor: not-allowed;
  }
  .table {
    width: 100%;
    border-collapse: collapse;
    background-color: #ffffff;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    margin-top: 20px;
    border-radius: 8px;
  }
  .table th,
  .table td {
    padding: 12px;
    text-align: left;
    color: #3c4b64;
    font-size: 16px;
    border-bottom: 1px solid #e0e6ef;
  }
  .table th {
    background-color: #f8f9fa;
    font-weight: 700;
  }
  .table tr:nth-child(even) {
    background-color: #f9fafb;
  }
  .error-text {
    color: #e74c3c;
    font-size: 16px;
    font-weight: bold;
  }
`;

const CurrentSubscriptions = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hubOptions, setHubOptions] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [selectedHub, setSelectedHub] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState([]);
  const [totalQuantity, setTotalQuantity] = useState(0);
  useEffect(() => {
    const load = async () => {
      await loadOptions();
      await fetchSubscriptions();
    };
    load();
  }, []);

  const loadOptions = async () => {
    try {
      const response = await fetchSubscriptionOptions();
      const hubs = response.hubs || [];
      const products = response.products || [];
      setHubOptions(hubs.map((hub) => ({ value: hub.hub_name, label: hub.hub_name })));
      setProductOptions(products.map((p) => ({ value: p.productName, label: p.productName })));
    } catch (error) {
      console.error("Error fetching subscription options:", error);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchCurrentSubscriptions({
        hubNames: selectedHub.map((hub) => hub.value),
        productNames: selectedProduct.map((product) => product.value),
      });

      const customerData = response.data || [];
      setCustomers(customerData);
      setTotalQuantity(response.totalQuantity || 0);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      setError("Failed to fetch subscriptions");
    } finally {
      setLoading(false);
    }
  };

  // Handle CSV export with error messaging
  const exportToCSV = () => {
    if (customers.length === 0) {
      alert('No data available to export');
      return;
    }

    const headers = [
      'SN', 'Customer ID', 'Customer Name', 'Product Name', 'Quantity', 
      'Hub Name', 'Price', 'Next Delivery Date', 'Subscription Type'
    ];

    const rows = customers.map((customer, index) => [
      index + 1, customer.customer_id || 'N/A', customer.customer_name || 'N/A',
      customer.product_name || 'N/A', customer.quantity || 'N/A', customer.hub_name || 'N/A',
      customer.price || 'N/A', customer.next_delivery_date || 'N/A', customer.subscription_type || 'N/A'
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'subscriptions.csv');
  };

  return (
    <div className="main-container">
      <style>{currentSubStyles}</style>
      <h3>Delivery Subscriptions</h3>
      <p>Total Records: {customers.length}</p>
      <p>Total Quantity: {totalQuantity}</p> {/* Display total quantity */}
      <div className="filters-container">
        <div className="filter-row">
          <div className="filter-item">
            <label>Hub</label>
            <Select
              options={hubOptions}
              isMulti
              onChange={(selected) => setSelectedHub(selected)}
            />
          </div>

          <div className="filter-item">
            <label>Product</label>
            <Select
              options={productOptions}
              isMulti
              onChange={(selected) => setSelectedProduct(selected)}
            />
          </div>
        </div>

        <button onClick={fetchSubscriptions} className="btn btn-primary">Filter</button>
      </div>
      <p>Total Records: {customers.length}</p>
      <button onClick={exportToCSV} className="btn btn-success">Export CSV</button>

      {loading && <p>Loading...</p>}
      {error && <p className="text-danger">{error}</p>}

      <table className="table table-striped">
        <thead>
          <tr>
            <th>#</th>
            <th>Customer Name</th>
            <th>Customer Phone</th>
            <th>Hub</th>
            <th>Product</th>
            <th>Quantity</th>
            <th>Subscription Type</th>
            
            <th>Next Delivery Date</th>
          </tr>
        </thead>
        <tbody>
  {customers.map((customer, index) => (
    <tr key={customer.id}>
      <td>{index + 1}</td>
      <td>{customer.customer_name}</td>
      <td>{customer.customer_phone}</td>
      <td>{customer.hub_name}</td>
      <td>{customer.product_name}</td>
      <td>{customer.finalQuantity}</td> {/* Display final quantity */}
      <td>{customer.subscription_type}</td>
      <td>{customer.next_delivery_date}</td>
    </tr>
  ))}
</tbody>

      </table>
    </div>
  );
};

export default CurrentSubscriptions;
