import React, { useContext, useEffect, useState } from "react";
import { BiCheckDouble } from "react-icons/bi";
import { FaUserCircle } from "react-icons/fa";
import { CommunicationContext } from "../CommunicationContext";

const WhatsappPreview = ({ whatsappData }) => {
  const { msgData, setMsgData } = useContext(CommunicationContext);
  const [timestamp] = useState(
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
  );
  const [message, setMessage] = useState(whatsappData?.message || "");
  const [pram_map, setPramMap] = useState({});
  const [data, setData] = useState("");

  /*** Update message when pram_map changes ***/
  useEffect(() => {
    if (Object.keys(pram_map).length === 0) return;

    let updatedMessage = whatsappData?.message || "";
    Object.keys(pram_map).forEach((key) => {
      updatedMessage = updatedMessage.replace(`{{${key}}}`, pram_map[key] || "");
    });

    setMessage(updatedMessage);

    setMsgData((prev) => {
      const newData = { ...prev, whatsapp: { ...prev.whatsapp, prameter: pram_map } };
      return JSON.stringify(prev.whatsapp?.prameter) === JSON.stringify(pram_map) ? prev : newData;
    });
  }, [pram_map]);

  /*** Extract placeholders from message when whatsappData changes ***/
  useEffect(() => {
    if (!whatsappData?.message) return;

    const regex = /{{(.*?)}}/g;
    let newMap = {};
    let match;
    while ((match = regex.exec(whatsappData.message)) !== null) {
      if (!(match[1] in newMap)) {
        newMap[match[1]] = "";
      }
    }

    if (JSON.stringify(newMap) !== JSON.stringify(pram_map)) {
      setPramMap(newMap);
    }
  }, [whatsappData]);

  /*** Handle parameter selection ***/
  const handleParamChange = (index, value) => {
    setPramMap((prev) => ({ ...prev, [index]: value }));
  };

  /*** Update data based on pram_map or msgData ***/
  useEffect(() => {
    setData(Object.keys(pram_map).length === 0 ? msgData.whatsapp.message : message);
  }, [msgData, message, pram_map]);

  return (
    <>
      <div className="" style={{ maxWidth: "300px", minWidth: "250px", width: "30%", margin: "0 auto" }}>
        <div
          className=""
          style={{ border: "1px solid #ddd", borderRadius: "10px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)" }}
        >
          <div className="whatsapp-header" style={{ backgroundColor: "#075e54", color: "white", padding: "10px 15px" }}>
            <div className="d-flex align-items-center">
              <div
                className="whatsapp-avatar me-2"
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundColor: "#128c7e",
                  fontSize: "40px",
                }}
              >
                <FaUserCircle style={{ verticalAlign: "middle" }} />
              </div>
              <div className="whatsapp-contact">{whatsappData.from}</div>
            </div>
          </div>
          <div
            className="p-3 scroll-hidden"
            style={{ height: "300px", overflowY: "auto", scrollbarWidth: "none", MsOverflowStyle: "none", backgroundColor: "#e5ddd5" }}
          >
            <div
              className="whatsapp-message"
              style={{
                backgroundColor: "white",
                borderRadius: "7px",
                padding: "8px px",
                maxWidth: "80%",
                marginLeft: "auto",
                marginBottom: "4px",
                boxShadow: "0 1px 0.5px rgba(0, 0, 0, 0.13)",
              }}
            >
              <div className="message-content">
                {whatsappData.attachment && (
                  <div className="mt-1 pt-1 d-flex justify-content-center">
                    <img
                      src={whatsappData.attachment || "/placeholder.svg"}
                      alt="Attachment"
                      className="img-fluid rounded border shadow-sm"
                      style={{ maxHeight: "150px", objectFit: "contain" }}
                    />
                  </div>
                )}

                <div
                  id="whatsappbox"
                  className="p-0 m-1"
                  style={{ fontSize: "12px", minHeight: "40px", outline: "none" }}
                  dangerouslySetInnerHTML={{ __html: data }}
                />

                <p className="timestamp text-muted p-0 m-0" style={{ fontSize: "8px", textAlign: "right" }}>
                  {timestamp}
                  <span className="delivery-status">
                    <span className="delivery-icon">
                      <BiCheckDouble />
                    </span>
                  </span>
                </p>
              </div>
            </div>

            {Object.keys(pram_map).length > 0 && (
              <div className="d-flex flex-column gap-2 justify-content-center align-items-center mt-2">
                {Object.entries(pram_map).map(([key, value], index) => (
                  <div key={index} className="me-2" style={{ fontSize: "12px" }}>
                    {key}:
                    <select className="form-select form-select-sm ms-2" onChange={(e) => handleParamChange(key, e.target.value)}>
                      <option value="">{value}</option>
                      {["customer_name", "customer_phone", "customer_email", "customer_address", "wallet_balance"].map((option, i) => (
                        <option key={i} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default WhatsappPreview;
