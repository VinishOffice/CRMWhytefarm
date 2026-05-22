import React, { useContext, useEffect, useState } from "react";
import { CommunicationContext, CommunicationProvider } from "./CommunicationContext";
import Communication_Home from "./Communication";
const Communication = () => {
  return (
    <CommunicationProvider>
      <Communication_Home />
    </CommunicationProvider>
  );
};

export default Communication;
