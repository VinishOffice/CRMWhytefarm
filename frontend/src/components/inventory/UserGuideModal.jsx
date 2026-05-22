import React from "react";

const UserGuideModal = ({ showGuide, setShowGuide }) => {
  return (
    showGuide && (
      <div
        className="modal show fade"
        style={{
          display: "block",
          background: "rgba(0, 0, 0, 0.5)",
          zIndex: 1050,
          overflowY: "scroll",
        }}
        tabIndex="-1"
      >
        <div className="modal-dialog modal-lg" style={{ width: "70%" }}>
          <div className="modal-content" style={{ backgroundColor: "#f8f9fa" }}>
            <div
              className="modal-header"
              style={{ backgroundColor: "#007bff", color: "white" }}
            >
              <h5 className="modal-title">User Guide</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowGuide(false)}
              ></button>
            </div>
            <div className="modal-body">
              <h4 style={{ color: "#007bff" }}>Dispatch Overview</h4>
              <p style={{ color: "#6c757d" }}>
                This section allows you to manage the dispatch of{" "}
                <span style={{ fontWeight: "bold", color: "#007bff" }}>
                  products
                </span>{" "}
                from{" "}
                <span style={{ fontWeight: "bold", color: "#007bff" }}>
                  hubs
                </span>{" "}
                to{" "}
                <span style={{ fontWeight: "bold", color: "#007bff" }}>
                  destinations
                </span>
                . You can{" "}
                <span style={{ fontWeight: "bold", color: "#28a745" }}>
                  add new dispatches
                </span>
                ,{" "}
                <span style={{ fontWeight: "bold", color: "#ffc107" }}>
                  edit
                </span>{" "}
                them, or{" "}
                <span style={{ fontWeight: "bold", color: "#dc3545" }}>
                  delete
                </span>{" "}
                them as needed.
              </p>
              <div className="row mt-4">
                <div className="col-6">
                  <h5 style={{ color: "#28a745" }}>Creating a New Dispatch</h5>
                  <ul
                    className="d-flex flex-column gap-2"
                    style={{ listStyleType: "square" }}
                  >
                    <li>
                      <span style={{ fontWeight: "bold", color: "#007bff" }}>
                        Click
                      </span>{" "}
                      to{" "}
                      <button
                        className="btn btn-primary p-2"
                        style={{ fontSize: "0.9rem" }}
                      >
                        Create New Dispatch
                      </button>{" "}
                      button.
                    </li>
                    <li>
                      <span style={{ fontWeight: "bold", color: "#007bff" }}>
                        Select
                      </span>{" "}
                      a{" "}
                      <span
                        style={{
                          fontWeight: "bold",
                          color: "#007bff",
                          backgroundColor: "rgba(0, 123, 255, 0.1)",
                          padding: "0.2rem 0.4rem",
                          borderRadius: "4px",
                        }}
                      >
                        hub
                      </span>
                      ,{" "}
                      <span
                        style={{
                          fontWeight: "bold",
                          color: "#007bff",
                          backgroundColor: "rgba(0, 123, 255, 0.1)",
                          padding: "0.2rem 0.4rem",
                          borderRadius: "4px",
                        }}
                      >
                        product
                      </span>
                      , and{" "}
                      <span
                        style={{
                          fontWeight: "bold",
                          color: "#007bff",
                          backgroundColor: "rgba(0, 123, 255, 0.1)",
                          padding: "0.2rem 0.4rem",
                          borderRadius: "4px",
                        }}
                      >
                        quantity
                      </span>{" "}
                      from the dropdowns.
                    </li>
                    <li>
                      <span style={{ fontWeight: "bold", color: "#007bff" }}>
                        Click
                      </span>{" "}
                      to{" "}
                      <button
                        className="btn btn-primary p-2"
                        style={{ fontSize: "0.9rem" }}
                      >
                        Add Product
                      </button>{" "}
                      to add the selected item to the dispatch list.
                    </li>
                    <li>
                      <span style={{ fontWeight: "bold", color: "#007bff" }}>
                        Click
                      </span>{" "}
                      to{" "}
                      <button
                        className="btn btn-primary p-2"
                        style={{ fontSize: "0.9rem" }}
                      >
                        Create Dispatch
                      </button>{" "}
                      to finalize and submit the dispatch.
                    </li>
                  </ul>
                  <div
                    style={{
                      backgroundColor: "#d1ecf1",
                      padding: "1rem",
                      borderRadius: "5px",
                    }}
                  >
                    <strong>Note:</strong> If a product is already added, its
                    quantity will be updated instead of creating a new entry.
                  </div>
                </div>
                <div className="col-6">
                  <h5 style={{ color: "#ffc107" }}>
                    Editing and Deleting Dispatches
                  </h5>
                  <ul style={{ listStyleType: "circle" }}>
                    <li>
                      <span style={{ fontWeight: "bold", color: "#007bff" }}>
                        Click
                      </span>{" "}
                      to{" "}
                      <button
                        className="btn btn-primary p-2"
                        style={{ fontSize: "0.9rem" }}
                      >
                        Update
                      </button>{" "}
                      to change the{" "}
                      <span style={{ fontWeight: "bold", color: "#007bff" }}>
                        status
                      </span>{" "}
                      of a dispatch and{" "}
                      <span style={{ fontWeight: "bold", color: "#007bff" }}>
                        quantity
                      </span>{" "}
                      of a product.
                    </li>
                    <li>
                      <span style={{ fontWeight: "bold", color: "#007bff" }}>
                        Click
                      </span>{" "}
                      to{" "}
                      <button
                        className="btn btn-danger p-2"
                        style={{ fontSize: "0.9rem" }}
                      >
                        Delete
                      </button>{" "}
                      to remove a dispatch from the list.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  );
};

export default UserGuideModal;
