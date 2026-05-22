import React, { useState, useEffect } from 'react';
import moment from 'moment';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import apiClient from "./services/apiClient";

const OrderHistoryReport = () => {
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setOrders([]);

    const start = moment(fromDate).startOf('day');
    const end = moment(toDate).endOf('day');


    let tempOrders = [];

    for (let date = moment(start); date <= end; date.add(1, 'days')) {
      const formattedDate = date.format('YYYY-MM-DD');

      try {
        const docs = await apiClient.post("/api/order_history/query", {
          filters: [{ field: "delivery_date", op: "==", value: formattedDate }]
        }).then(res => res.data?.data || []);

        docs.forEach((doc) => {
          tempOrders.push({ id: doc._id, ...doc });
        });
      } catch (err) {
        console.error("Error fetching orders:", err);
      }
    }

    setOrders(tempOrders);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDownload = () => {
    const exportData = [];

    orders.forEach(order => {
      if (order.products?.length > 0) {
        order.products.forEach(prod => {
          exportData.push({
            Customer: order.customer_name,
            Phone: order.customer_phone,
            'Delivery Date': order.delivery_date,
            Status: order.order_status,
            Product: prod.product_name,
            Qty: prod.product_qty
          });
        });
      } else {
        exportData.push({
          Customer: order.customer_name,
          Phone: order.customer_phone,
          'Delivery Date': order.delivery_date,
          Status: order.order_status,
          Product: order.product_name || '',
          Qty: order.product_qty || ''
        });
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Order Report');

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    });

    const file = new Blob([excelBuffer], {
      type: 'application/octet-stream'
    });

    saveAs(file, `order_report_${moment().format('YYYYMMDD_HHmmss')}.xlsx`);
  };

  return (
    <div className="container mt-4">
      <h3>📅 Order History Report (june Data)</h3>

      <div className="row mb-3">
        <div className="col-md-4">
          <label>From Date:</label>
          <DatePicker
            selected={fromDate}
            onChange={(date) => setFromDate(date)}
            dateFormat="yyyy-MM-dd"
            className="form-control"
          />
        </div>

        <div className="col-md-4">
          <label>To Date:</label>
          <DatePicker
            selected={toDate}
            onChange={(date) => setToDate(date)}
            dateFormat="yyyy-MM-dd"
            className="form-control"
          />
        </div>

        <div className="col-md-4 d-flex align-items-end">
          <button onClick={fetchData} className="btn btn-primary w-100">
            🔍 Search
          </button>
        </div>
      </div>

      <div className="mb-3">
        <button onClick={handleDownload} className="btn btn-success">
          📥 Download Excel
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : orders.length > 0 ? (
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Phone</th>
              <th>Delivery Date</th>
              <th>Status</th>
              <th>Product</th>
              <th>Qty</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, idx) => (
              order.products?.length > 0 ? (
                order.products.map((prod, i) => (
                  <tr key={`${idx}-${i}`}>
                    {i === 0 && (
                      <>
                        <td rowSpan={order.products.length}>{order.customer_name}</td>
                        <td rowSpan={order.products.length}>{order.customer_phone}</td>
                        <td rowSpan={order.products.length}>{order.delivery_date}</td>
                        <td rowSpan={order.products.length}>{order.order_status}</td>
                      </>
                    )}
                    <td>{prod.product_name}</td>
                    <td>{prod.product_qty}</td>
                  </tr>
                ))
              ) : (
                <tr key={idx}>
                  <td>{order.customer_name}</td>
                  <td>{order.customer_phone}</td>
                  <td>{order.delivery_date}</td>
                  <td>{order.order_status}</td>
                  <td>{order.product_name}</td>
                  <td>{order.product_qty}</td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      ) : (
        <p>No orders found in selected range.</p>
      )}
    </div>
  );
};

export default OrderHistoryReport;
