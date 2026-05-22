import React, { useEffect, useState } from 'react';
import moment from 'moment';
import {
  Table, Form, Button, Row, Col, Spinner, Pagination
} from 'react-bootstrap';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { fetchLifecycleOptions, fetchLifecycleReport } from "./services/customerOperationsService";

const CustomerLifecycleReport = () => {
  const [customers, setCustomers] = useState([]);
  
  const [finalData, setFinalData] = useState([]);
  
  const [loading, setLoading] = useState(false);

const [filters, setFilters] = useState({
  startDate: '',
  endDate: '',
  customerStage: '',
  hubName: '',
  source: '',
  product: '',
  lastDeliveryDate: '',
  daysSinceLastOrder: ''
});



  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 100;

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = finalData.slice(indexOfFirstRow, indexOfLastRow);

// Report data is fetched from backend (no Firebase queries here).








 const fetchCustomerData = async () => {
  setLoading(true);
  try {
   if (!filters.startDate || !filters.endDate) {
  setFinalData([]);
  setCustomers([]);
  setLoading(false);
  return;
}

    const resp = await fetchLifecycleReport({
      startDate: filters.startDate,
      endDate: filters.endDate,
      customerStage: filters.customerStage || undefined,
      hubName: filters.hubName || undefined,
      source: filters.source || undefined,
      lastDeliveryDate: filters.lastDeliveryDate || undefined,
      daysSinceLastOrder: filters.daysSinceLastOrder || undefined,
    });

    const list = resp.data || [];
    setFinalData(list);
    setCustomers(list);

  } catch (err) {
    console.error('Error fetching report:', err);
  }
  setLoading(false);
};

  useEffect(() => {
    fetchCustomerData();
  }, []);
  const [hubsList, setHubsList] = useState([]);
const [productsList, setProductsList] = useState([]);

useEffect(() => {
  const fetchDropdownData = async () => {
    try {
      const resp = await fetchLifecycleOptions();
      setHubsList(resp.hubs || []);
      setProductsList([]);

    } catch (err) {
      console.error("Error fetching dropdown data", err);
    }
  };

  fetchDropdownData();
}, []);
 const downloadData = (type) => {
    const dataToDownload = finalData.map((cust) => ({
      'Customer ID': cust.customer_id,
      'Name': cust.customer_name,
      'Phone': cust.customer_phone,
      'Address': cust.customer_address,
      'Registered Date': cust.registered_date ? moment(cust.registered_date).format('DD-MM-YYYY') : '-',
      'Platform': cust.platform || '-',
      'Hub': cust.hub_name || '-',
      'Source': cust.source || '-',
      'Order Count': cust.orderCount ?? 0,
      'Last Order Amount': cust.lastOrderAmount ?? 0,
      'Last Delivery': cust.lastDeliveryDate ? moment(cust.lastDeliveryDate).format('DD-MM-YYYY') : '-',
      'Days Since Last Order': cust.daysSinceLastOrder ?? '-',
      'Last Recharge': cust.lastRechargeDate ? moment(cust.lastRechargeDate).format('DD-MM-YYYY') : '-',
      'Total Recharge': cust.totalRechargeAmount ?? 0,
      'Customer Stage': cust.customer_stage,
      'Ledger Balance': cust.ledger_balance,
      'Active Subs': cust.activeSubCount ?? '-',
      'LTV': cust.LTV,
      'Delivery Boy': cust.delivery_boy_name || 'N/A',
      "totalorderamount": cust.totalOrderAmount
    }));

    const ws = XLSX.utils.json_to_sheet(dataToDownload);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Customers');

    const fileName = `customer_report_${moment().format('YYYYMMDD_HHmmss')}.${type}`;

    if (type === 'csv') {
      const csv = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, fileName);
    } else {
      XLSX.writeFile(wb, fileName);
    }
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      customerStage: '',
      hubName: '',
      source: '',
      product: '',
      lastDeliveryDate: '',
      daysSinceLastOrder: ''
    });
    setFinalData([]);
    setCustomers([]);
  };


  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="container mt-4">
      <h4>Customer Lifecycle Report</h4>


