import { useState, useEffect } from "react";
import moment from "moment";
import { fetchCommunicationHistory } from "./utility/queries";
import WhatsappPreview from "./preview/WhatsappPreview";
import SmsPreview from "./preview/SmsPreview";
import EmailPreview from "./preview/EmailPreview";

const HistoryTable = () => {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const data = await fetchCommunicationHistory();
        setHistoryData(data);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const renderTags = (items) => {
    if (!items?.length) return <td className="text-center">-</td>;

    const colors = ["bg-primary text-white", "bg-success text-white"];

    return (
      <td className="text-center">
        <div className="d-flex flex-wrap justify-content-center gap-1">
          {items.map((item, index) => (
            <span 
              key={index} 
              className={`badge ${colors[index % colors.length]} px-2 py-1`}
              style={{ minWidth: "100px" }}
            >
              {item}
            </span>
          ))}
        </div>
      </td>
    );
  };

  return (
    <div className="table-responsive">
      {loading ? (
        <p className="text-center my-3 text-muted">Loading history...</p>
      ) : historyData.length === 0 ? (
        <p className="text-center my-3 text-muted">No history data found.</p>
      ) : (
        <table className="table table-striped table-hover table-bordered">
          <thead className="bg-light text-center">
            <tr>
              {["Title", "Date", "Time", "Details", "SMS Template", "WhatsApp Template", "Abandoned Cart", "Trial User", "Medium", "Status", "Platform", "Subscription", "Source", "User"].map((col, i) => (
                <th key={i} className="p-2">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {historyData.map((data, index) => (
              <tr key={index} className="align-middle text-center">
                <td className="fw-bold p-2">{data.title}</td>
                <td className="p-2">{moment(new Date(data.created_date.seconds * 1000)).format("DD-MM-YYYY")}</td>
                <td className="p-2">{moment(new Date(data.created_date.seconds * 1000)).format("HH:mm:ss a")}</td>
                <td className="p-2">{renderTags([
                  `Found: ${data.stats?.total}`,
                  data.medium.includes('SMS') ? `SMS: ${data.stats?.sms?.sent}` : null,
                  data.medium.includes('WhatsApp') ? `WhatsApp: ${data.stats?.whatsapp?.sent}` : null,
                  data.medium.includes('Email') ? `Email: ${data.stats?.email?.sent}` : null,
                ].filter(e => e !== null))}</td>
                <td className="p-2 text-start">{data.sms_template || "-"}</td>
                <td className="p-2 text-start">{data.whatsapp_template || "-"}</td>
                <td className="p-2">{data.AbandonedCart || "-"}</td>
                <td className="p-2">{data.TrialUser || "-"}</td>
                <td className="p-2">{renderTags(data.medium)}</td>
                <td className="p-2">{renderTags(data.status)}</td>
                <td className="p-2">{renderTags(data.platform)}</td>
                <td className="p-2">{renderTags(data.subscription_type)}</td>
                <td className="p-2">{renderTags(data.source)}</td>
                <td className="p-2 fw-bold">{`${data.created_by.name} (${data.created_by.role})`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default HistoryTable;
