const { onRequest } = require("firebase-functions/v2/https");
const { initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

exports.gumroadWebhookListener = onRequest(
  {
    region: "africa-south1",
    timeoutSeconds: 60,
    memory: "256Mi",
  },
  async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const {
      email,
      purchase_id,
      is_recurring_billing,
      product_name,
    } = req.body;

    if (!email) {
      console.error("No email provided in webhook.");
      return res.status(400).send("Missing email.");
    }

    try {
      const userRef = db.collection("users").doc(email);

      const dataToWrite = {
        premium: true,
        subscriptionSource: "gumroad",
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (purchase_id !== undefined) dataToWrite.purchaseId = purchase_id;
      if (is_recurring_billing !== undefined) dataToWrite.recurring = is_recurring_billing;
      if (product_name !== undefined) dataToWrite.productName = product_name;

      await userRef.set(dataToWrite, { merge: true });

      console.log(`User ${email} upgraded to premium via Gumroad`);
      res.status(200).send("Webhook processed successfully.");
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).send("Internal Server Error");
    }
  }
);
