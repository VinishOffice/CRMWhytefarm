
import React, { useState, useEffect, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { useCookies } from "react-cookie";
import GlobalContext from "./context/GlobalContext";

const sidebarStyles = `
  .navigation {
    position: relative;
    height: 500px;
    width: 220px;
    box-shadow: 10px 0 0 #F4F5F7;
    border-left: 10px solid #2b343b;
    overflow-x: hidden;
    min-height: calc(100vh - 97px);
    background: #0c1e35;
    font-family: "Manrope", sans-serif;
    font-weight: 500;
    padding: 0;
    z-index: 11;
  }
  .navigation ul {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    padding-left: 5px;
    padding-top: 40px;
  }
  .navigation ul li {
    position: relative;
    list-style: none;
    width: 100%;
    border-radius: 20px 0 0 20px;
  }
  .navigation ul li.active {
    background: #F4F5F7;
  }
  .navigation ul li.active a::before {
    content: '';
    position: absolute;
    top: -30px;
    right: 0;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    box-shadow: 15px 15px 0px #F4F5F7;
  }
  .navigation ul li.active a::after {
    content: '';
    position: absolute;
    bottom: -30px;
    right: 0;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    box-shadow: 15px -15px 0px #F4F5F7;
  }
  .icon-lg {
    width: 64px;
    height: 64px;
    height: 1.6em;
    width: 1.6em;
  }
  .icon-shape {
    width: 48px;
    height: 48px;
    background-position: center;
    border-radius: 0.5rem;
  }
  .bg-gradient-success {
    background-image: linear-gradient(195deg, #66BB6A 0%, #43A047 100%);
  }
  .shadow-success {
    box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.14), 0 7px 10px -5px rgba(76, 175, 80, 0.4) !important;
  }
  .text-center {
    text-align: center !important;
  }
  .mt-n4 {
    margin-top: -1.5rem !important;
  }
  .position-absolute {
    position: absolute !important;
  }
  .icon {
    fill: currentColor;
    stroke: none;
    display: inline-block;
    color: #111111;
    height: 1em;
    width: 1em;
  }
  .icon-shape i {
    color: #fff;
    opacity: 0.8;
    top: 11px;
    position: relative;
  }
  .material-icons {
    font-family: 'Material Icons Round';
    font-weight: normal;
    font-style: normal;
    font-size: 20px;
    display: inline-block;
    line-height: 1;
    text-transform: none;
    letter-spacing: normal;
    word-wrap: normal;
    white-space: nowrap;
    direction: ltr;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    -moz-osx-font-smoothing: grayscale;
    font-feature-settings: 'liga';
  }
  .opacity-10 {
    opacity: 1 !important;
  }
`;
function Sidebar() {
  const { permissible_roles } = useContext(GlobalContext);
  useCookies(["permissions"]);

  const [activeItem, setActiveItem] = useState(null);
  const location = useLocation();

  useEffect(() => {
    // Extract the current route from the location object
    const currentRoute = location.pathname;

    // Determine the active item based on the current route
    setActiveItem(currentRoute);
  }, [location]);

  const handleMenuClick = (itemName) => {
    setActiveItem(itemName);
  };

  return (
    <>
      <style>{sidebarStyles}</style>
      <nav className="sidebar sidebar-offcanvas" id="sidebar">
        <ul className="nav" style={{ marginTop: "50px" }}>
          {permissible_roles.includes("dashboard") ? (
            <>
              <li className={`nav-item ${activeItem === "/" ? "active" : ""}`}>
                <Link
                  className="nav-link"
                  to="/"
                  onClick={() => handleMenuClick("/")}
                >
                  <i className="mdi mdi-grid-large menu-icon"></i>
                  <span className="menu-title">Dashboard</span>
                </Link>
              </li>
            </>
          ) : (
            <></>
          )}
          {permissible_roles.includes("hubs_dist") ? (
            <>
              <li
                className={`nav-item ${
                  activeItem === "/vendors_data" ? "active" : ""
                }`}
              >
                <Link
                  className="nav-link"
                  to="/vendors_data"
                  onClick={() => handleMenuClick("/vendors_data")}
                >
                  <i className="menu-icon mdi mdi-factory"></i>
                  <span className="menu-title">Hubs/Distributors</span>
                </Link>
              </li>
            </>
          ) : (
            <></>
          )}

          {permissible_roles.includes("locations") ? (
            <>
              <li className="nav-item">
                <a
                  className="nav-link"
                  data-bs-toggle="collapse"
                  href="#locations"
                  aria-expanded="false"
                  aria-controls="locations"
                >
                  <i className="menu-icon mdi mdi-map-marker"></i>
                  <span className="menu-title">Locations</span>
                  <i className="menu-arrow"></i>
                </a>
                <div className="collapse" id="locations">
                  <ul className="nav flex-column sub-menu">
                    {permissible_roles.includes("locations") ? (
                      <>
                        <li
                          className={`nav-item ${
                            activeItem === "/location" ? "active" : ""
                          }`}
                        >
                          {" "}
                          <Link
                            className="nav-link"
                            to="/location"
                            onClick={() => handleMenuClick("/location")}
                          >
                            Locations
                          </Link>
                        </li>
                      </>
                    ) : (
                      <></>
                    )}
                    {permissible_roles.includes("routes") ? (
                      <>
                        <li className="nav-item">
                          {" "}
                          <Link className="nav-link" to="/routes">
                            Routes
                          </Link>
                        </li>
                      </>
                    ) : (
                      <></>
                    )}
                  </ul>
                </div>
              </li>
            </>
          ) : (
            <></>
          )}

          {permissible_roles.includes("customers") ? (
            <>
              <li
                className={`nav-item ${
                  activeItem === "/customers" ? "active" : ""
                }`}
              >
                <Link
                  className="nav-link"
                  to="/customers"
                  onClick={() => handleMenuClick("/customers")}
                >
                  <i className="menu-icon mdi mdi-account-convert"></i>
                  <span className="menu-title">Customers</span>
                </Link>
              </li>
            </>
          ) : (
            <></>
          )}

          {permissible_roles.includes("marketing") ? (
            <>
              <li className="nav-item">
                <a
                  className="nav-link"
                  data-bs-toggle="collapse"
                  href="#marketing"
                  aria-expanded="false"
                  aria-controls="marketing"
                >
                  <i className="menu-icon mdi mdi-bullhorn"></i>
                  <span className="menu-title">Marketing</span>
                  <i className="menu-arrow"></i>
                </a>
                <div className="collapse" id="marketing">
                  <ul className="nav flex-column sub-menu">
                    <li className="nav-item">
                      {" "}
                      <Link className="nav-link" to="/banners">
                        Banners
                      </Link>
                    </li>
                    <li className="nav-item">
                      {" "}
                      <Link className="nav-link" to="/marketing">
                        Marketing
                      </Link>
                    </li>
                    <li className="nav-item">
                      {" "}
                      <Link className="nav-link" to="/cart-products">
                        Cart Products
                      </Link>
                    </li>
                    <li className="nav-item">
                      {" "}
                      <Link className="nav-link" to="/recurring-customers">
                        Recurring Customers
                      </Link>
                    </li>
                    <li className="nav-item">
                      {" "}
                      <Link className="nav-link" to="/communication">
                      Communication
                      </Link>
                    </li>
                  </ul>
                </div>
              </li>
            </>
          ) : (
            <></>
          )}

          {permissible_roles.includes("reports") ? (
            <>
              <li
                className={`nav-item ${
                  activeItem === "/reports" ? "active" : ""
                }`}
              >
                <Link
                  className="nav-link"
                  to="/reports"
                  onClick={() => handleMenuClick("/reports")}
                >
                  <i className="menu-icon mdi mdi-file-document"></i>
                  <span className="menu-title">Reports</span>
                </Link>
              </li>
            </>
          ) : (
            <></>
          )}
          {permissible_roles.includes("Tablecod") ? (
            <>
              <li
                className={`nav-item ${
                  activeItem === "/TableCod" ? "active" : ""
                }`}
              >
                <Link
                  className="nav-link"
                  to="/TableCod"
                  onClick={() => handleMenuClick("/TableCod")}
                >
                <i className=" menu-icon mdi mdi-cash"></i>
                  <span className="menu-title">Cod-Orders</span>
                </Link>
              </li>
            </>
          ) : (
            <></>
          )}

          {permissible_roles.includes("products") ? (
            <>
              <li
                className={`nav-item ${
                  activeItem === "/products" ? "active" : ""
                }`}
              >
                <Link
                  className="nav-link"
                  to="/products"
                  onClick={() => handleMenuClick("/products")}
                >
                  <i className="menu-icon mdi mdi-package-variant"></i>
                  <span className="menu-title">Products</span>
                </Link>
              </li>
            </>
          ) : (
            <></>
          )}

          {permissible_roles.includes("tickets") ? (
            <>
              <li
                className={`nav-item ${
                  activeItem === "/tickets" ? "active" : ""
                }`}
              >
                <Link
                  className="nav-link"
                  to="/tickets"
                  onClick={() => handleMenuClick("/tickets")}
                >
                  <i className="menu-icon mdi mdi-ticket"></i>
                  <span className="menu-title">Tickets</span>
                </Link>
              </li>
            </>
          ) : (
            <></>
          )}

          {permissible_roles.includes("b2b") ? (
            <>
              <li className="nav-item">
                <a
                  className="nav-link"
                  data-bs-toggle="collapse"
                  href="#b2b"
                  aria-expanded="false"
                  aria-controls="b2b"
                >
                  <i className="menu-icon mdi mdi-briefcase-account
"></i>
                  <span className="menu-title">B2B</span>
                  <i className="menu-arrow"></i>
                </a>
                <div className="collapse" id="b2b">
                  <ul className="nav flex-column sub-menu">
                    {permissible_roles.includes("b2b") && (
                      <>
                        <li
                          className={`nav-item ${
                            activeItem === "/cafe-management" ? "active" : ""
                          }`}
                        >
                          <Link
                            className="nav-link"
                            to="/cafe-management"
                            onClick={() => handleMenuClick("/cafe-management")}
                          >
                            Cafe Management
                          </Link>
                        </li>
                        <li className="nav-item">
                          <Link className="nav-link" to="/cafe-summary">
                            Summary
                          </Link>
                        </li>
                        <li
                          className={`nav-item ${
                            activeItem === "/b2b_banner" ? "active" : ""
                          }`}
                        >
                          <Link
                            className="nav-link"
                            to="/b2b_banner"
                            onClick={() => handleMenuClick("/b2b_banner")}
                          >
                            B2b Banner
                          </Link>
                        </li>
                       
                        <li
                          className={`nav-item ${
                            activeItem === "/OrderSumary" ? "active" : ""
                          }`}
                        >
                          <Link
                            className="nav-link"
                            to="/OrderSumary"
                            onClick={() => handleMenuClick("/OrderSumary")}
                          >
                            cafehistory
                          </Link>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </li>
            </>
          ) : (
              <></>
          )}
              

          {permissible_roles.includes("inventory") ? (
            <>
              <li
                className={`nav-item ${
                  activeItem === "/inventory-management" ? "active" : ""
                }`}
              >
                <Link
                  className="nav-link"
                  to="/inventory-management"
                  onClick={() => handleMenuClick("/inventory-management")}
                >
                  <i className="menu-icon mdi mdi-warehouse"></i>
                  <span className="menu-title">Inventory</span>
                </Link>
              </li>
            </>
          ) : (
            <></>
          )}
          {/* {permissible_roles.includes("lowbalance") ? (
            <>
              <li className="nav-item">
                <a
                  className="nav-link"
                  data-bs-toggle="collapse"
                  href="#lowbalance"
                  aria-expanded="false"
                  aria-controls="lowbalance"
                >
                  <i className="menu-icon mdi mdi-account-convert"></i>
                  <span className="menu-title">Low Balance</span>
                  <i className="menu-arrow"></i>
                </a>
                <div className="collapse" id="lowbalance">
                  <ul className="nav flex-column sub-menu">
                  {permissible_roles.includes("lb_dashboard") ? 
                    <li className="nav-item">
                      {" "}
                      <Link className="nav-link" to="/lowbalance-dashboard">
                        Dashboard
                      </Link>
                    </li>
                      : <></>
                      }
                      {permissible_roles.includes("lb_task") ? 
                    <li className="nav-item">
                      {" "}
                      <Link className="nav-link" to="/lowbalance-assign-task">
                        Assign Task
                      </Link>
                    </li>
                    : <></> 
                    }
                    
                  </ul>
                </div>
              </li>
            </>
          ) : (
            <></>
          )} */}
        </ul>
      </nav>
    </>
  );
}

export default Sidebar;
