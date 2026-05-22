import React, { useState } from 'react';

const Distribution = () => {
  // Example data for final orders, stock, and hub requirements
  const [products, setProducts] = useState([
    {
      id: 1,
      productName: 'Product A',
      finalOrder: 100,
      stock: 50,
      hubAllocation: 0,
    },
    {
      id: 2,
      productName: 'Product B',
      finalOrder: 200,
      stock: 100,
      hubAllocation: 0,
    },
    {
      id: 3,
      productName: 'Product C',
      finalOrder: 300,
      stock: 150,
      hubAllocation: 0,
    },
  ]);

  const [hubs, setHubs] = useState([
    { id: 1, hubName: 'Hub 1', allocation: 0 },
    { id: 2, hubName: 'Hub 2', allocation: 0 },
    { id: 3, hubName: 'Hub 3', allocation: 0 },
  ]);

  // Update final order for a product
  const handleFinalOrderChange = (productId, value) => {
    const updatedProducts = products.map((product) =>
      product.id === productId ? { ...product, finalOrder: value } : product
    );
    setProducts(updatedProducts);
  };

  // Update stock for a product
  const handleStockChange = (productId, value) => {
    const updatedProducts = products.map((product) =>
      product.id === productId ? { ...product, stock: value } : product
    );
    setProducts(updatedProducts);
  };

  // Update hub allocation for a product
  const handleHubAllocationChange = (productId, hubId, value) => {
    const updatedProducts = products.map((product) => {
      if (product.id === productId) {
        const updatedHubs = product.hubAllocation.map((hub) =>
          hub.id === hubId ? { ...hub, allocation: value } : hub
        );
        return { ...product, hubAllocation: updatedHubs };
      }
      return product;
    });
    setProducts(updatedProducts);
  };

  // Generate distribution sheet
  const generateDistributionSheet = () => {
    const distributionData = products.map((product) => {
      const totalAllocation = hubs.reduce((acc, hub) => acc + hub.allocation, 0);
      const remainingStock = product.stock - totalAllocation;
      return {
        productName: product.productName,
        finalOrder: product.finalOrder,
        stock: product.stock,
        totalAllocation,
        remainingStock,
        status: remainingStock >= 0 ? 'Sufficient' : 'Insufficient',
      };
    });
    return distributionData;
  };

  const distributionData = generateDistributionSheet();

  return (
    <div className="container mt-4">
      <h3>Distribution Sheet</h3>

      {/* Product and Stock Information */}
      <div className="table-responsive mt-4">
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Final Order</th>
              <th>Stock</th>
              <th>Hub Allocations</th>
              <th>Remaining Stock</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.productName}</td>
                <td>
                  <input
                    type="number"
                    className="form-control text-end"
                    value={product.finalOrder}
                    min="0"
                    onChange={(e) => handleFinalOrderChange(product.id, parseInt(e.target.value))}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="form-control text-end"
                    value={product.stock}
                    min="0"
                    onChange={(e) => handleStockChange(product.id, parseInt(e.target.value))}
                  />
                </td>
                <td>
                  {hubs.map((hub) => (
                    <div key={hub.id} className="mb-2">
                      <label>{hub.hubName}</label>
                      <input
                        type="number"
                        className="form-control form-control-sm text-end"
                        value={hub.allocation}
                        min="0"
                        onChange={(e) => handleHubAllocationChange(product.id, hub.id, parseInt(e.target.value))}
                      />
                    </div>
                  ))}
                </td>
                <td>{product.stock - hubs.reduce((acc, hub) => acc + hub.allocation, 0)}</td>
                <td>
                  {product.stock - hubs.reduce((acc, hub) => acc + hub.allocation, 0) >= 0
                    ? 'Sufficient'
                    : 'Insufficient'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Distribution Summary */}
      <div className="mt-4">
        <h4>Distribution Summary</h4>
        <div className="table-responsive">
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Final Order</th>
                <th>Stock</th>
                <th>Total Allocation</th>
                <th>Remaining Stock</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {distributionData.map((product, index) => (
                <tr key={index}>
                  <td>{product.productName}</td>
                  <td>{product.finalOrder}</td>
                  <td>{product.stock}</td>
                  <td>{product.totalAllocation}</td>
                  <td>{product.remainingStock}</td>
                  <td>{product.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Distribution;
