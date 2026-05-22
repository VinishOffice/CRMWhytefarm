import React from 'react';

const logCardStyles = `
  .c_card {
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin-top: 10px;
  }
  .c_card_body {
    display: flex;
    padding: 20px;
    gap: 5px;
    justify-content: space-between;
    background-color: white;
    flex-wrap: wrap;
  }
  .card_hearder {
    font-weight: bold;
    font-size: 12px;
  }
  .card_value {
    font-size: 12px;
  }
  .flex_card_body {
    max-width: 200px;
  }
  .c_notes {
    border: 1px solid #d3d3d3;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin-top: 10px;
    background-color: #d3d3d3;
    padding: 5px;
    margin: 0px 10px;
  }
  .product_chip {
    background-color: #84bf93;
    padding: 5px 10px;
    border-radius: 5px;
    color: #fff;
  }
  .feedback_chip {
    background-color: #f1f1f1;
    padding: 5px 10px;
    border-radius: 5px;
    border: 1px solid #000;
  }
`;

const ConversastionLogCard = ({ data }) => {
  const {
    updated_at,
    customer_email,
    customer_phone,
    followup_required,
    selected_products,
    call_type,
    customer_id,
    created_at,
    res_type,
    tags,
    created_by,
    sub_disposition,
    conversation_notes,
    follow_up_date,
    interaction_type,
    disposition,
    email_subject,
    task_id,
    whatsApp,
    sub_sub_disposition,
  } = data;

 const formatDate = (timestamp) => {
  if (!timestamp) return "";

  const date = new Date(
    timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000
  );

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
};


  return (
    <div className="c_card">
      <style>{logCardStyles}</style>
      <div className="c_card_body">
        <div className='flex_card_body'>
          <p className='card_hearder'>Interaction Type</p>
          <p className='card_value'>{interaction_type}</p>
        </div>

        {interaction_type === 'call' && (
          <div className='flex_card_body'>
            <p className='card_hearder'>Call Type</p>
            <p className='card_value'>{call_type}</p>
          </div>
        )}


        {interaction_type === 'email' && (
          <div className='flex_card_body'>
            <p className='card_hearder'>Email</p>
            <p className='card_value'>{email_subject}</p>
          </div>
        )}
        <div className='flex_card_body'>
          <p className='card_hearder'>Disposition</p>
          <p className='card_value'>{disposition}</p>
        </div>
        <div className='flex_card_body'>
          <p className='card_hearder'>Sub Disposition</p>
          <p className='card_value'>{sub_disposition}</p>
        </div>

        <div className='flex_card_body'>
          <p className='card_hearder'>Sub-Sub Disposition</p>
          <p className='card_value'>{sub_sub_disposition || '-'}</p>
        </div>


        <div className='flex_card_body'>
          <p className='card_hearder'>Created by</p>
          <p className='card_value'>{created_by}</p>
        </div>

        <div className='flex_card_body'>
          <p className='card_hearder'>Follow up required</p>
          <p className='card_value'>{followup_required ? 'Yes' : 'No'}  {followup_required && <p><strong>Follow-up Date:</strong> {follow_up_date}</p>}</p>
          <span style={{
            fontSize: '12px'
          }}>TASK ID: {task_id ? <>{task_id}</> : <></>}</span>
        </div>

        <div className='flex_card_body'>
          <p className='card_hearder'>Created AT</p>
          <p className='card_value'>{formatDate(created_at)}</p>
        </div>

      </div>
      <p className='p-2 c_notes'><strong>Conversation Notes:</strong> {conversation_notes}</p>
      <div className='p-2' style={{
        backgroundColor: '#fff'
      }}>
        <p><strong>Products:</strong> {selected_products.map((item, index) => (
          <span key={index} className='product_chip mx-2'>{item} </span>
        ))}</p>
        <p style={{
          marginTop: '15px'
        }}><strong>Tags:</strong> {tags.map((item, index) => (
          <span key={index} className='feedback_chip mx-2'>{item} </span>
        ))}</p>
      </div>
    </div>
  );
};

export default ConversastionLogCard;