<Form className="border p-3 rounded shadow-sm mb-4 bg-light">
  <Row className="mb-3">
    <Col md={3}>
      <Form.Label>Start Date</Form.Label>
      <Form.Control type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
    </Col>
    <Col md={3}>
      <Form.Label>End Date</Form.Label>
      <Form.Control type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
    </Col>
    <Col md={3}>
      <Form.Label>Customer Stage</Form.Label>
      <Form.Control as="select" name="customerStage" value={filters.customerStage} onChange={handleFilterChange}>
        <option value="">All</option>
        <option>Lead</option>
        <option>Customer</option>
        <option>Subscriber</option>
       
      </Form.Control>
    </Col>
    <Col md={3}>
      <Form.Label>Hub Name</Form.Label>
      <Form.Control as="select" name="hubName" value={filters.hubName} onChange={handleFilterChange}>
        <option value="">All</option>
        {hubsList.map((hub, idx) => <option key={idx}>{hub}</option>)}
      </Form.Control>
    </Col>
  </Row>

  <Row className="mb-3">
    <Col md={3}>
      <Form.Label>Source</Form.Label>
      <Form.Control type="text" name="source" value={filters.source} onChange={handleFilterChange} />
    </Col>
    {/* <Col md={3}>
      <Form.Label>Product</Form.Label>
      <Form.Control as="select" name="product" value={filters.product} onChange={handleFilterChange}>
        <option value="">All</option>
        {productsList.map((prod, idx) => <option key={idx}>{prod}</option>)}
      </Form.Control>
    </Col> */}
    <Col md={3}>
      <Form.Label>Last Delivery Date</Form.Label>
      <Form.Control type="date" name="lastDeliveryDate" value={filters.lastDeliveryDate} onChange={handleFilterChange} />
    </Col>
  </Row>

<Row className="mt-2">
  <Col md={6}>
    <Button onClick={fetchCustomerData}>Apply Filters</Button>{' '}
    <Button variant="secondary" onClick={clearFilters}>Clear Filters</Button>
  </Col>
  <Col md={6} className="text-end">
    {finalData.length > 0 && (
      <>
        <Button variant="success" onClick={() => downloadData('xlsx')} className="me-2">
          Download XLSX
        </Button>
        <Button variant="success" onClick={() => downloadData('csv')}>
          Download CSV
        </Button>
      </>
    )}
  </Col>
</Row>

</Form>


      {loading ? (
        <div className="text-center">
          <Spinner animation="border" />
        </div>
      ) : (
        <>
         {!loading && finalData.length === 0 && (
    <div className="text-center text-muted mb-3">
      No data to display. Please apply filters to fetch customer data.
    </div>
  )}
            <div style={{ overflowX: 'auto' }}>
          <Table striped bordered hover responsive  className="table w-100" style={{width: '120%'}}>
            <thead className='table-dark '>
              <tr>
                <th>Customer ID</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Registered Date</th>
                <th>Platform</th>
                <th>Hub</th>
                {/* <th>Product</th> */}
                <th>Source</th>
                <th>Order Count</th>
                <th>Last Order Amount</th>
                <th>Last Delivery</th>
                <th>Days Since Last Order</th>
                <th>Last Recharge</th>
                <th>Total Recharge</th>
                <th>Customer-stage</th>
                <th>wallet-balance</th>
                <th>Active Subs</th>
                <th>LTV</th>
                <th>Delivery Boy</th>
                
              </tr>
            </thead>
            <tbody>
              {currentRows.map((cust, index) => (
                <tr key={index}>
                  <td>{cust.customer_id}</td>
                  <td>{cust.customer_name}</td>
                  <td>{cust.customer_phone}</td>
                  <td>{cust.customer_address}</td>
                  <td>{cust.registered_date ? moment(cust.registered_date).format('DD-MM-YYYY') : '-'}</td>
                  <td>{cust.platform || '-'}</td>
                  <td>{cust.hub_name || '-'}</td>
                  {/* <td>{cust.product_name || '-'}</td> */}
                  <td>{cust.source || '-'}</td>
                  <td>{cust.orderCount ?? 0}</td>
                  <td>{cust.lastOrderAmount ?? 0}</td>
                  <td>{cust.lastDeliveryDate ? moment(cust.lastDeliveryDate).format('DD-MM-YYYY') : '-'}</td>
                  <td>{cust.daysSinceLastOrder ?? '-'}</td>
                  <td>{cust.lastRechargeDate ? moment(cust.lastRechargeDate).format('DD-MM-YYYY') : '-'}</td>
                  <td>{cust.totalRechargeAmount ?? 0}</td>
                  <td>{cust.customer_stage}</td>
                  <td>{cust.ledger_balance}</td>
                  <td>{cust.activeSubCount ?? "-"}</td>
                  <td>{cust.totalOrderAmount}</td>
                  <td>{cust.delivery_boy_name || "N/A"}</td>

                </tr>
              ))}
            </tbody>
          </Table>
        </div>

          <Pagination className="justify-content-center">
            {Array.from({ length: Math.ceil(finalData.length / rowsPerPage) }, (_, i) => (
              <Pagination.Item
                key={i + 1}
                active={i + 1 === currentPage}
                onClick={() => paginate(i + 1)}
              >
                {i + 1}
              </Pagination.Item>
            ))}
          </Pagination>
        </>
      )}
    </div>
  );
};

export default CustomerLifecycleReport;
