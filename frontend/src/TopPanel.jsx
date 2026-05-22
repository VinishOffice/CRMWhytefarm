import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCookies } from "react-cookie";
import GlobalContext from "./context/GlobalContext";

function TopPanel() {
  const { permissible_roles, state_user } = useContext(GlobalContext);
  const [cookies, setCookie, removeCookie] = useCookies(["permissions"]);
  
  const userRole = state_user.role;
  const rolePermissions = permissible_roles;
  const userName = state_user.username || "Admin";
  const userImage = state_user.user_image || "";
  const role = state_user.role || "Admin";

  const navigate = useNavigate();
  const [timeOfDay, setTimeOfDay] = useState('');

  useEffect(() => {
    const currentTime = new Date().getHours();
    if (currentTime < 12) {
      setTimeOfDay('Good Morning');
    } else if (currentTime >= 12 && currentTime < 18) {
      setTimeOfDay('Good Afternoon');
    } else {
      setTimeOfDay('Good Evening');
    }
  }, []);

  const handleLogout = () => {
    removeCookie("permissions");
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    localStorage.removeItem("loggedIn_user");
    localStorage.removeItem("role");
    localStorage.removeItem("hub_name");
    navigate("/login");
  };

  return (
    <nav className="navbar default-layout col-lg-12 col-12 p-0 fixed-top d-flex align-items-top flex-row">
      <div className="text-center navbar-brand-wrapper d-flex align-items-center justify-content-start">
        <div className="me-3">
          <button className="navbar-toggler navbar-toggler align-self-center" type="button" data-bs-toggle="minimize">
            <span className="icon-menu"></span>
          </button>
        </div>
        <div>
          <Link className="navbar-brand brand-logo" to="/">
            <img src="https://www.whytefarms.com/img/logo-icon.png" alt="logo" />
          </Link>
          <Link className="navbar-brand brand-logo-mini" to="/">
            <img src="/images/logo-mini.svg" alt="logo" />
          </Link>
        </div>
      </div>

      <div className="navbar-menu-wrapper d-flex align-items-top">
        <ul className="navbar-nav">
          <li className="nav-item font-weight-semibold d-none d-lg-block ms-0">
            <h1 className="welcome-text">
              {timeOfDay}, <span className="text-black fw-bold">{role}</span>
            </h1>
          </li>
        </ul>

        <ul className="navbar-nav ms-auto">
          {/* Profile dropdown */}
          <li className="nav-item dropdown d-none d-lg-block user-dropdown">
            <a
              className="nav-link"
              id="UserDropdown"
              href="#"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <img
                src={userImage}
                alt="Profile"
                title={userName}
                style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}`;
                }}
              />
            </a>
            <div className="dropdown-menu dropdown-menu-end navbar-dropdown" aria-labelledby="UserDropdown">
              <div className="dropdown-header text-center">
                <img
                  src={userImage}
                  alt="Profile"
                  title={userName}
                  style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}`;
                  }}
                />
                <p className="mb-1 mt-3 font-weight-semibold">{userRole}</p>
              </div>

              {rolePermissions.includes("profile") && (
                <Link className="dropdown-item" to="/profile">
                  <i className="dropdown-item-icon mdi mdi-account-outline text-primary me-2"></i>
                  Profile
                </Link>
              )}

              {rolePermissions.includes("users") && (
                <Link className="dropdown-item" to="/users">
                  <i className="dropdown-item-icon mdi mdi-message-text-outline text-primary me-2"></i>
                  Manage Users & Roles
                </Link>
              )}

              <a className="dropdown-item" onClick={handleLogout}>
                <i className="dropdown-item-icon mdi mdi-power text-primary me-2"></i>
                LogOut
              </a>
            </div>
          </li>
        </ul>

        <button
          className="navbar-toggler navbar-toggler-right d-lg-none align-self-center"
          type="button"
          data-bs-toggle="offcanvas"
        >
          <span className="mdi mdi-menu"></span>
        </button>
      </div>
    </nav>
  );
}

export default TopPanel;
