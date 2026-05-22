import React from "react";
import { FaInfoCircle } from "react-icons/fa";
import { DateInputEnd } from "./Delivery";
import CreateDispatch from "./Dispatchs/farmDispatch";
import CreateHubsDispatch from "./Dispatchs/hubDispatch";
import { useDispatch } from "../../hooks/useDispatch";
import StockCard from "../../components/inventory/StockCard";
import UserGuideModal from "../../components/inventory/UserGuideModal";
import FarmDispatchTable from "../../components/inventory/FarmDispatchTable";
import HubDispatchTable from "../../components/inventory/HubDispatchTable";
import "../../styles/Dispatch.css"; // Assuming there's some CSS, or I'll keep it inline if needed

const Dispatch = () => {
  const ds = useDispatch();

  return (
    <>
      <UserGuideModal showGuide={ds.showGuide} setShowGuide={ds.setShowGuide} />

      {/* Header Section */}
      <div className="card p-1 mb-4">
        <div className="container my-2">
          <div className="d-flex justify-content-between align-items-center mt-1">
            <div className="d-flex flex-column gap-2">
              <h3 className="">Dispatch Management</h3>
              <div className="d-flex align-items-center gap-3">
                <p className="text-black fs-6 mb-0">Date:</p>
                <DateInputEnd
                  date={ds.date}
                  setDate={ds.setDate}
                  style={{ width: "140px", backgroundColor: "#F8F9FA", borderRadius: "0.375rem" }}
                />
              </div>
            </div>

            <div className="d-flex flex-column align-items-end gap-2">
              <div className="d-flex flex-row align-items-center gap-2">
                <button className="btn btn-success btn-rounded btn-sm" onClick={ds.exportToCSV}>
                  Export to CSV
                </button>
                <button
                  className="btn btn-sm d-flex justify-content-start align-items-end"
                  onClick={() => ds.setShowGuide(true)}
                  style={{ padding: "0px", borderRadius: "50%" }}
                  title="User Guide"
                >
                  <FaInfoCircle size={20} className="text-black" />
                </button>
              </div>

              {ds.permissible_roles.includes('create_new_dispatch') ? (
                <button className="btn btn-primary btn-rounded btn-sm" onClick={() => ds.setCreate(true)}>
                  {ds.dispatchesView === "farms" ? "Create New Farm Dispatch" : "Create New Hub Dispatch"}
                </button>
              ) : (
                <button className="btn btn-primary btn-rounded btn-sm" onClick={() => ds.rolePermission()}>
                  {ds.dispatchesView === "farms" ? "Create New Farm Dispatch" : "Create New Hub Dispatch"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Dispatch Form / Modal */}
      {ds.create && (
        ds.dispatchesView === "farms" ? (
          <CreateDispatch
            setDispatches={ds.setDispatches}
            closeCreate={() => ds.setCreate(false)}
          />
        ) : (
          <CreateHubsDispatch
            setDispatches={ds.setHubDispatches}
            closeCreate={() => ds.setCreate(false)}
            setFarmsDispatches={ds.setDispatches}
            farmsDispatches={ds.dispatches}
            productSummary={ds.farmDispatchData}
          />
        )
      )}

      {/* Main Content Area */}
      <div className="dispatch-container">
        <div className="dispatch-tab-row">
          <button
            onClick={() => ds.setDispatchesView("farms")}
            className={`dispatch-tab-button dispatch-farms ${ds.dispatchesView === 'farms' ? 'dispatch-active' : ''}`}
          >
            Farm Dispatch
          </button>
          <button
            onClick={() => ds.setDispatchesView("hub")}
            className={`dispatch-tab-button dispatch-hub ${ds.dispatchesView === 'hub' ? 'dispatch-active' : ''}`}
          >
            Hub Dispatch
          </button>
        </div>

        <div className="dispatch-content-card">
          {ds.dispatchesView === "farms" ? (
            <FarmDispatchTable {...ds} />
          ) : (
            <div className="container my-4">
              <div className="mb-4">
                <h5 className="fw-bold text-primary mb-3">Dispatch Available Quantity</h5>
                <div className="d-flex justify-content-start gap-3 flex-wrap">
                  {ds.farmDispatchData.length > 0 ? (
                    ds.farmDispatchData.map((item, index) => (
                      <StockCard
                        key={index}
                        title={item.productName}
                        value={item.quantity}
                        selected={false}
                        onClick={() => {}}
                      />
                    ))
                  ) : (
                    <StockCard title="No available quantities." value="" selected={false} onClick={() => {}} />
                  )}
                </div>
              </div>
              <HubDispatchTable {...ds} />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Dispatch;
