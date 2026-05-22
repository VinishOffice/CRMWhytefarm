import React, { useEffect, useState, useRef } from 'react';
import { Table, Spinner, Form, Row, Col, Button, Pagination } from 'react-bootstrap';
import { fetchFutureOrders } from "./services/subscriptionOperationsService";
import moment from 'moment';
import { saveAs } from 'file-saver';

const FutureOrderReport = () => {
  const [subscriptionData, setSubscriptionData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedHub, setSelectedHub] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedOrderType, setSelectedOrderType] = useState('');
  const [registerStartDate, setRegisterStartDate] = useState('');
  const [registerEndDate, setRegisterEndDate] = useState('');
  const paginationRef = useRef(null);

  // 🔹 Fetch subscription_data + customer_data
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetchFutureOrders({
        startDate,
        endDate,
      });
      const data = response.data || [];
      setSubscriptionData(data);
      setFilteredData(data);
    } catch (err) {
      console.error("Error fetching future orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      fetchData();
    }
  }, [startDate, endDate]);

  useEffect(() => {
    filterData();
  }, [subscriptionData, selectedHub, selectedProduct, selectedOrderType, registerStartDate, registerEndDate]);

  const filterData = () => {
    const filtered = subscriptionData.filter(item => {
      const dateValid = item.scheduled_date >= startDate && item.scheduled_date <= endDate;
      const hubValid = selectedHub ? item.hub === selectedHub : true;
      const productValid = selectedProduct ? item.product_name === selectedProduct : true;
      const orderTypeValid = selectedOrderType ? item.order_type === selectedOrderType : true;
      const registerValid =
        (!registerStartDate || item.registered_date >= registerStartDate) &&
        (!registerEndDate || item.registered_date <= registerEndDate);
      return dateValid && hubValid && productValid && orderTypeValid && registerValid;
    });
    setFilteredData(filtered);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedHub('');
    setSelectedProduct('');
    setSelectedOrderType('');
    setRegisterStartDate('');
    setRegisterEndDate('');
  };

  const exportToCSV = () => {
    const csvRows = [
      [
        "Customer Id", "Customer Name", "Phone No", "Product", "Hub", "Quantity", "Unit Price", "Scheduled Delivery Date", "Amount", "Order Type", "Subscription Id", "Registered Date"
      ],
      ...filteredData.map(item => [
        item.customer_id,
        item.customer_name,
        item.customer_phone,
        item.product_name,
        item.hub,
        item.quantity,
        item.unit_price,
        item.scheduled_date,
        item.amount,
        item.order_type,
        item.subscription_id,
        item.registered_date
      ])
    ];

    const blob = new Blob([csvRows.map(e => e.join(",")).join("\n")], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'future_order_report.csv');
  };

  const uniqueHubs = [...new Set(subscriptionData.map(item => item.hub))].filter(Boolean);
  const uniqueProducts = [...new Set(subscriptionData.map(item => item.product_name))].filter(Boolean);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  useEffect(() => {
    if (paginationRef.current) {
      paginationRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentPage]);

  return (
    <div className="container-fluid mt-3">
      <h2 className="text-center mb-4">Future Order Report</h2>

      <Form className="mb-4 p-4 border rounded shadow bg-white">
        <Row className="mb-3">
          <Col md={2}>
            <Form.Label>Start Date</Form.Label>
            <Form.Control
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </Col>

          <Col md={2}>
            <Form.Label>End Date</Form.Label>
            <Form.Control
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </Col>

          <Col md={2}>
            <Form.Label>Register Start Date</Form.Label>
            <Form.Control
              type="date"
              value={registerStartDate}
              onChange={e => setRegisterStartDate(e.target.value)}
            />
          </Col>

          <Col md={2}>
            <Form.Label>Register End Date</Form.Label>
            <Form.Control
              type="date"
              value={registerEndDate}
              onChange={e => setRegisterEndDate(e.target.value)}
            />
          </Col>

          <Col md={2}>
            <Form.Label>Hub</Form.Label>
            <Form.Select
              value={selectedHub}
              onChange={e => setSelectedHub(e.target.value)}
            >
              <option value="">All</option>
              {uniqueHubs.map((hub, i) => (
                <option key={i} value={hub}>{hub}</option>
              ))}
            </Form.Select>
          </Col>

          <Col md={2}>
            <Form.Label>Product</Form.Label>
            <Form.Select
              value={selectedProduct}
              onChange={e => setSelectedProduct(e.target.value)}
            >
              <option value="">All</option>
              {uniqueProducts.map((p, i) => (
                <option key={i} value={p}>{p}</option>
              ))}
            </Form.Select>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col md={2}>
            <Form.Label>Order Type</Form.Label>
            <Form.Select
              value={selectedOrderType}
              onChange={e => setSelectedOrderType(e.target.value)}
            >
              <option value="">All</option>
              <option value="One Time">One Time</option>
              <option value="Custom">Custom</option>
              <option value="Everyday">Everyday</option>
              <option value="On-Interval">On Interval</option>
            </Form.Select>
          </Col>

          <Col md={2} className="d-flex align-items-end">
            <Button variant="secondary" className="w-100" onClick={clearFilters}>
              Clear Filters
            </Button>
          </Col>

          <Col md={2} className="d-flex align-items-end">
            <Button variant="success" className="w-100" onClick={exportToCSV}>
              Download CSV
            </Button>
          </Col>
        </Row>
      </Form>

      {loading ? (
        <div className="text-center my-4">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : (
        <div style={{ width: '100%' }}>
          <div style={{ minWidth: '1600px' }}>
            <Table bordered striped hover className="w-100">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Customer Id</th>
                  <th>Customer Name</th>
                  <th>Phone No</th>
                  <th>Product</th>
                  <th>Hub</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Schedule Delivery Date</th>
                  <th>Amount</th>
                  <th>Order Type</th>
                  <th>Subscription Id</th>
                  <th>Registered Date</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((item, index) => (
                    <tr key={index}>
                      <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                      <td>{item.customer_id}</td>
                      <td>{item.customer_name}</td>
                      <td>{item.customer_phone}</td>
                      <td>{item.product_name}</td>
                      <td>{item.hub}</td>
                      <td>{item.quantity}</td>
                      <td>{item.unit_price}</td>
                      <td>{item.scheduled_date}</td>
                      <td>{item.amount}</td>
                      <td>{item.order_type}</td>
                      <td>{item.subscription_id}</td>
                      <td>{item.registered_date}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="13" className="text-center">
                      No data found for selected filters
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>

            <Pagination className="justify-content-center mt-3" ref={paginationRef}>
              <Pagination.Prev
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              />
              {[...Array(totalPages)].map((_, idx) => (
                <Pagination.Item
                  key={idx + 1}
                  active={idx + 1 === currentPage}
                  onClick={() => setCurrentPage(idx + 1)}
                >
                  {idx + 1}
                </Pagination.Item>
              ))}
              <Pagination.Next
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              />
            </Pagination>
          </div>
        </div>
      )}
    </div>
  );
};

export default FutureOrderReport;





