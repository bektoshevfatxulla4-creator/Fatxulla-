import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import bodyParser from "body-parser";
import crypto from "crypto";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Firebase Config
const firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf-8'));

// Initialize Firebase Admin
initializeApp({
  projectId: firebaseConfig.projectId,
});

const dbInstance = getFirestore(firebaseConfig.firestoreDatabaseId);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // --- Payme Callback ---
  app.post("/api/payments/payme", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Basic ")) {
      return res.json({ error: { code: -32504, message: "Unauthorized" }, id: req.body.id });
    }

    const credentials = Buffer.from(authHeader.split(" ")[1], "base64").toString().split(":");
    const merchantId = credentials[0];
    const secretKey = credentials[1];

    if (merchantId !== process.env.PAYME_MERCHANT_ID || secretKey !== process.env.PAYME_SECRET_KEY) {
      return res.json({ error: { code: -32504, message: "Unauthorized" }, id: req.body.id });
    }

    const { method, params, id } = req.body;

    try {
      switch (method) {
        case "CheckPerformTransaction": {
          const { amount, account } = params;
          const userId = account.userId;
          
          const userDoc = await dbInstance.collection("users").doc(userId).get();
          if (!userDoc.exists) {
            return res.json({ error: { code: -31050, message: "User not found", data: "userId" }, id });
          }

          // Check amount (e.g., 50,000 UZS = 5000000 tiyin)
          if (amount < 100000) { // Min 1000 UZS for testing
             return res.json({ error: { code: -31001, message: "Invalid amount" }, id });
          }

          return res.json({ result: { allow: true }, id });
        }

        case "CreateTransaction": {
          const { id: transId, time, amount, account } = params;
          const userId = account.userId;

          const transDoc = await dbInstance.collection("payments").doc(transId).get();
          if (transDoc.exists) {
            if (transDoc.data()?.status !== "pending") {
               return res.json({ error: { code: -31008, message: "Transaction already exists" }, id });
            }
            return res.json({ result: { create_time: transDoc.data()?.create_time, transaction: transId, state: 1 }, id });
          }

          const createTime = Date.now();
          await dbInstance.collection("payments").doc(transId).set({
            uid: userId,
            amount: amount / 100,
            currency: "UZS",
            status: "pending",
            provider: "payme",
            timestamp: createTime,
            payme_trans_id: transId,
            create_time: createTime,
            state: 1
          });

          return res.json({ result: { create_time: createTime, transaction: transId, state: 1 }, id });
        }

        case "PerformTransaction": {
          const { id: transId } = params;
          const transDoc = await dbInstance.collection("payments").doc(transId).get();
          
          if (!transDoc.exists) {
            return res.json({ error: { code: -31003, message: "Transaction not found" }, id });
          }

          const data = transDoc.data();
          if (data?.state === 1) {
            const performTime = Date.now();
            await dbInstance.collection("payments").doc(transId).update({
              status: "completed",
              state: 2,
              perform_time: performTime
            });

            // Activate Premium for User
            const userId = data?.uid;
            const expiryDate = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days
            await dbInstance.collection("users").doc(userId).update({
              isPremium: true,
              premiumExpiry: expiryDate
            });

            return res.json({ result: { transaction: transId, perform_time: performTime, state: 2 }, id });
          } else if (data?.state === 2) {
            return res.json({ result: { transaction: transId, perform_time: data.perform_time, state: 2 }, id });
          }

          return res.json({ error: { code: -31008, message: "Invalid state" }, id });
        }

        case "CheckTransaction": {
           const { id: transId } = params;
           const transDoc = await dbInstance.collection("payments").doc(transId).get();
           if (!transDoc.exists) {
             return res.json({ error: { code: -31003, message: "Transaction not found" }, id });
           }
           const data = transDoc.data();
           return res.json({ 
             result: { 
               create_time: data?.create_time || 0, 
               perform_time: data?.perform_time || 0, 
               cancel_time: data?.cancel_time || 0, 
               transaction: transId, 
               state: data?.state || 0, 
               reason: data?.reason || null 
             }, 
             id 
           });
        }

        case "CancelTransaction": {
           const { id: transId, reason } = params;
           const transDoc = await dbInstance.collection("payments").doc(transId).get();
           if (!transDoc.exists) {
             return res.json({ error: { code: -31003, message: "Transaction not found" }, id });
           }
           const data = transDoc.data();
           if (data?.state === 1) {
             const cancelTime = Date.now();
             await dbInstance.collection("payments").doc(transId).update({
               status: "cancelled",
               state: -1,
               cancel_time: cancelTime,
               reason: reason
             });
             return res.json({ result: { transaction: transId, cancel_time: cancelTime, state: -1 }, id });
           } else if (data?.state === 2) {
             // Cannot cancel performed transaction easily in this demo
             return res.json({ error: { code: -31007, message: "Cannot cancel performed transaction" }, id });
           }
           return res.json({ result: { transaction: transId, cancel_time: data?.cancel_time || 0, state: data?.state || -1 }, id });
        }

        default:
          return res.json({ error: { code: -32601, message: "Method not found" }, id });
      }
    } catch (error) {
      console.error("Payme Error:", error);
      return res.json({ error: { code: -32400, message: "Internal Error" }, id });
    }
  });

  // --- Click Callback ---
  app.post("/api/payments/click", async (req, res) => {
    const {
      click_trans_id,
      service_id,
      click_paydoc_id,
      merchant_trans_id,
      amount,
      action,
      error,
      error_note,
      sign_time,
      sign_string
    } = req.body;

    const secretKey = process.env.CLICK_SECRET_KEY || "";
    const mySignString = crypto.createHash("md5").update(
      `${click_trans_id}${service_id}${click_paydoc_id}${merchant_trans_id}${amount}${action}${sign_time}${secretKey}`
    ).digest("hex");

    if (mySignString !== sign_string) {
      return res.json({ error: -1, error_note: "Sign string mismatch" });
    }

    const userId = merchant_trans_id;

    try {
      if (parseInt(action) === 0) { // Prepare
        const userDoc = await dbInstance.collection("users").doc(userId).get();
        if (!userDoc.exists) {
          return res.json({ error: -5, error_note: "User not found" });
        }
        
        // Create pending payment
        await dbInstance.collection("payments").doc(`click_${click_trans_id}`).set({
          uid: userId,
          amount: parseFloat(amount),
          currency: "UZS",
          status: "pending",
          provider: "click",
          timestamp: Date.now(),
          click_trans_id: click_trans_id
        });

        return res.json({
          click_trans_id,
          merchant_trans_id,
          merchant_prepare_id: click_trans_id,
          error: 0,
          error_note: "Success"
        });
      } else if (parseInt(action) === 1) { // Complete
        if (parseInt(error) < 0) {
           await dbInstance.collection("payments").doc(`click_${click_trans_id}`).update({
             status: "failed",
             error_note: error_note
           });
           return res.json({ error: -9, error_note: "Transaction failed" });
        }

        await dbInstance.collection("payments").doc(`click_${click_trans_id}`).update({
          status: "completed",
          perform_time: Date.now()
        });

        // Activate Premium
        const expiryDate = Date.now() + (30 * 24 * 60 * 60 * 1000);
        await dbInstance.collection("users").doc(userId).update({
          isPremium: true,
          premiumExpiry: expiryDate
        });

        return res.json({
          click_trans_id,
          merchant_trans_id,
          merchant_confirm_id: click_trans_id,
          error: 0,
          error_note: "Success"
        });
      }
    } catch (err) {
      console.error("Click Error:", err);
      return res.json({ error: -7, error_note: "Internal Error" });
    }
  });

  // Vite Middleware for Dev
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
