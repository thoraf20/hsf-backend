import { parentPort, workerData } from "worker_threads";
import axios from "axios";

const sendChampApiUrl = "https://api.sendchamp.com/api/v1/email/send";
const sendChampApiKey = process.env.SENDCHAMP_API_KEY;

async function sendEmail() {
  try {
    if (!workerData || !workerData.to || !workerData.subject || !workerData.html) {
      throw new Error("Invalid workerData format");
    }

    const response = await axios.post(
      sendChampApiUrl,
      {
        to: [{ email: workerData.to }],
        from: { email: "noreply@yourapp.com", name: "YourApp" },
        subject: workerData.subject,
        message_body: { type: "text/html", value: workerData.html },
      },
      { headers: { Authorization: `Bearer ${sendChampApiKey}`,     
      Accept: 'application/json,text/plain,*/*',
      'Content-Type': 'application/json', } }
    );
     console.log(response)
    if (response.data.status === "success") {
      parentPort.postMessage("Email sent successfully");
    } else {
      throw new Error("Email sending failed: " + JSON.stringify(response.data));
    }
  } catch (error) {
    parentPort.postMessage(`Error sending email: ${error.message}`);
  }
}

sendEmail();
