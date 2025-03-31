
import crypto from "crypto";
import { Router } from "express";

const webhook: Router = Router()
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "your-secret-key";

webhook.post("/paystack", (req: any, res: any) => {
    const hash = crypto.createHmac("sha512", PAYSTACK_SECRET_KEY)
                       .update(req.body)
                       .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
        return res.status(401).json({ error: "Invalid signature" });
    }

    const event = req.body;
    console.log("Paystack Event Received:", event);

    switch (event.event) {
        case "charge.success":
            console.log("✅ Payment Successful:", event.data);
            break;
        case "transfer.success":
            console.log("✅ Transfer Successful:", event.data);
  
            break;
        default:
            console.log("⚠️ Unhandled event:", event.event);
    }

    res.sendStatus(200);
});


export default webhook