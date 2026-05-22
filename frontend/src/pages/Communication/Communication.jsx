import React, { useContext, useEffect } from "react";
import TopPanel from "../../TopPanel";
import Sidebar from "../../Sidebar";
import Footer from "../../Footer";
import HistoryTable from "./HistoryTable";
import { CommunicationContext } from "./CommunicationContext";
import { useCommunication } from "../../hooks/useCommunication";
import CampaignSummary from "./components/CampaignSummary";
import NewCampaignForm from "./components/NewCampaignForm";
import { getMessageTamplats, getTextlocalMessageTamplats } from "./WATI API FUNCTIONS/wati";

const Communication_Home = () => {
  const { 
    newCampaign, setWhatsappTemplate, setSmsTemplates, 
    whatsappTemplates, setWhatsappData, smsTemplates, setSmsData 
  } = useContext(CommunicationContext);
  
  const comm = useCommunication();

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const watiTemplates = await getMessageTamplats();
        setWhatsappTemplate(watiTemplates);
        const textlocalTemplates = await getTextlocalMessageTamplats();
        setSmsTemplates(textlocalTemplates?.data?.templates || []);
      } catch (err) {
        console.error("Error fetching templates:", err);
      }
    };
    fetchTemplates();
  }, [setWhatsappTemplate, setSmsTemplates]);

  useEffect(() => {
    if (whatsappTemplates && whatsappTemplates.length > 0) {
      setWhatsappData(prev => ({
        ...prev, 
        message: whatsappTemplates[0]?.body, 
        title: whatsappTemplates[0]?.elementName, 
        template: whatsappTemplates[0]
      }));
    }
  }, [whatsappTemplates, setWhatsappData]);

  useEffect(() => {
    if (smsTemplates && smsTemplates.length > 0) {
      setSmsData(prev => ({
        ...prev, 
        message: smsTemplates[0]?.body, 
        title: smsTemplates[0].title, 
        template: smsTemplates[0]
      }));
    } else {
      setSmsData(prev => ({ ...prev, message: "", title: "" }));
    }
  }, [smsTemplates, setSmsData]);

  return (
    <div className="container-scroller bg-light">
      <TopPanel />
      <div className="container-fluid page-body-wrapper">
        <Sidebar />
        <div className="main-panel container-scroller">
          <div className="content-wrapper">
            {/* Header section */}
            <div className="col-lg-12 grid-margin">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center pb-3 border-bottom">
                    <h3 className="card-title fs-4 text-dark mb-0">📢 Communication Management</h3>
                    <button
                      type="button"
                      className="btn btn-primary btn-lg fw-bold rounded-3"
                      onClick={comm.handleNewCampaign}
                    >
                      + New Campaign
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Content sections */}
            {newCampaign && <NewCampaignForm getData={comm.getData} />}
            
            <div className="card shadow-sm border-0 mt-4">
              <div className="card-body">
                <h4 className="text-primary fs-5 mb-3 fw-bold">📜 Campaign History</h4>
                <HistoryTable />
              </div>
            </div>

            <CampaignSummary 
              {...comm}
              setReload={() => {}} // Placeholder if needed by HistoryTable refresh logic
            />
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Communication_Home;
