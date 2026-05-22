import React, { useState,useEffect,useCallback } from 'react';
import { ComposeEmailForm } from '../../forms';
import { listEmailsForCustomer } from "../../services/emailService";
import { Spinner } from 'react-bootstrap';
import debounce from 'lodash.debounce';

const emailLogsStyles = `
  .button-group {
    display: flex;
    gap: 20px;
  }
  .compose_email_form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .email_inputs {
    height: 40px;
    width: 100%;
    border: 1px solid #ced4da;
  }
  .email_inputs:focus {
    outline: none;
    border: 1px solid #007bff;
  }
  .email_text {
    border: 1px solid #ced4da;
  }
  .email_text:focus {
    outline: none;
    border: 1px solid #007bff;
  }
  .email_labels {
    font-size: 18px;
  }
  .send_email_btn {
    width: 200px;
    height: 40px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }
  .email_card {
    border: 1px solid #ced4da;
    margin: 5px 0px;
    border-radius: 5px;
    background-color: #fff;
  }
  .email_card_inner_container {
    display: flex;
    gap: 10px;
    padding: 10px;
  }
  .e_heading {
    font-size: 16px;
    font-weight: bold;
  }
  .email_card_inner_container > p {
    font-size: 12px;
  }
  .email_btn {
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    margin: 5px 10px;
    height: 40px;
    width: 150px;
  }
  .email_chip {
    background-color: red;
    padding: 5px 10px;
    border-radius: 5px;
    color: #fff;
    height: 30px;
  }
`;

const EmailLogs = ({customer_data}) => {
  const [activePopup, setActivePopup] = useState("");
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customer_email, setCustomerEmail] = useState(customer_data?.data?.customer_email);
  const togglePopup = (value) => {
    setActivePopup(value);
  }


  const fetch_all_emails = useCallback(debounce(() => {
    setLoading(true);
    if (!customer_email || customer_email === '') {
      setLoading(false);
      return;
    }
    listEmailsForCustomer(customer_email)
      .then((resp) => {
        // backend returns: { data: <upstream> }, upstream: { messages: [...] }
        setEmails(resp?.data?.messages || resp?.messages || []);
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
      });
  }, 300), []); 

  useEffect(() => {
    fetch_all_emails();
    return () => {
      fetch_all_emails.cancel(); 
    };
  }, [fetch_all_emails]);

  return (
    <div className=''>
      <style>{emailLogsStyles}</style>
      <div className='button-group'>
        <button className='c_btn' onClick={() => { togglePopup("email_form") }}>Compose</button>
        <button className='c_btn' onClick={()=>{togglePopup(`${Math.random()}`)}}>Refresh</button>
      </div>


    {activePopup === "email_form" ?<>
      <div className="popup">
        <div className="popup-inner">
          <div className='close_btn_position'>
            <button className="close_btn" onClick={() => togglePopup("")}>
              X
            </button>
          </div>
          <ComposeEmailForm  setActivePopup={setActivePopup} customer_email={customer_email}/>
        </div>
      </div>
    
    </>:<></>}
    {customer_email ? <>
      {loading ? 
      <>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '50vh'
      }}>
        <Spinner animation="border" variant="primary" />
      </div>
      </>:<>
      <div className='email_logs'>
        {emails.map((email) => (
          <EmailCard key={email.id} data={email} />
        ))}
      </div>

      </>}

    </>:<><p className='my-1'>Customer does not have email yet</p></>}

      
    </div>
  );
};

export default EmailLogs;


const EmailCard = ({ data }) => {
  const [modalIsOpen, setModalIsOpen] = useState(false);

  const date = new Date(data.date);
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });


  return (
    <div className='email_card'>
      <div className='email_card_inner_container'>
        <p><span className='e_heading'>Subject:</span> {data.subject}  </p>
        <p><span className='e_heading'>Sender:</span> {data.sender}</p>
        <p><span className='e_heading'>Recipient:</span> {data.recipient}</p>
        <p><span className='e_heading'>Date:</span> {formattedDate} , {formattedTime}</p>
      </div>
      <p style={{ padding: '0px 10px' }}>Snippet: {data.snippet}</p>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'right',
          height: '50px'
        }}>
          <div style={{
            
          }}>
            {data.label_ids.map((label, idx) => (
              <span key={idx} className='badge bg-dark mx-1'>{label.name}</span>
            ))}

          </div>
        <button onClick={()=>{setModalIsOpen(true)}} className='email_btn'>View Details</button>
          </div>
      {modalIsOpen ? <>      
        <div className="popup">
          <div className="popup-inner">
            <div className='close_btn_position'>
              <button className="close_btn" onClick={() => setModalIsOpen(false)}>
                X
              </button>
            </div>
            <h4>Email View</h4>
        
        <div dangerouslySetInnerHTML={{ __html: data.html }} />

        <>
        <span>Attachments:</span>
        {data.media && data.media.map((attachment, idx) => (
          <div key={idx}>
            <h3>{attachment.filename}</h3>
            {renderAttachment(attachment)}
            </div>
        ))}
        </>

          </div>
        </div>
      </>:<></>}
    </div>
  );
};



const renderAttachment = (attachment) => {
  const { filename, filetype, data } = attachment;
  const base64Data = `data:${filetype};base64,${data}`;

  if (filetype.startsWith('image/')) {
    return <img src={base64Data} alt={filename} />;
  } else if (filetype.startsWith('text/')) {
    return <pre>{atob(data)}</pre>;
  } else if (filetype === 'application/pdf') {
    return <embed src={base64Data} type="application/pdf" width="600" height="400" />;
  } else {
    return <a href={base64Data} download={filename}>Download {filename}</a>;
  }
};