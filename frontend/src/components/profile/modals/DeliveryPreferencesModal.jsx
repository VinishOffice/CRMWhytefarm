import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import apiClient from "../../../services/apiClient";

const DeliveryPreferencesModal = ({ customer, onUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [daysOfWeek] = useState([
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
  ]);
  const [selectedDays, setSelectedDays] = useState([]);
  const [submitDF, setSubmitDF] = useState({
    delivery_mode: "",
    additional_instruction: "",
  });
  const [dfID, setDfID] = useState(null);
  const [delPreData, setDelPreData] = useState([]);

  const del_mo = ["Doorstep", "Security", "Handover", "Bag", "Other"];

  useEffect(() => {
    if (customer?.customer_id) {
      fetchPreferences();
    }
  }, [customer]);

  const fetchPreferences = async () => {
    try {
      const res = await apiClient.post("/api/delivery_preference/query", {
        filters: [{ field: "customer_id", op: "==", value: customer.customer_id }]
      });
      const data = res.data?.data || [];
      setDelPreData(data);
      if (data.length > 0) {
        const pref = data[0];
        setDfID(pref._id);
        setSubmitDF({
          delivery_mode: pref.delivery_mode || "",
          additional_instruction: pref.additional_instruction || "",
        });
        setSelectedDays(pref.selected_days || []);
      }
    } catch (error) {
      console.error("Error fetching delivery preferences:", error);
    }
  };

  const handleChangeDF = (e) => {
    const { id, value } = e.target;
    setSubmitDF((prev) => ({ ...prev, [id]: value }));
  };

  const handleDayChange = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmitDF = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      delivery_mode: submitDF.delivery_mode,
      additional_instruction: submitDF.additional_instruction,
      selected_days: selectedDays,
      status: "1",
      customer_phone: customer.customer_phone,
      customer_id: customer.customer_id,
      customer_name: customer.customer_name,
      updated_date: new Date(),
    };

    try {
      if (delPreData.length === 1) {
        await apiClient.patch(`/api/delivery_preference/${dfID}`, payload);
      } else {
        await apiClient.post("/api/delivery_preference", {
          ...payload,
          created_date: new Date(),
        });
      }

      Swal.fire("Success", "Delivery preferences updated successfully", "success");
      if (onUpdated) onUpdated();
      
      const closeBtn = document.querySelector("#exampleModal-df .close");
      if (closeBtn) closeBtn.click();
    } catch (error) {
      console.error("Error saving delivery preferences:", error);
      Swal.fire("Error", "Failed to save preferences", "error");
    } finally {
      setLoading(false);
    }
  };

  const renderCheckboxPairs = () => {
    const pairs = [];
    for (let i = 0; i < daysOfWeek.length; i += 2) {
      pairs.push(daysOfWeek.slice(i, i + 2));
    }

    return pairs.map((pair, index) => (
      <div key={index} className="form-row d-flex ps-4 mb-2">
        {pair.map((day) => (
          <div key={day} className="form-check col">
            <input
              type="checkbox"
              id={`df-${day}`}
              checked={selectedDays.includes(day)}
              onChange={() => handleDayChange(day)}
              className="form-check-input"
            />
            <label htmlFor={`df-${day}`} className="form-check-label ms-2">
              {day}
            </label>
          </div>
        ))}
      </div>
    ));
  };

  return customer ? (
    <div
      className="modal df fade"
      id="exampleModal-df"
      tabIndex="-1"
      role="dialog"
      aria-labelledby="exampleModalLabel-df"
      aria-hidden="true"
    >
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="exampleModalLabel-df">
              Set Delivery Preferences
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
          <div className="modal-body">
            <form className="myForm" onSubmit={handleSubmitDF}>
              <div className="form-group">
                <label htmlFor="delivery_mode">Delivery Mode</label>
                <select
                  className="form-control"
                  id="delivery_mode"
                  value={submitDF.delivery_mode}
                  onChange={handleChangeDF}
                  required
                >
                  <option value="">Select Delivery Mode</option>
                  {del_mo.map((mode, i) => (
                    <option key={i} value={mode}>{mode}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Delivery Days:</label>
                {renderCheckboxPairs()}
              </div>

              <div className="form-group">
                <label htmlFor="additional_instruction">Additional Instruction:</label>
                <input
                  className="form-control"
                  type="text"
                  id="additional_instruction"
                  value={submitDF.additional_instruction}
                  onChange={handleChangeDF}
                  autoComplete="off"
                />
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn btn-success" disabled={loading}>
                  {loading ? "Saving..." : "Submit"}
                </button>
                <button type="button" className="btn btn-light" data-bs-dismiss="modal">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  ) : null;
};

export default DeliveryPreferencesModal;
