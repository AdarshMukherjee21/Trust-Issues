// background.js
importScripts('config.js');

// 🛡️ NEW: Function to get a fresh token if the current one is expired
async function getFreshToken(refreshToken) {
    console.log("Refreshing Firebase ID Token...");
    const res = await fetch(`https://securetoken.googleapis.com/v1/token?key=${CONFIG.FIREBASE_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        })
    });
    const data = await res.json();
    // Save the new token back to storage
    await chrome.storage.local.set({ idToken: data.id_token });
    return data.id_token;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "SCAN_API") {
    // 🛡️ Added refreshToken to the retrieval list
    chrome.storage.local.get(['uid', 'idToken', 'refreshToken'], async (store) => {
      
      if (!store.uid || !store.refreshToken) {
        sendResponse({ success: false, error: "AUTH_REQUIRED" });
        return;
      }

      try {
        // 1. Always get a fresh token before writing to Firestore
        const activeToken = await getFreshToken(store.refreshToken);

        // 2. Hit Railway API (Same as your existing code)
        const railwayRes = await fetch(`${CONFIG.RAILWAY_API_URL}/api/v1/predict/email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Trust-issue-API-Key': CONFIG.RAILWAY_API_KEY
          },
          body: JSON.stringify({
            subject: request.subject || "No Subject",
            body: request.body ? request.body.substring(0, 5000) : "No Body"
          })
        });

        const mlData = await railwayRes.json();
        const prediction = mlData.data?.prediction || "UNKNOWN";

        // 3. Write to Firestore using the FRESH token
        const docId = new Date().toISOString().replace(/[:.]/g, '_');
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${CONFIG.FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${store.uid}/email_checks?documentId=${docId}`;

        const firestoreRes = await fetch(firestoreUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeToken}` // Use the refreshed token
          },
          body: JSON.stringify({
            fields: {
              subject: { stringValue: request.subject || "No Subject" },
              message: { stringValue: request.body ? request.body.substring(0, 2000) : "No Body" },
              sender: { stringValue: request.sender || "Unknown" },
              prediction: { stringValue: prediction },
              pushed_to_community: { booleanValue: false },
              timestamp: { timestampValue: new Date().toISOString() }
            }
          })
        });

        if (!firestoreRes.ok) {
            const err = await firestoreRes.json();
            throw new Error(`Firestore Write Failed: ${err.error.message}`);
        }

        sendResponse({ success: true, prediction: prediction, docId: docId });

      } catch (error) {
        console.error("🚨 Extension Error:", error);
        sendResponse({ success: false, error: error.message });
      }
    });
    return true; 
  }
});