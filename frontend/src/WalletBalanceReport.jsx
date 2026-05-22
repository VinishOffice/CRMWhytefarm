import React, { useState, useEffect } from "react";
import { fetchWalletReport } from "./services/walletService";
import apiClient from "./services/apiClient";
import { sendTextLocalSms } from "./services/messagingService";
import moment from "moment";
import { Form, Table, Button, Row, Col, Modal } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const WalletBalanceReport = () => {
  const [customers, setCustomers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCashModal, setShowCashModal] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [cash, setCash] = useState({ amount: "", date: "", time: "" });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [submitSRL, setSubmitSRL] = useState({
    amount: "",
    email: false,
    sms: false,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [hubOptions, setHubOptions] = useState([]);

  const itemsPerPage = 25;

  const [filters, setFilters] = useState({
    name: "",
    phone: "",
    status: "",
    walletStatus: "",
    hub: "",
    rechargeFrom: "",
    rechargeTo: "",
    deliveryFrom: "",
    deliveryTo: "",
    nextDeliveryDate: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const custList = await fetchWalletReport();
      setCustomers(custList);
      setFiltered(custList);
    } catch (err) {
      console.error("❌ Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let temp = [...customers];
    const {
      name,
      phone,
      status,
      walletStatus,
      hub,
      rechargeFrom,
      rechargeTo,
      deliveryFrom,
      deliveryTo,
      nextDeliveryDate,
    } = filters;

    if (name)
      temp = temp.filter((c) =>
        c.customer_name?.toLowerCase().includes(name.toLowerCase())
      );
    if (phone) temp = temp.filter((c) => c.customer_phone?.includes(phone));
    if (status)
      temp = temp.filter((c) =>
        status === "Active" ? c.status === "1" : c.status !== "1"
      );
    if (walletStatus) {
      temp = temp.filter((c) => {
        if (walletStatus === "Positive") return c.wallet_balance > 0;
        if (walletStatus === "Zero") return c.wallet_balance === 0;
        return c.wallet_balance < 0;
      });
    }
    if (hub) temp = temp.filter((c) => c.hub_name === hub);
    if (rechargeFrom && rechargeTo) {
      temp = temp.filter(
        (c) =>
          c.lastRecharge &&
          moment(c.lastRecharge).isBetween(
            rechargeFrom,
            rechargeTo,
            "day",
            "[]"
          )
      );
    }
    if (deliveryFrom && deliveryTo) {
      temp = temp.filter(
        (c) =>
          c.lastDelivery &&
          moment(c.lastDelivery).isBetween(
            deliveryFrom,
            deliveryTo,
            "day",
            "[]"
          )
      );
    }
    if (nextDeliveryDate) {
      temp = temp.filter(
        (c) =>
          c.next_delivery_date &&
          moment(c.next_delivery_date).isSame(moment(nextDeliveryDate), "day")
      );
    }

    setFiltered(temp);
    setCurrentPage(1);
  };

  useEffect(() => {
    const fetchHubs = async () => {
      const docs = await apiClient.post("/api/subscriptions_data/query", { filters: [] }).then(res => res.data?.data || []);
      const hubs = new Set();

      docs.forEach((doc) => {
        const hub = doc.hub_name;
        if (hub) hubs.add(hub);
      });

      setHubOptions(Array.from(hubs));
    };

    fetchHubs();
  }, []);

  const clearFilters = () => {
    setFilters({
      name: "",
      phone: "",
      status: "",
      walletStatus: "",
      hub: "",
      rechargeFrom: "",
      rechargeTo: "",
      deliveryFrom: "",
      deliveryTo: "",
      nextDeliveryDate: "",
    });
    setFiltered(customers);
    setCurrentPage(1);
  };

  const hubs = [...new Set(customers.map((c) => c.hub_name).filter(Boolean))];
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const handleCashCollection = (c) => {
    setSelectedCustomer(c);
    setShowCashModal(true);
  };

  // const handleRechargeLink = (sub) => {
  //   setSelectedCustomer(sub);
  //   setShowRechargeModal(true);
  // };

  const handleCashSubmit = async (e) => {
    e.preventDefault();
    if (!cash.amount || !cash.date || !cash.time) return;

    await apiClient.post("/api/cash_collection", {
      ...selectedCustomer,
      amount: parseInt(cash.amount),
      date: cash.date,
      time: cash.time,
      created_by: "admin",
      created_date: new Date(),
    });

    setShowCashModal(false);
    setCash({ amount: "", date: "", time: "" });
  };

  const handleRechargeLink = (c) => {
    setSelectedCustomer(c);
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
      const res = await apiClient.post("/api/recharge_link", dataRL);
      const docId = res.data?.data?._id || new Date().getTime().toString();
      const rechargeURL = `https://www.whytefarms.com/rechargelink/${docId}`;

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
  const ExportCSV = ({ data }) => {
    const exportToCSV = () => {
      if (!data || data.length === 0) {
        alert("No data available to export.");
        return;
      }

      const headers = [
        "S.No.",
        "Customer ID",
        "Customer Name",
        "Customer Phone",
        "Hub",
        "Delivery Boy",
        "Wallet",
        "Credit Limit",
        "Ledger",
        "Status",
        "Last Recharge",
        "Last Delivery",
        "Next Delivery",
        // "Actions",
      ];
      const csvRows = [headers.join(",")];

      // Sanitize function to escape quotes and remove newlines
      const sanitize = (value) => {
        if (value === null || value === undefined) return "";
        return String(value)
          .replace(/"/g, '""') // escape double quotes
          .replace(/\r?\n|\r/g, " "); // remove newlines
      };

      data.forEach((val, index) => {
        const row = [
          index + 1,
          val.customer_id,
          val.customer_name,
          val.customer_phone,
          val.hub_name,
          val.delivery_boy,
          val.wallet_balance,
          val.credit_limit,
          val.current_wallet_balance,
          val.status === "1" ? "Active" : "Inactive",
          // val.lastRecharge,
          val.lastRecharge
            ? moment(val.lastRecharge, "YYYY-MM-DD").format("DD-MM-YYYY")
            : "",
          val.lastDelivery
            ? moment(val.lastDelivery, "YYYY-MM-DD").format("DD-MM-YYYY")
            : "",
          val.next_delivery_date
            ? moment(val.next_delivery_date, "YYYY-MM-DD").format("DD-MM-YYYY")
            : "",
        ]
          .map(sanitize)
          .map((v) => `"${v}"`);

        csvRows.push(row.join(","));
      });

      // Debugging: check counts

      // Add UTF-8 BOM for Excel + create Blob (handles large files safely)
      const csvContent = "\uFEFF" + csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

      if (blob && blob.size > 0) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "wallet_Report.csv";
        link.style.display = "none";

        document.body.appendChild(link);
        const event = new MouseEvent("click", {
          bubbles: false,
          cancelable: true,
          view: window,
        });
        link.dispatchEvent(event);
        document.body.removeChild(link);
        URL.revokeObjectURL(url); // cleanup
      } else {
        console.error("Blob is empty or invalid, cannot download.");
      }
    };

    return (
      <button className="btn btn-success btn-sm" onClick={exportToCSV}>
        Export to CSV
      </button>
    );
  };
  return (
    <div className="container-fluid">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          paddingTop: "5px",
          paddingBottom: "5px",
        }}
      >
        <h2 className="mb-3 " style={{ marginTop: "20px", fontSize: "20px" }}>
          🔍 Wallet Balance Tracker
        </h2>
      </div>
      <Form className="mb-3 p-3 border rounded bg-light">
        {/* First row: Name, Phone, Status, Wallet, Hub, Buttons */}
        <Row className="mb-3">
          <Col md={2}>
            <Form.Label>Customer Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Search by Name"
              value={filters.name}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            />
          </Col>
          <Col md={2}>
            <Form.Label>Phone Number</Form.Label>
            <Form.Control
              type="text"
              placeholder="Search by Phone"
              value={filters.phone}
              onChange={(e) =>
                setFilters({ ...filters, phone: e.target.value })
              }
            />
          </Col>
          {/* <Col md={2}>
            <Form.Label>Status</Form.Label>
            <Form.Select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
            >
              <option value="">All</option>
              <option value="Active">Active</option>
              <option value="Paused">Paused</option>
              <option value="Autopaused">Autopaused</option>
            </Form.Select>
          </Col> */}
          <Col md={2}>
            <Form.Label>Wallet Status</Form.Label>
            <Form.Select
              value={filters.walletStatus}
              onChange={(e) =>
                setFilters({ ...filters, walletStatus: e.target.value })
              }
            >
              <option value="">All</option>
              <option value="Positive">Positive</option>
              <option value="Zero">Zero</option>
              <option value="Negative">Negative</option>
            </Form.Select>
          </Col>
          <Col md={2}>
            <Form.Label>Hub</Form.Label>
            <Form.Select
              value={filters.hub}
              onChange={(e) => setFilters({ ...filters, hub: e.target.value })}
            >
              <option value="">All Hubs</option>
              {hubOptions.map((hub, i) => (
                <option key={i} value={hub}>
                  {hub}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col md={2} className="d-flex align-items-end gap-2">
            <Button variant="primary" onClick={applyFilters}>
              Apply
            </Button>
            <Button variant="outline-secondary" onClick={clearFilters}>
              Reset
            </Button>
          </Col>
        </Row>

        {/* Second row: Date Filters */}
        <Row className="mb-2">
          <Col md={2}>
            <Form.Label>Recharge Date (From)</Form.Label>
            <Form.Control
              type="date"
              value={
                filters.rechargeFrom
                  ? moment(filters.rechargeFrom).format("YYYY-MM-DD")
                  : ""
              }
              onChange={(e) =>
                setFilters({
                  ...filters,
                  rechargeFrom: e.target.value
                    ? new Date(e.target.value)
                    : null,
                })
              }
            />
          </Col>
          <Col md={2}>
            <Form.Label>Recharge Date (To)</Form.Label>
            <Form.Control
              type="date"
              value={
                filters.rechargeTo
                  ? moment(filters.rechargeTo).format("YYYY-MM-DD")
                  : ""
              }
              onChange={(e) =>
                setFilters({
                  ...filters,
                  rechargeTo: e.target.value ? new Date(e.target.value) : null,
                })
              }
            />
          </Col>
          <Col md={2}>
            <Form.Label>Last Delivery (From)</Form.Label>
            <Form.Control
              type="date"
              value={
                filters.deliveryFrom
                  ? moment(filters.deliveryFrom).format("YYYY-MM-DD")
                  : ""
              }
              onChange={(e) =>
                setFilters({
                  ...filters,
                  deliveryFrom: e.target.value
                    ? new Date(e.target.value)
                    : null,
                })
              }
            />
          </Col>
          <Col md={2}>
            <Form.Label>Last Delivery (To)</Form.Label>
            <Form.Control
              type="date"
              value={
                filters.deliveryTo
                  ? moment(filters.deliveryTo).format("YYYY-MM-DD")
                  : ""
              }
              onChange={(e) =>
                setFilters({
                  ...filters,
                  deliveryTo: e.target.value ? new Date(e.target.value) : null,
                })
              }
            />
          </Col>
          <Col md={2}>
            <Form.Label>Next Delivery Date</Form.Label>
            <Form.Control
              type="date"
              value={
                filters.nextDeliveryDate
                  ? moment(filters.nextDeliveryDate).format("YYYY-MM-DD")
                  : ""
              }
              onChange={(e) =>
                setFilters({
                  ...filters,
                  nextDeliveryDate: e.target.value
                    ? new Date(e.target.value)
                    : null,
                })
              }
            />
          </Col>
          <Col md={2}>
            <div className="d-flex gap-2">
              <ExportCSV data={filtered} />
            </div>
          </Col>
        </Row>
      </Form>

      <Table striped bordered hover responsive size="sm">
        <thead className="table-dark">
          <tr>
            <th>S.no</th>
            <th>Customer ID</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Hub</th>
            <th>Delivery Boy</th>
            <th>Wallet</th>
            <th>Credit Limit</th>
            <th>Ledger</th>
            {/* <th>Status</th> */}
            <th>Last Recharge</th>
            <th>Last Delivery</th>
            <th>Next Delivery</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="14" className="text-center">
                Loading...
              </td>
            </tr>
          ) : currentItems.length === 0 ? (
            <tr>
              <td colSpan="14" className="text-center">
                No data found.
              </td>
            </tr>
          ) : (
            currentItems.map((c, index) => (
              <tr key={`${c.customer_id || "no-id"}-${index}`}>
                <td>{indexOfFirstItem + index + 1}</td>
                <td>{c.customer_id || "-"}</td>
                <td>{c.customer_name || "-"}</td>
                <td>{c.customer_phone || "-"}</td>
                <td>{c.hub_name || "-"}</td>
                <td>{c.delivery_exe || "-"}</td>
                <td>{c.wallet_balance ?? "-"}</td>
                <td>{c.credit_limit ?? "-"}</td>
                <td>{c.wallet_balance ?? "-"}</td>
                {/* <td>{c.status === "1" ? "Active" : "Inactive"}</td> */}
                <td>
                  {c.last_recharge}
                </td>
                <td>
                  {c.last_delivery}
                </td>
                <td>
                  {c.next_delivery}
                </td>
                <td>
                  <Button
                    size="sm"
                    variant="warning"
                    onClick={() => handleCashCollection(c)}
                  >
                    💰 Cash
                  </Button>{" "}
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => handleRechargeLink(c)}
                  >
                    🔗 Recharge
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
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

      {/* Pagination Controls */}
      <div className="d-flex justify-content-between align-items-center mt-3">
        <div>
          Page {currentPage} of {totalPages}
        </div>
        <div>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>{" "}
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WalletBalanceReport;
