import React, { useContext, useState, useEffect } from "react";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";
import Swal from "sweetalert2";
import { CommunicationContext } from "../CommunicationContext";
import CampaignDetailsForm from "../utility/CampaignDetailsForm";
import MessageBox from "../MessageBox";
import CheckboxGroup from "../utility/CheckboxGroup";
import TrialUsersFilter from "../utility/TrialUsersFilter";
import AbandonedCartFilter from "../utility/AbandonedCartFilter";
import apiClient from "../../../services/apiClient";

const NewCampaignForm = ({ getData }) => {
  const { title, selectedValue, isExpand, handleToggleExpand, setSummary, handleDiscard, filter, setFilter, hub, setHub } = useContext(CommunicationContext);
  const [loading, setLoading] = useState(false);

  const toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });

  const handleLaunch = async () => {
    if (title.trim() === "") {
      toast.fire({ icon: "error", title: "Missing Title", text: "Please enter a title before proceeding." });
      return;
    }
    if (selectedValue.length === 0) {
      toast.fire({ icon: "error", title: "No Platform Selected", text: "Select at least one platform to continue." });
      return;
    }

    setLoading(true);
    try {
      await getData();
      setSummary(true);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.fire({ icon: "error", title: "Data Fetch Error", text: "Something went wrong while retrieving data." });
    } finally {
      setLoading(false);
    }
  };

  const customerPropertyNames = ["status", "platform", "subscription_type", "source"];
  const customerPropertyOptionsMap = {
    platform: [
      { value: "website", name: "Web", label: "Web" },
      { value: "ios", name: "ios", label: "iOS" },
      { value: "android", name: "android", label: "Android" }
    ],
    status: [
      { value: "subscribers", name: "subscribers", label: "Subscribers" },
      { value: "active subscribers", name: "active subscribers", label: "Active Subscribers" },
      { value: "paused customers", name: "paused customers", label: "Paused Customers" },
    ],
    subscription_type: [
      { value: "Custom", label: "Custom", name: "Custom" },
      { value: "Everyday", label: "Everyday", name: "Everyday" },
      { value: "On-Interval", label: "On-Interval", name: "On-Interval" },
      { label: "One Time", value: "One Time", name: "One Time" },
    ],
    source: [
      { value: "Facebook", name: "Facebook", label: "Facebook" },
      { value: "Instagram", name: "Instagram", label: "Instagram" },
      { value: "Google", name: "Google", label: "Google" },
      { value: "Twitter", name: "Twitter", label: "Twitter" },
    ],
  };

  const getHubData = async () => {
    try {
      const response = await apiClient.post("/api/hubs_data/query", { filters: [] });
      return response.data?.data || [];
    } catch (e) {
      console.error("fetch hub data error: ", e);
      return [];
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const hubData = await getHubData();
      if (hubData && hubData.length > 0) {
        const hubarray = hubData.map(item => ({
          label: item.hub_name,
          value: item.hub_name,
          name: item.hub_name
        }));
        setHub(hubarray);
      }
    };
    fetchData();
  }, [setHub]);

  return (
    <div className="col-lg-12 grid-margin data-label">
      <div className="card shadow-lg mb-4 bg-light">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3 className="text-primary fw-bold">New Campaign</h3>
            <div className="d-flex">
              <button type="button" className="btn btn-success btn-sm me-2" onClick={handleLaunch} disabled={loading}>
                {loading ? <><span className="spinner-border spinner-border-sm me-2" role="status" />Fetching Customers...</> : "Launch"}
              </button>
              <button type="button" className="btn btn-danger btn-sm" onClick={handleDiscard}>Discard</button>
            </div>
          </div>
          <div className="card shadow-sm mb-4 overflow-hidden">
            <CardHeader toggleExpand={handleToggleExpand} name="Campaign" value={isExpand.Campaign} label="Campaign Details" />
            {isExpand.Campaign && <CampaignDetailsForm />}
          </div>
          <div className="card shadow-sm mb-4 overflow-hidden">
            <CardHeader toggleExpand={handleToggleExpand} name="Filter" value={isExpand.Filter} label="Select Filter" />
            {isExpand.Filter && (
              <div className="card-body">
                <div className="p-2 mt-2 d-grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
                  <TrialUsersFilter />
                  <AbandonedCartFilter />
                  {customerPropertyNames.map((item, index) => (
                    <div key={index} style={{ gridColumn: (customerPropertyOptionsMap[item] || []).length > 5 ? "span 2" : "span 1" }}>
                      <CustomFilter property={item} options={customerPropertyOptionsMap[item] || []} setFilter={setFilter} />
                    </div>
                  ))}
                  {hub && hub.length > 0 && (
                    <div key={-1} style={{ gridColumn: hub.length < 5 ? "span 2" : "span 1" }}>
                      <CustomFilter property="hub" options={hub} setFilter={setFilter} />
                    </div>
                  )}
                </div>
                <div className="alert alert-warning d-flex align-items-start p-3 mt-3" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-3 mt-1 fs-5 text-warning"></i>
                  <div>
                    <p className="fw-bold text-primary mb-1">Note:</p>
                    <p className="mb-1">Selecting too many filters at once may cause errors. Choose only necessary filters.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="card shadow-sm mb-4 overflow-hidden">
            <CardHeader toggleExpand={handleToggleExpand} name="Message" value={isExpand.Message} label="Compose Message" />
            {isExpand.Message && <MessageBox />}
          </div>
        </div>
      </div>
    </div>
  );
};

const CustomFilter = ({ property, options, setFilter }) => {
  const [selected, setSelected] = useState([]);
  useEffect(() => {
    setFilter((prev) => ({ ...prev, [property]: selected }));
  }, [selected, property, setFilter]);

  return (
    <div className="card p-3 bg-light shadow-sm" style={{ display: "flex", flexDirection: "column", gap: "15px", minWidth: "250px" }}>
      <CheckboxGroup
        property={property}
        options={options}
        selectedValues={selected}
        onChange={setSelected}
        aling={options && options.length <= 0 ? "column" : "row"}
      />
    </div>
  );
};

const CardHeader = ({ toggleExpand, name, value, label }) => (
  <div className="card-header bg-primary border-bottom d-flex justify-content-between align-items-center px-3" onClick={() => toggleExpand(name)} style={{ cursor: "pointer" }}>
    <h4 className="m-0 py-2 text-light fw-bold">{label}</h4>
    {value ? <FaChevronDown className="text-light" /> : <FaChevronRight className="text-light" />}
  </div>
);

export default NewCampaignForm;
