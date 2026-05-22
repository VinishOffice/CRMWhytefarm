import React, { createContext, useState, useEffect } from "react";
import { Communicator } from "./template/htmlToMarkdown";

export const CommunicationContext = createContext();

export const CommunicationProvider = ({ children }) => {
const [date] = useState(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
    });
  const [filter, setFilter] = useState({});
  
    const [hub, setHub] = useState([]);
  const [smsData, setSmsData] = useState({
    from: "WHYTE.farms",
    message: "Dear customer, please note that our farm is closed today.",
  });

  const [whatsappData, setWhatsappData] = useState({
    from: "WHYTE.farms",
    message: "Dear customer, we have a new product available.",
  });

  const [mail, setMail] = useState({
    from: "Whytefarms@marthmideagroup.com",
    to: "trmp45643@gmail.com",
    subject: "Great Offer for you",
    body: "Dear customer, we have a great offer for you.",
  });
  const [msgData, setMsgData] = useState({ sms: { message: "" }, whatsapp: { message: "" }, email: { body: "" } });
  const [historyData, setHistoryData] = useState([]);
  const [isExpand, setIsExpand] = useState({
    Details: true,
    Filter: true,
    Message: true,
    Summary: true,
    Campaign: true,
  });
  const [newCampaign, setNewCampaign] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] =useState("")
  const [selectedValue, setSelectedValue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(false);
  const [data, setData] = useState([]);
  const [whatsappLog, setWhatsappLog] = useState([]);
  const [smsLog, setSmsLog] = useState([]);
  const toggleExpand = (section) => {
    setIsExpand((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const applyFilter = async () => {
    // Implement filter logic
  };
  const [smsParamMap, setsmsParamMap] = useState({});
  
  const handleToggleExpand = (section) => {
    setIsExpand((prev) => ({
    ...prev,
    [section]: !prev[section],
    }));
};

const [whatsappTemplates, setWhatsappTemplate] = useState([]);
const [smsTemplates, setSmsTemplates] = useState([]);
const handleDiscard = () => {
  setNewCampaign(false);
  setSummary(false); // Hide summary when discarding
  setTitle("");
  setSelectedValue([]);
}
const [selectedDateTrailedUser, setSelectedDateTrailedUser] = useState(null);
const [selectedDateAbandonedCart, setSelectedDateAbandonedCart] = useState(null);



  return (
    <CommunicationContext.Provider
      value={{
        date,
        filter,
        setFilter,
        msgData,
        setMsgData,
        historyData,
        isExpand,
        toggleExpand,
        newCampaign,
        setNewCampaign,
        title,
        setTitle,
        message,
        setMessage,
        selectedValue,
        setSelectedValue,
        loading,
        setLoading,
        summary,
        setSummary,
        setIsExpand,
        applyFilter,
        handleToggleExpand,
        smsData, 
        setSmsData, 
        whatsappData, 
        setWhatsappData, 
        mail, 
        setMail,
        data,
        setData,
        whatsappLog,
        setWhatsappLog,
        smsLog,
        setSmsLog,
        handleDiscard,
        whatsappTemplates, setWhatsappTemplate,
        smsTemplates, setSmsTemplates,
        hub, setHub,
        smsParamMap, setsmsParamMap,
        selectedDateTrailedUser, setSelectedDateTrailedUser,
        selectedDateAbandonedCart, setSelectedDateAbandonedCart,
      }}
    >
      {children}
    </CommunicationContext.Provider>
  );
};
