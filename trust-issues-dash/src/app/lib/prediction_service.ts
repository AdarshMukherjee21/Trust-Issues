import { doc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "./firebase"; // Ensure this points to your firebase config

// ==========================================
// 1. CONFIGURATION & INTERFACES
// ==========================================

// Add these to your .env.local file:
// NEXT_PUBLIC_RAILWAY_API_URL=https://your-railway-app.up.railway.app
// NEXT_PUBLIC_RAILWAY_API_KEY=your_secret_key
const API_URL = process.env.NEXT_PUBLIC_RAILWAY_API_URL?.replace(/\/$/, '');
const API_KEY = process.env.NEXT_PUBLIC_RAILWAY_API_KEY;

export interface PredictionResponse {
    prediction: string; // e.g., "SPAM" or "HAM"
    [key: string]: any;
}

export interface ExplanationResponse {
    why_spam: string;
    spam_type: string;
    detection_tips: string;
    error?: string | null;
}

// Helper to generate readable timestamp IDs (e.g., "2026-04-21T18_14_11Z")
const generateTimestampId = () => new Date().toISOString().replace(/[:.]/g, '_');

// ==========================================
// 2. CORE FETCH WRAPPER
// ==========================================

async function railwayFetch<T>(endpoint: string, body: any): Promise<T> {
    // Grab them fresh right here
    const apiUrl = process.env.NEXT_PUBLIC_RAILWAY_API_URL?.replace(/\/$/, '');
    const apiKey = process.env.NEXT_PUBLIC_RAILWAY_API_KEY;

    if (!apiUrl || !apiKey) {
        console.error("DEBUG ENV:", { apiUrl, apiKey }); // This will print to your browser console
        throw new Error("Missing Railway API environment variables.");
    }

    const response = await fetch(`${apiUrl}${endpoint}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Trust-issue-API-Key": apiKey,
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        throw new Error(`Railway API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

// ==========================================
// 3. SMS & EMAIL PREDICTION SERVICES
// ==========================================

export const checkSms = async (uid: string, sender: string, text: string) => {
    // 1. Ask the AI Backend
    const result = await railwayFetch<PredictionResponse>("/api/v1/predict/sms", { text });
    console.log("SMS API Response:", result);

    // Extract the nested prediction ("SPAM" or "HAM")
    const finalPrediction = result?.data?.prediction || "UNKNOWN";

    // 2. Format the document ID
    const docId = generateTimestampId();
    const docRef = doc(db, "users", uid, "sms_checks", docId);

    // 3. Save to Firebase exactly as defined in the schema
    await setDoc(docRef, {
        message: text,
        prediction: finalPrediction,
        pushed_to_community: false,
        sender: sender,
        timestamp: serverTimestamp(),
    });

    return { docId, prediction: finalPrediction };
};

export const checkEmail = async (uid: string, sender: string, subject: string, body: string) => {
    // 1. Ask the AI Backend
    const result = await railwayFetch<PredictionResponse>("/api/v1/predict/email", { subject, body });
    console.log("Email API Response:", result);

    // Extract the nested prediction ("SPAM" or "HAM")
    const finalPrediction = result?.data?.prediction || "UNKNOWN";

    // 2. Format the document ID
    const docId = generateTimestampId();
    const docRef = doc(db, "users", uid, "email_checks", docId);

    // 3. Save to Firebase
    await setDoc(docRef, {
        message: body,
        subject: subject,
        prediction: finalPrediction,
        pushed_to_community: false,
        sender: sender,
        timestamp: serverTimestamp(),
    });

    return { docId, prediction: finalPrediction };
};

// ==========================================
// 4. AI EXPLANATION & SYNC SERVICE
// ==========================================

export const explainMessage = async (
    uid: string,
    source: "email" | "sms",
    originalDocId: string, // Needed so we can update the original doc!
    subject: string | null,
    body: string,
    ml_model_output: string
) => {
    // 1. Ask the AI Backend for the breakdown
    const explanation = await railwayFetch<ExplanationResponse>("/api/v1/explain", {
        source,
        subject,
        body,
        ml_model_output,
    });

    // 2. Format a clean AI explanation string based on the response
    const combinedExplanation = `${explanation.why_spam} ${explanation.detection_tips}`;

    // 3. Save the specific AI Ask into the `ai_asks` subcollection
    const aiDocId = generateTimestampId();
    const aiDocRef = doc(db, "users", uid, "ai_asks", aiDocId);

    await setDoc(aiDocRef, {
        ai_explanation: combinedExplanation,
        original_text: body,
        spam_type: explanation.spam_type,
        timestamp: serverTimestamp(),
    });

    // 4. Update the original SMS or Email document with the new findings
    // (The prompt mentioned updating the classification in the original doc)
    const collectionName = source === "email" ? "email_checks" : "sms_checks";
    const originalDocRef = doc(db, "users", uid, collectionName, originalDocId);

    await updateDoc(originalDocRef, {
        ai_explanation_ref: aiDocId, // Handly link to the explanation
        detailed_spam_type: explanation.spam_type, // Inject the exact type
    });

    return explanation;
};