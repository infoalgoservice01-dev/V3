
import { GoogleGenAI } from "@google/genai";
import { Driver } from "../types";

export const generateComplianceEmail = (driver: Driver): string => {
  const template = `Hello {{driver_name}},

This is an automatic alert regarding your ELD (Electronic Logging Device) status.

Current Status:
- Driver: {{driver_name}}
- Status: {{driver_status}}
- ELD Connection: {{eld_connection}}

Please reconnect your ELD device at your earliest convenience.
A disconnected ELD while on duty or driving is a compliance violation.

If you have any questions or need assistance, please contact the ELD
team immediately.

Best regards,
ALGO Service Team`;

  return template
    .replace(/{{driver_name}}/g, driver.name)
    .replace(/{{driver_status}}/g, driver.dutyStatus)
    .replace(/{{eld_connection}}/g, driver.eldStatus);
};

/**
 * Simulates a driver responding to a compliance alert.
 */
export const generateDriverReply = async (driverName: string, messageSent: string): Promise<string> => {
  const prompt = `
    You are a truck driver named ${driverName}. You just received the following compliance alert:
    "${messageSent}"
    
    Write a short, realistic 1-sentence reply. 
    Examples: 
    - "Copy that, I'm pulling over to reset the tablet now."
    - "The cable is loose, I'll fix it at the next stop."
    - "I didn't realize it was off, checking now."
    
    Return only the reply text.
  `;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt
    });
    return response.text?.trim() || "Received. Will check.";
  } catch (error) {
    return "Copy that, I will check the connection.";
  }
};
