import { useState, useContext, useEffect } from "react";
import { CommunicationContext } from "./CommunicationContext";
import { Communicator } from "./template/htmlToMarkdown";
import SmsPreview from "./preview/SmsPreview";
import WhatsappPreview from "./preview/WhatsappPreview";
import EmailPreview from "./preview/EmailPreview";
import WhatsappModal from "./Models/WhatsappModal";
import SmsModal from "./Models/SmsModal";
import EmailModal from "./Models/EmailModal";

const MessageBox = () => {
  const { smsData, setSmsData, whatsappData, setWhatsappData, mail, setMail, msgData, setMsgData, selectedValue } = useContext(CommunicationContext);

  

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [type, setType] = useState(null);

  useEffect(() => {
    setMsgData({
      sms: smsData,
      whatsapp: whatsappData,
      email: mail,
    });
  }, [smsData, whatsappData, mail]);


  const handleEdit = (messageType) => {
    setIsModalOpen(true);
    setType(messageType);
  };

  return (
    <div className="container py-3">
      <div className="row g-3">
        {selectedValue.length === 0 && (
          <p className="text-center text-muted fst-italic mt-3 p-3 border border-secondary rounded bg-light">
            Go to the Campaign Details and select a platform.
          </p>
        )}

        {selectedValue.includes("SMS") && (
          <MessageBoxCard
            title="SMS"
            bgClass="bg-primary"
            previewComponent={<SmsPreview smsData={smsData} />}
            onEdit={() => handleEdit("Sms")}
          />
        )}

        {selectedValue.includes("WhatsApp") && (
          <MessageBoxCard
            title="WhatsApp"
            bgClass="bg-success"
            previewComponent={<WhatsappPreview whatsappData={whatsappData} />}
            onEdit={() => handleEdit("WhatsApp")}
          />
        )}

        {selectedValue.includes("Email") && (
          <MessageBoxCard
            title="Email"
            bgClass="bg-info"
            previewComponent={<EmailPreview mail={mail} setMail={setMail} />}
            onEdit={() => handleEdit("Email")}
          />
        )}
      </div>

      {isModalOpen && type === "Sms" && (
        <SmsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialMessage={smsData.message}
        />
      )}

      {isModalOpen && type === "WhatsApp" && (
        <WhatsappModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialMessage={whatsappData.message}
        />
      )}

      {isModalOpen && type === "Email" && (
        <EmailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialEmail={mail}
          onSave={(newEmail) => {
            setMail(newEmail);
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

const MessageBoxCard = ({ title, bgClass, previewComponent, onEdit }) => {
  return (
    <div className="col-md-4">
      <div className="card h-100 shadow-sm">
        <div className={`card-header ${bgClass} text-white text-center`}>{title} Preview</div>
        <div className="card-body">{previewComponent}</div>
        <div className="card-footer bg-light text-center">
          <button className="btn btn-outline-primary btn-sm" type="button" onClick={onEdit}>
            <i className="fa fa-edit me-2"></i> Edit {title}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageBox;
