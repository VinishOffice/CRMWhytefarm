import React, { useState,useEffect } from 'react';
import { Spinner } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { sendCustomerEmail } from "../../services/emailService";
const ComposeEmailForm = ({ setActivePopup,customer_email }) => {

  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleAttachmentChange = (e) => {
    setAttachments([...e.target.files]);
  };

  
  const handleSubmit = () => {
    setLoading(true);
    let subject = document.getElementById('email_subject').value;
    let message = document.getElementById('message').value;
    sendCustomerEmail({
      subject,
      message,
      recipient: `${customer_email}`,
    }).then((response) => {
      Swal.fire({
        icon: 'success',
        title: 'Email sent successfully',
        showConfirmButton: false,
        timer: 1500
      });
      setLoading(false);
      setActivePopup("");
    }).catch((error) => {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Something went wrong!',
      });
      setLoading(false);
    });
  };

  return (
    <>
   
      <div className='compose_email_form'>
        <label htmlFor="" className='email_labels'>Subject</label>
        <input id="email_subject" className='email_inputs' />
        <label htmlFor="" className='email_labels'>Message</label>
        <textarea id="message" className='email_text' rows={5}></textarea>
        <button
          className='send_email_btn'
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? <>Sending... <Spinner style={{
            width: '1rem',
            height: '1rem'
          }}/></> : <>Send</>}
        </button>
      </div>
    </>
  );
};

export default ComposeEmailForm;