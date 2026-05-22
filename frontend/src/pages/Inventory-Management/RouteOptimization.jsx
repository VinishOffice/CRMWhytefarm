import React, { useState } from 'react';

const RouteOptimization = () => {
  // Example data for hubs and routes
  const [routes, setRoutes] = useState([
    {
      hub: 'Hub 1',
      products: [
        { productName: 'Product A', quantity: 50 },
        { productName: 'Product B', quantity: 75 },
      ],
      destination: 'Location A',
      distance: 120, // in kilometers
      deliveryTime: 2, // in hours
    },
    {
      hub: 'Hub 2',
      products: [
        { productName: 'Product C', quantity: 100 },
        { productName: 'Product A', quantity: 60 },
      ],
      destination: 'Location B',
      distance: 150, // in kilometers
      deliveryTime: 3, // in hours
    },
    {
      hub: 'Hub 3',
      products: [
        { productName: 'Product B', quantity: 200 },
        { productName: 'Product C', quantity: 150 },
      ],
      destination: 'Location C',
      distance: 90, // in kilometers
      deliveryTime: 1.5, // in hours
    },
  ]);

  const handleDistanceChange = (index, value) => {
    const updatedRoutes = [...routes];
    updatedRoutes[index].distance = value;
    setRoutes(updatedRoutes);
  };

  const handleTimeChange = (index, value) => {
    const updatedRoutes = [...routes];
    updatedRoutes[index].deliveryTime = value;
    setRoutes(updatedRoutes);
  };

  const optimizeRoute = () => {
    const optimizedRoutes = [...routes].sort((a, b) => a.distance - b.distance); // Sort by shortest distance
    setRoutes(optimizedRoutes);
  };

  return (
    <div className="container mt-4">
      <h3>Route Optimization</h3>
      <p className="text-muted">Optimizing routes based on distance, delivery time, and hub requirements.</p>

      {/* Route Optimization Table */}
      <div className="table-responsive mt-4">
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Hub</th>
              <th>Destination</th>
              <th>Products</th>
              <th>Distance (km)</th>
              <th>Delivery Time (hrs)</th>
              <th>Optimized Route</th>
            </tr>
          </thead>
          <tbody>
            {routes.map((route, index) => (
              <tr key={index}>
                <td>{route.hub}</td>
                <td>{route.destination}</td>
                <td>
                  <ul>
                    {route.products.map((product, i) => (
                      <li key={i}>{product.productName}: {product.quantity}</li>
                    ))}
                  </ul>
                </td>
                <td>
                  <input
                    type="number"
                    className="form-control text-end"
                    value={route.distance}
                    onChange={(e) => handleDistanceChange(index, parseInt(e.target.value))}
                    min="0"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="form-control text-end"
                    value={route.deliveryTime}
                    onChange={(e) => handleTimeChange(index, parseFloat(e.target.value))}
                    min="0"
                  />
                </td>
                <td>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={optimizeRoute}
                  >
                    Optimize
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Optimized Route Summary */}
      <div className="mt-4">
        <h4>Optimized Route Summary</h4>
        <div className="table-responsive">
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Hub</th>
                <th>Destination</th>
                <th>Distance (km)</th>
                <th>Delivery Time (hrs)</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((route, index) => (
                <tr key={index}>
                  <td>{route.hub}</td>
                  <td>{route.destination}</td>
                  <td>{route.distance}</td>
                  <td>{route.deliveryTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Route Optimization Button */}
      <div className="d-flex justify-content-end mt-4">
        <button
          className="btn btn-primary"
          onClick={optimizeRoute}
        >
          Optimize All Routes
        </button>
      </div>

      {/* Notes Section */}
      <div className="alert alert-info mt-4">
        <strong>Note:</strong> Route optimization is done based on the shortest distance. Delivery times and distances can be adjusted manually for accuracy.
      </div>
    </div>
  );
};

export default RouteOptimization;
