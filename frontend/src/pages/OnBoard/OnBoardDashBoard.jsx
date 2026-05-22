import React, { useState } from 'react';
import moment from 'moment';
import LeadStageComponent from './OnBoardComponents/LeadStageComponent';

export default function OnBoardDashBoard() {
  const [sub, setSub] = useState([]);

  const handleRowClick = (customer_id) => {
    window.open(`/profile/${customer_id}`, "_blank");
  };

  return (
    <>
      <div>OnBoardDashBoard</div>
      <LeadStageComponent />
    </>
  );
}
