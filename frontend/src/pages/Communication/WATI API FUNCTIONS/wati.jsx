import {
    sendWatiTemplateMessage,
    fetchWatiTemplates,
    fetchTextLocalTemplates,
} from "../../../services/messagingService";


export const sendWhatsAppMessage = async (whatsappNumber, templateName, parameters = []) => {
    const payload = {
        whatsappNumber,
        template_name: templateName,
        broadcast_name: "Campaign1",
        parameters: parameters.map(param => ({ name: param.name, value: param.value }))
    };
  
    try {
        const resp = await sendWatiTemplateMessage(payload);
        return resp?.data || resp;
    } catch (error) {
        console.error("Error sending WhatsApp message:", error);
        return {customer_phone: whatsappNumber, status : "failed"};
    }
  };
  

export const getMessageTamplats = async () => {
  
    // const payload = {
    //     parameters: parameters.map(param => ({ name: param.name, value: param.value }))
    // };
  
    try {
        const resp = await fetchWatiTemplates();
        const data = resp?.data || resp;
        return data?.messageTemplates || data?.messageTemplates || [];
    } catch (error) {
        console.error("Error fetching WhatsApp message Templets:", error);
        return [];
    }
  };
  

export const getTextlocalMessageTamplats = async () => {
        try {
            const resp = await fetchTextLocalTemplates();
            return resp;
        } catch (error) {
            console.error("Error fetching templates:", error);
            return { error: error.message, status: null };
        }
    }
    