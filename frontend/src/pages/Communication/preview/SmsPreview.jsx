import React, { useContext, useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { FaUserCircle } from "react-icons/fa";
import { BiCheckDouble } from "react-icons/bi";
import { Communicator } from "../template/htmlToMarkdown";
import { CommunicationContext } from "../CommunicationContext";

const SmsPreview = ({ smsData }) => {
  const { smsParamMap, setsmsParamMap } = useContext(CommunicationContext);
  const [message, setMessage] = useState("");
  const [timestamp] = useState(
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
  );

  // Function to parse and replace placeholders
  const parseTemplate = (template, values) => {
    return template.replace(/%%\|([\w]+)\^.*?%%/g, (match, key) => values[key] || match);
  };

  // Initialize message from smsData
  useEffect(() => {
    if (smsData?.message) {
      setMessage(smsData.message);
    }
  }, [smsData]);

  // Update message when smsParamMap changes
  useEffect(() => {
    if (smsData?.message) {
      setMessage(parseTemplate(smsData.message, smsParamMap));
    }
  }, [smsParamMap, smsData]);

  // Extract placeholders from message and initialize smsParamMap
  useEffect(() => {
    if (!smsData?.message) return;
    
    const regex = /%%\|([\w]+)\^.*?%%/g;
    let match;
    const newMap = { };

    while ((match = regex.exec(smsData.message)) !== null) {
      const paramKey = match[1];
      if (!(paramKey in newMap)) {
        newMap[paramKey] = ""; // Default empty value
      }
    }

    setsmsParamMap(newMap);
  }, [smsData]);

  // Handle changes in select dropdown
  const handleParamChange = (paramKey, value) => {
    setsmsParamMap((prev) => ({ ...prev, [paramKey]: value }));
  };

  return (
    <Container style={{ maxWidth: "300px", minWidth: "250px", width: "30%", margin: "0 auto" }}>
      <Row className="justify-content-center">
        <Col md={12}>
          <div className="bg-white rounded shadow-sm border overflow-hidden">
            <div className="p-2 border-bottom d-flex align-items-center" style={{ backgroundColor: "#f1f1f1" }}>
              <div className="me-2 d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px", borderRadius: "50%", fontSize: "40px" }}>
                <FaUserCircle />
              </div>
              <p className="font-weight-bold mb-0" style={{ fontSize: "1.1em", color: "#007bff" }}>{smsData.from}</p>
            </div>
            <div className="bg-white p-3 scroll-hidden" style={{ height: "300px", overflowY: "auto", scrollbarWidth: "none", MsOverflowStyle: "none" }}>
              <p className="message-content" style={{ fontSize: "12px", minHeight: "40px", outline: "none" }}
                dangerouslySetInnerHTML={{ __html: Communicator.prepareHtmlContent(message) }}
              />
              <div className="timestamp text-muted text-end" style={{ fontSize: "8px" }}>
                {timestamp} <BiCheckDouble />
              </div>
              {Object.keys(smsParamMap).length > 0 && (
                <div className="d-flex flex-column gap-2 justify-content-center align-items-center mt-2">
                  {Object.entries(smsParamMap).map(([key, value]) => (
                    <div key={key} style={{ fontSize: "12px" }}>
                      {key}:
                      <select className="form-select form-select-sm ms-2" value={value} onChange={(e) => handleParamChange(key, e.target.value)}>
                        <option value="">Select value</option>
                        {["customer_name", "customer_phone", "customer_email", "customer_address", "wallet_balance"].map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Col>
      </Row>
      <style jsx>{`
        .message-content {
          background-color: #f0f8ff;
          padding: 5px;
          border-radius: 5px;
          transition: background-color 0.3s ease;
        }
        .message-content:focus {
          background-color: #e0f7fa;
        }
        .timestamp {
          margin-top: 2px;
        }
      `}</style>
    </Container>
  );
};

export default SmsPreview;
