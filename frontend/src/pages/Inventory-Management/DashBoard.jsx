import React, { useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import { Card, Table, Row, Col, Dropdown } from "react-bootstrap";
import { useInventoryContext } from "./InventoryContext";

const Dashboard = () => {
  const {
    hubs,
    cummulativeDeliveryList,
    hubProducts,
    stockData,
    B2BPridiction
  } = useInventoryContext();
  const [data, setData] = useState([]);
  const [selectedHub, setSelectedHub] = useState("All Hubs");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const updatedStock =
      selectedHub === "All Hubs"
        ? stockData
            .sort((a, b) => a.productName.localeCompare(b.productName))
            .reduce((acc, item) => {
              const lastEntry = acc[acc.length - 1];
              if (lastEntry && lastEntry.productName === item.productName) {
                lastEntry.goodStock += item.goodStock || 0;
              } else {
                acc.push({
                  productName: item.productName,
                  goodStock: item.goodStock || 0,
                });
              }
              return acc;
            }, [])
        : stockData.filter((item) => item.hub === selectedHub);

    setData(updatedStock);
  }, [selectedHub, stockData]);

  const b2bPredictedOrders = hubs.map(({ hub_name }) => {
    const data = B2BPridiction[hub_name] || {};
    return Object.values(data).reduce((acc, val) => acc + (val || 0), 0);
  });

  const b2cPredictedOrders = hubs.map(({ hub_name }) => {
    return hubProducts
      .filter((item) => item.hubName === hub_name)
      .reduce((acc, item) => acc + (item.B2C_predicted_orders || 0), 0);
  });

  const chartData = {
    labels: hubs.map(({ hub_name }) => hub_name),
    datasets: [
      {
        label: "Predicted Orders (B2C)",
        data: b2cPredictedOrders,
        borderColor: "rgba(75,192,192,1)",
        fill: false,
      },
      {
        label: "Predicted Orders (B2B)",
        data: b2bPredictedOrders,
        borderColor: "rgb(4, 11, 235)",
        fill: false,
      },
    ],
  };

  const b2cOrders = useMemo(
    () =>
      hubProducts.reduce(
        (acc, { B2C_predicted_orders }) => acc + B2C_predicted_orders,
        0
      ),
    [cummulativeDeliveryList]
  );

  const b2bOrders = useMemo(
    () => b2bPredictedOrders.reduce((acc, val) => acc + val, 0),
    [b2bPredictedOrders]
  );

  return (
    <>
      <div className="card p-1 mb-4">
        <div className="container my-2">
          <Row>
            <Col xs={12} md={8}> 
              <h3>Dashboard</h3>
              <p className="text-muted">Monitor Order Predictions and Stock Levels.</p>
            </Col>
            
          </Row>
        </div>
      </div>

      <Row className="mt-4">
        <Col xs={12} lg={7}>
          <Card>
            <Card.Body>
              <h5 className="text-primary">Order Predictions (B2C)</h5>
              {/*prediction Date add kak backend s y yahi p new Date ko generate karo  */}
              <Line data={chartData} />
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} lg={5} className="mb-4">
  <Card className="shadow-sm">
    <Card.Body>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="text-primary mb-0">Stock Levels</h5>
        <Dropdown>
          <Dropdown.Toggle
            variant="secondary"
            id="hub-dropdown"
            className="btn-sm"
            style={{ fontSize: "0.9rem" }}
          >
            {selectedHub}
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item onClick={() => setSelectedHub("All Hubs")}>
              All Hubs
            </Dropdown.Item>
            {hubs.map(({ hub_name }, index) => (
              <Dropdown.Item
                key={index}
                onClick={() => setSelectedHub(hub_name)}
              >
                {hub_name}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>
      </div>
      <div
        className="table-responsive"
        style={{
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
      >
        <table className="table table-bordered table-striped table-hover">
          <thead className="table-primary">
            <tr>
              <th>Product</th>
              <th>Available Stock</th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data
                .filter((item) =>
                  item.productName.toLowerCase().includes(filter.toLowerCase())
                )
                .map((item, index) => (
                  <tr key={index}>
                    <td>{item.productName}</td>
                    <td>{item.goodStock}</td>
                  </tr>
                ))
            ) : (
              <tr>
                <td colSpan="2" className="text-center text-muted">
                  No Data Available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card.Body>
  </Card>
</Col>

      </Row>

      <Row className="mt-4">
        <Col xs={12} md={6} lg={4}>
          <Card className="text-center">
            <Card.Body>
              <h5>B2C Orders Predicted</h5>
              <h2>{b2cOrders}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} md={6} lg={4}>
          <Card className="text-center">
            <Card.Body>
              <h5>B2B Orders Predicted</h5>
              <h2>{b2bOrders}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} md={6} lg={4}>
          <Card className="text-center">
            <Card.Body>
              <h5>Total Orders Predicted</h5>
              <h2>{b2cOrders + b2bOrders}</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <div className="mt-4 alert alert-warning">
        <strong>Reminder:</strong> Review buffer levels before finalizing orders.
      </div>
    </>
  );
};

export default Dashboard;

