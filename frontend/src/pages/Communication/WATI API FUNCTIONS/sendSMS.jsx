import { sendTextLocalSms } from "../../../services/messagingService";
function cleanMessage(template, variables) {
    return template.replace(/%%\|([^\^]+)\^\{"inputtype"[^%]+%%/g, (match, key) => {
        return variables[key] !== undefined ? variables[key] : "0";
    });
}

export async function sendSMS(phone_number, balance) {
    const b = -100
    // const message = `Dear Customer, Your account balance is low (Rs. ${b} ). Please recharge with the link https://pmny.in/AIuL89hOjgFN immediately to avoid service disruption - Whyte Farms`;
    
    const message = cleanMessage(balance, new Map());

    
    try {
        const resp = await sendTextLocalSms({ phone_number, message });
        return resp;
    } catch (error) {
        console.error('Error sending SMS:', error);
        return { error: error.message, status: error.response?.status || null };
    }
}
