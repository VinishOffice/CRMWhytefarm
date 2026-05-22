import React, { useState, useEffect } from "react";
import Select from "react-select";
import apiClient from "./services/apiClient";

function TransferHubLocationModal() {
  const [hubOptions, setHubOptions] = useState([]);
  const [userOptions, setUserOptions] = useState([]);
  const [locationOptions, setLocationOptions] = useState([]);

  const [selectedHub, setSelectedHub] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedLocations, setSelectedLocations] = useState([]);

  // ✅ Fetch hubs
  useEffect(() => {
    const fetchHubs = async () => {
      try {
        const docs = await apiClient.post("/api/hubs_master/query", { filters: [] }).then(res => res.data?.data || []);
        const hubs = docs.map((doc) => ({
          value: doc.hub_name,
          label: doc.hub_name,
          id: doc._id,
        }));
        setHubOptions(hubs);
      } catch (error) {
        console.error("Error fetching hubs:", error);
      }
    };
    fetchHubs();
  }, []);

  // ✅ Fetch users when hub selected
  useEffect(() => {
    if (selectedHub) {
      const fetchUsers = async () => {
        try {
          const docs = await apiClient.post("/api/hubs_users_data/query", {
            filters: [{ field: "hub_name", op: "==", value: selectedHub.value }]
          }).then(res => res.data?.data || []);
          const users = docs.map((doc) => ({
            value: doc._id,
            label: `${doc.first_name || ""} ${doc.last_name || ""}`.trim(),
          }));
          setUserOptions(users);
        } catch (error) {
          console.error("Error fetching users:", error);
        }
      };
      fetchUsers();
    }
  }, [selectedHub]);

  // ✅ Fetch locations when user selected
  useEffect(() => {
    if (selectedUser) {
      const fetchLocations = async () => {
        try {
          const docs = await apiClient.post("/api/hubs_locations_data/query", {
            filters: [{ field: "delivery_executive", op: "==", value: selectedUser.value }]
          }).then(res => res.data?.data || []);
          const locs = docs.map((doc) => ({
            id: doc._id,
            name: doc.location,
          }));
          setLocationOptions(locs);
        } catch (error) {
          console.error("Error fetching locations:", error);
        }
      };
      fetchLocations();
    }
  }, [selectedUser]);

  // ✅ Handle location checkbox select
  const handleLocationSelect = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setSelectedLocations((prev) => [...prev, value]);
    } else {
      setSelectedLocations((prev) => prev.filter((loc) => loc !== value));
    }
  };

  // ✅ Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Example: Update locations to assign to user
    try {
      for (let loc of selectedLocations) {
        const docs = await apiClient.post("/api/hubs_locations_data/query", {
          filters: [{ field: "location", op: "==", value: loc }]
        }).then(res => res.data?.data || []);

        await Promise.all(docs.map(doc => 
          apiClient.put(`/api/hubs_locations_data/${doc._id}`, {
            delivery_executive: selectedUser.value,
            hub_name: selectedHub.value,
            updated_date: new Date(),
          })
        ));
      }
      alert("✅ Locations transferred successfully!");
    } catch (error) {
      console.error("Error transferring locations:", error);
      alert("❌ Error transferring locations");
    }
  };

  return (
    <div
      className="modal fade"
      id="transferModal"
      tabIndex="-1"
      role="dialog"
      aria-labelledby="transferLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-lg" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="transferLabel">
              Transfer Hub Locations
            </h5>
            <button
              type="button"
              className="close"
              data-bs-dismiss="modal"
              aria-label="Close"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Hub Selection */}
              <div className="form-group">
                <label>Select Hub</label>
                <Select
                  options={hubOptions}
                  value={selectedHub}
                  onChange={setSelectedHub}
                  placeholder="Choose Hub"
                />
              </div>

              {/* User Selection */}
              <div className="form-group">
                <label>Select User</label>
                <Select
                  options={userOptions}
                  value={selectedUser}
                  onChange={setSelectedUser}
                  placeholder="Choose User"
                />
              </div>

              {/* Location Selection */}
              <div className="form-group">
                <label>Select Locations</label>
                {locationOptions.map((loc) => (
                  <div className="form-check" key={loc.id}>
                    <input
                      type="checkbox"
                      className="form-check-input"
                      value={loc.name}
                      onChange={handleLocationSelect}
                      id={loc.id}
                    />
                    <label className="form-check-label" htmlFor={loc.id}>
                      {loc.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button type="submit" className="btn btn-success">
                Transfer
              </button>
              <button
                type="button"
                className="btn btn-light"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default TransferHubLocationModal;
