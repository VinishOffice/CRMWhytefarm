// AutoPausedSubscriptionsReport.js
import React, { useState, useEffect } from "react";
import moment from "moment";
import * as XLSX from "xlsx";
import { Table, Button, Form, Row, Col, Spinner, Modal } from "react-bootstrap";
import Swal from "sweetalert2";
import Select from "react-select";
import {
  fetchAutoPausedSubscriptions,
  fetchSubscriptionOptions,
  createCashCollection,
  createRechargeLink,
} from "./services/subscriptionOperationsService";
import { sendTextLocalSms } from "./services/messagingService";

function AutoPausedSubscriptionsReport() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [subscriptionsCopy, setSubscriptionsCopy] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [autoPauseStart, setAutoPauseStart] = useState("");
  const [autoPauseEnd, setAutoPauseEnd] = useState("");
  const [selectedHub, setSelectedHub] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [hubOptions, setHubOptions] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [agentOptions, setAgentOptions] = useState([]);
  const [showCashModal, setShowCashModal] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [cash, setCash] = useState({ amount: "", date: "", time: "" });
  const [submitSRL, setSubmitSRL] = useState({
    amount: "",
    email: false,
    sms: false,
  });
  const [baseData, setBaseData] = useState([]);
  const [firstTimeRender, setFirstTimeRender] = useState(true);
  useEffect(() => {
    fetchDropdowns();
    // fetchData();
  }, []);

  const fetchDropdowns = async () => {
    try {
      const response = await fetchSubscriptionOptions();
      const hubs = response.hubs || [];
      const products = response.products || [];
      const agents = response.agents || [];

      setHubOptions(hubs.map((hub) => hub.hub_name));
      setProductOptions(products.map((p) => p.productName));
      setAgentOptions(agents.map((name, idx) => ({ id: idx, name })));
    } catch (error) {
      console.error("Error fetching dropdowns:", error);
    }
  };

  const fetchData = async () => {
    if (!autoPauseStart) {
      const Toast = Swal.mixin({
        toast: true,
        background: "#69aba6",
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener("mouseenter", Swal.stopTimer);
          toast.addEventListener("mouseleave", Swal.resumeTimer);
        },
      });

      Toast.fire({
        icon: "error",
        title: "Please select start date",
      });
      return;
    }
    setFirstTimeRender(false);
    setLoading(true);

    try {
      const response = await fetchAutoPausedSubscriptions({
        autoPauseStart,
        autoPauseEnd,
      });
      const data = response.data || [];
      setSubscriptions(data);
      setSubscriptionsCopy(data);
      setBaseData(data);
      if (response.hubs) setHubOptions(response.hubs);
      if (response.products) setProductOptions(response.products);
      if (response.agents) {
        setAgentOptions(response.agents.map((name, idx) => ({ id: idx, name })));
      }
    } catch (error) {
      console.error("Error fetching auto paused subscriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const FilterData = () => {
    let filtered = baseData;
    if (selectedHub)
      filtered = filtered.filter((sub) => sub.hub_name === selectedHub);
    if (selectedProduct){
      filtered = filtered.filter((sub) => selectedProduct.map(e=>e.value).includes(sub.product_name));
    }
    if (startDate) {
      const start = moment(startDate, "YYYY-MM-DD");

      filtered = filtered.filter((sub) => {
        const orderDate = moment(sub.last_order_date, "YYYY-MM-DD");
        return orderDate.isValid() && orderDate.isSameOrAfter(start);
      });
    }
    if (endDate) {
      const end = moment(endDate, "YYYY-MM-DD");

      filtered = filtered.filter((sub) => {
        const orderDate = moment(sub.last_order_date, "YYYY-MM-DD");
        return orderDate.isValid() && orderDate.isSameOrBefore(end);
      });
    }

    setSubscriptions(filtered);
  };

  const exportCSV = () => {
    const exportData = subscriptions.map((row) => ({
      CustomerID: row.customer_id,
      Name: row.customer_name,
      Phone: row.customer_phone,
      Hub: row.hub_name,
      Status: row.status === "0" ? "AutoPaused" : "Active",
      Wallet: row.wallet,
      LastOrder: row.last_order_date,
      LastRecharge: row.last_recharge_date,
      Agent: row.agent_name,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, "autopaused_subscriptions.xlsx");
  };

  const handleRowClick = (customer_id) =>
    window.open(`/profile/${customer_id}`, "_blank");

  const handleCashCollection = (sub) => {
    setSelectedCustomer(sub);
    setShowCashModal(true);
  };

  const handleCashSubmit = async (e) => {
    e.preventDefault();
    if (!cash.amount || !cash.date || !cash.time) return;

    await createCashCollection({
      ...selectedCustomer,
      amount: parseInt(cash.amount, 10),
      date: cash.date,
      time: cash.time,
      created_by: "admin",
      created_date: new Date(),
    });

    setShowCashModal(false);
    setCash({ amount: "", date: "", time: "" });
  };

  const handleRechargeLink = (sub) => {
    setSelectedCustomer(sub);
    setSubmitSRL({ amount: "", email: false, sms: false });
    setShowRechargeModal(true);
  };

  const handleChangeSRL = (e) => {
    const { id, value, type, checked } = e.target;
    setSubmitSRL((prev) => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmitSRL = async (e) => {
    e.preventDefault();
    const buttonType = e.nativeEvent.submitter.getAttribute("data-type");
    if (buttonType !== "copy" && !submitSRL.email && !submitSRL.sms) {
      alert("Please check either Email or SMS.");
      return;
    }

    const dataRL = {
      amount: submitSRL.amount,
      customer_id: selectedCustomer?.customer_id,
      email: selectedCustomer?.customer_email,
      name: selectedCustomer?.customer_name,
      phone: selectedCustomer?.customer_phone,
      created_date: new Date(),
    };

    try {
      const response = await createRechargeLink(dataRL);
      const rechargeURL = `https://www.whytefarms.com/rechargelink/${response.id}`;

      if (buttonType === "copy") {
        await navigator.clipboard.writeText(rechargeURL);
        setShowRechargeModal(false);
      } else if (buttonType === "send") {
        const smsText = `Dear Customer, please click on the link to recharge your account: ${rechargeURL} - Whyte Farms`;
        await sendTextLocalSms({
          numbers: `91${selectedCustomer?.customer_phone || ""}`,
          message: smsText,
        });
        setShowRechargeModal(false);
      }
    } catch (error) {
      console.error("Recharge Link Error:", error);
    }
  };
  return (
    <div className="p-3">
      <h5 className="mb-5" style={{ fontSize: "1.5rem" }}>
        Auto-Paused Subscriptions Report
      </h5>

      <Form className="mb-4">
        <div className="p-3 border rounded bg-light mb-4">
          <h6 className="mb-3">📆 Auto-Pause Date Range</h6>
          <Row className="mb-3">
            <Col md={3}>
              <Form.Label>From</Form.Label>
              <Form.Control
                type="date"
                value={autoPauseStart}
                onChange={(e) => setAutoPauseStart(e.target.value)}
              />
            </Col>
            <Col md={3}>
              <Form.Label>To</Form.Label>
              <Form.Control
                type="date"
                value={autoPauseEnd}
                onChange={(e) => setAutoPauseEnd(e.target.value)}
              />
            </Col>
            <Col md={3} className="d-flex align-items-end">
              <Button variant="primary" onClick={fetchData}>
                🔍 Search Auto-Paused
              </Button>
            </Col>
          </Row>

          <hr />

          {/* <h6 className="mb-3">📦 Filter by Product, Hub, and Delivery</h6> */}
          <Row className="mb-3">
            <Col md={3}>
              <Form.Label>Hub</Form.Label>
              <Form.Select
                value={selectedHub}
                onChange={(e) => setSelectedHub(e.target.value)}
              >
                <option value="">All Hubs</option>
                {hubOptions.map((hub, i) => (
                  <option key={i} value={hub}>
                    {hub}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Label>Product</Form.Label>
              {/* <Form.Select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}>
          <option value="">All Products</option>
          {productOptions.map((prod, i) => (
            <option key={i} value={prod}>{prod}</option>
          ))}
        </Form.Select> */}
              <Select
                isMulti
                value={selectedProduct}
                options={productOptions.map((p) => ({ value: p, label: p }))}
                onChange={e => setSelectedProduct(e)}
                placeholder="Select Products"
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: "34px",
                    fontSize: "0.875rem",
                  }),
                }}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            </Col>
            <Col md={3}>
              <Form.Label>Last Order From</Form.Label>
              <Form.Control
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </Col>
            <Col md={3}>
              <Form.Label>Last Order To</Form.Label>
              <Form.Control
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </Col>
          </Row>

          <Row className="mt-3 justify-content-end">
            <Col md="auto">
              <Button variant="primary" onClick={FilterData}>
                ✅ Apply Filters
              </Button>{" "}
              <Button
                variant="secondary"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setAutoPauseStart("");
                  setAutoPauseEnd("");
                  setSelectedHub("");
                  setSelectedProduct("");
                  // fetchData(); // refresh
                  setFirstTimeRender(true);
                }}
              >
                ❌ Clear Filters
              </Button>{" "}
              <Button variant="success" onClick={exportCSV}>
                📥 Export CSV
              </Button>
            </Col>
          </Row>
        </div>
      </Form>

      {firstTimeRender ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            marginTop: "100px",
          }}
        >
          <h3>Kindly select a date for the preparation of the report.</h3>
        </div>
      ) : loading ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            marginTop: "50px",
          }}
        >
          <>
            {/* <Spinner animation="border" /> */}
            <span style={{}}>
              <img
                src="https://static.showit.co/file/htL7TmAVTde2OYw8vCPtjg/98861/dots-typing.gif"
                alt=""
                style={{
                  width: "250px",
                }}
              />
            </span>
            <h3>Your report is in progress and will be ready shortly</h3>
          </>
        </div>
      ) : (
        <Table striped bordered responsive>
          <thead>
            <tr>
              <th>S No.</th>
              <th>Customer ID</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Hub</th>
              <th>reason</th>
              <th>Product</th>
              <th>Status</th>
              <th>Type</th>
              <th>Description</th>
              <th>Wallet</th>
              <th>Date of Pause</th>
              <th>Last Order</th>
              <th>Last Recharge</th>

              <th>Agent</th>
              {/* <th>Assign</th> */}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.length > 0 ? (
              subscriptions.map((sub, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{sub.customer_id}</td>
                  <td>{sub.customer_name}</td>
                  <td>{sub.customer_phone}</td>
                  <td>{sub.hub_name}</td>
                  <td>{sub.reason}</td>
                  <td>{sub.product_name}</td>
                  <td>{sub.status === "0" ? "AutoPaused" : "Active"}</td>
                  <td>{sub.subscription_type}</td>
                  <td>{sub.description}</td>
                  <td>{sub.wallet === "-" ? "-" : `₹${sub.wallet}`}</td>
                  <td>{sub.paused_date}</td>
                  <td>{sub.last_order_date}</td>
                  <td>{sub.last_recharge_date}</td>
                  <td>{sub.agent_name}</td>
                  {/* <td>
                  <Form.Select>
                    <option>Assign</option>
                    {agentOptions.map(agent => (
                      <option key={agent.id}>{agent.name}</option>
                    ))}
                  </Form.Select>
                </td> */}
                  <td>
                    <Button size="sm" onClick={() => handleCashCollection(sub)}>
                      💰 Cash
                    </Button>{" "}
                    <Button size="sm" onClick={() => handleRechargeLink(sub)}>
                      📲 Recharge
                    </Button>{" "}
                    <Button
                      size="sm"
                      variant="info"
                      onClick={() => handleRowClick(sub.customer_id)}
                    >
                      📝 Log
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="15" style={{ textAlign: "center" }}>
                  No Subscription found in this range
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      )}

      {/* Cash Modal */}
      <Modal show={showCashModal} onHide={() => setShowCashModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Raise Cash Collection</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCashSubmit}>
            <Form.Group>
              <Form.Label>Amount</Form.Label>
              <Form.Control
                value={cash.amount}
                onChange={(e) => setCash({ ...cash, amount: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                value={cash.date}
                onChange={(e) => setCash({ ...cash, date: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Time</Form.Label>
              <Form.Select
                value={cash.time}
                onChange={(e) => setCash({ ...cash, time: e.target.value })}
                required
              >
                <option value="">Select</option>
                <option value="06:00 to 09:30">06:00 to 09:30</option>
              </Form.Select>
            </Form.Group>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => setShowCashModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="success">
                Submit
              </Button>
            </Modal.Footer>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Recharge Modal */}
      {/* Recharge Modal */}
      <Modal
        show={showRechargeModal}
        onHide={() => setShowRechargeModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Send Recharge Link</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitSRL}>
          <Modal.Body>
            <p>
              <strong>{selectedCustomer?.customer_name}</strong> (
              {selectedCustomer?.customer_phone})
            </p>
            <Form.Group>
              <Form.Label>Enter Amount</Form.Label>
              <Form.Control
                type="number"
                id="amount"
                value={submitSRL.amount}
                onChange={handleChangeSRL}
                required
              />
            </Form.Group>
            <Form.Group
              className="d-flex mt-3"
              style={{ alignItems: "center" }}
            >
              <Form.Check
                type="checkbox"
                id="email"
                checked={submitSRL.email}
                onChange={handleChangeSRL}
                label="Send via Email"
                className="me-4"
                style={{ marginRight: "20px" }}
              />
              <Form.Check
                type="checkbox"
                id="sms"
                checked={submitSRL.sms}
                onChange={handleChangeSRL}
                label="Send via SMS"
                style={{ marginLeft: "20px" }}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowRechargeModal(false)}
            >
              Cancel
            </Button>
            <Button variant="success" type="submit" data-type="copy">
              Copy Link
            </Button>
            <Button variant="primary" type="submit" data-type="send">
              Send
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default AutoPausedSubscriptionsReport;
