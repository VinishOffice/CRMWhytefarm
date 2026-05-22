import React, { useState } from 'react';

const UserManagement = () => {
  const [users, setUsers] = useState([
    { id: 1, name: 'Alice', role: 'Admin', email: 'alice@example.com' },
    { id: 2, name: 'Bob', role: 'User', email: 'bob@example.com' },
    { id: 3, name: 'Charlie', role: 'Manager', email: 'charlie@example.com' },
  ]);
  const [newUser, setNewUser] = useState({ name: '', role: '', email: '' });
  const [selectedRole, setSelectedRole] = useState('All');
  const [popup, setPopup] = useState(false);

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email || !newUser.role) {
      alert('Please fill in all fields.');
      return;
    }
    const newUserData = { id: users.length + 1, ...newUser };
    setUsers([...users, newUserData]);
    setNewUser({ name: '', role: '', email: '' });
    setPopup(false); // Close popup after adding user
  };

  const handleAddUserPopup = () => {
    setPopup((prev) => !prev);
  };

  const handleEditUser = (index, updatedData) => {
    const updatedUsers = [...users];
    updatedUsers[index] = updatedData;
    setUsers(updatedUsers);
  };

  const handleDeleteUser = (id) => {
    setUsers(users.filter((user) => user.id !== id));
  };
  const handleViewUser = (id) => {
    
  };

  const handleFilterChange = (e) => {
    setSelectedRole(e.target.value);
  };

  const filteredUsers =
    selectedRole === 'All' ? users : users.filter((user) => user.role === selectedRole);

  return (
    <div className="container mt-4 position-relative">
      <div className="card-header text-black mb-3">
        <h3 className="mb-0">User Management</h3>
      </div>

      {popup && (
        <>
          {/* Background Blur */}
          <div
            className="position-fixed top-0 start-0 w-100 h-100"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(5px)',
              zIndex: 1040,
            }}
            onClick={handleAddUserPopup} // Close popup on background click
          ></div>

          {/* Popup */}
          <div
  className="card shadow position-fixed top-50 start-50 translate-middle"
  style={{
    zIndex: 1050,
    width: '70%',
    maxWidth: '300px',
  }}
>
  <div
    className="card-header d-flex align-items-center justify-content-between"
  >
    <h5 className="mb-0 text-black fs-4">Add New User</h5>
    <button
      className="btn-close btn-close-black"
      onClick={handleAddUserPopup}
      style={{
        backgroundColor: '#ff0000',
        borderRadius: '50%',
        padding: '0.5rem',
        transform: 'scale(1.2)',
      }}
    ></button>
  </div>
  <div className="card-body">
    <div className="mb-3 d-flex flex-row gap-2">
    <label>Name <sup style={{color: "red"}}>*</sup></label>
      <input
        type="text"
        className="form-control"
        placeholder="Name"
        value={newUser.name}
        required = {true}
        onChange={(e) =>
          setNewUser({ ...newUser, name: e.target.value })
        }
      />
    </div>
    <div className="mb-3 d-flex flex-row gap-2">
      <label>Email <sup style={{color: "red"}}>*</sup></label>
      <input
        type="email"
        className="form-control"
        placeholder="Email"
        value={newUser.email}
        required = {true}
        onChange={(e) =>
          setNewUser({ ...newUser, email: e.target.value })
        }
      />
    </div>
    <div className="mb-3 d-flex flex-row gap-2">
    <label>Role <sup style={{color: "red"}}>*</sup></label>
      <select
        className="form-select"
        value={newUser.role}
        onChange={(e) =>
          setNewUser({ ...newUser, role: e.target.value })
        }
      >
        <option value="">Select Role</option>
        <option value="Admin">Admin</option>
        <option value="Manager">Manager</option>
        <option value="User">User</option>
      </select>
    </div>
    <button className="btn btn-success w-100" onClick={handleAddUser}>
      Add User
    </button>
  </div>
</div>

        </>
      )}

      <div className="card shadow">
        <div className="card-body">
          <div className="row align-items-center">
            <h5 className="col-md-6">Users</h5>
            <div className="col-md-6 text-end">
              <button className="btn btn-success" onClick={handleAddUserPopup}>
                Add User
              </button>
            </div>
          </div>
          <div className="row mt-3">
            <div className="col-md-6">
              <h5>Filter by Role</h5>
              <select
                className="form-select"
                onChange={handleFilterChange}
                value={selectedRole}
              >
                <option value="All">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="User">User</option>
              </select>
            </div>
          </div>
          <div className="table-responsive mt-4">
            <table className="table table-hover table-bordered">
              <thead className="table-light">
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Actions</th>
                  <th>More Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>
                      <button
                        className="btn btn-warning btn-sm"
                        onClick={() =>
                          handleEditUser(index, {
                            ...user,
                            name: prompt('Edit Name:', user.name) || user.name,
                          })
                        }
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger btn-sm ms-2"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        Delete
                      </button>
                    </td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm ms-2"
                        onClick={() => handleViewUser(user.id)}
                      >
                        view
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
