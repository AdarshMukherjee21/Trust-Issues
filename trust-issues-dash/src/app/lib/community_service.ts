import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export interface BackendStatus {
  is_active: boolean;
  link_to_backend: string;
  last_updated: any;
}

export const getBackendStatus = async (): Promise<BackendStatus | null> => {
  try {
    const docRef = doc(db, "public", "backend_status");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as BackendStatus;
    }
  } catch (error) {
    console.error("Error fetching backend status:", error);
  }
  return null;
};

// Base fetcher checking backend availability before pinging API
async function apiFetch(endpoint: string, method: string = "GET", body?: any) {
  console.log(`[apiFetch] Triggered for endpoint: ${endpoint} | Method: ${method}`);
  
  const status = await getBackendStatus();
  console.log(`[apiFetch] Firebase Backend Status:`, status);
  
  if (!status || !status.is_active || !status.link_to_backend) {
    console.warn(`[apiFetch] Aborting request, backend considered offline from Firestore.`);
    throw new Error("Backend is currently offline or unreachable.");
  }
  
  const url = `${status.link_to_backend.replace(/\/$/, '')}${endpoint}`;
  console.log(`[apiFetch] Constructed Full URL: ${url}`);
  
  const config: RequestInit = {
    method,
    headers: { 
      "ngrok-skip-browser-warning": "true",
      ...(!body ? {} : { "Content-Type": "application/json" }) 
    }
  };

  if (body) {
    console.log(`[apiFetch] Transmitting Body:`, body);
    config.body = JSON.stringify(body);
  }

  try {
    console.log(`[apiFetch] Firing network request...`);
    const response = await fetch(url, config);
    console.log(`[apiFetch] Network Response Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      console.error(`[apiFetch] Bad response: HTTP ${response.status}`);
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[apiFetch] Successfully parsed JSON structure:`, data);
    return data;
  } catch (error) {
    console.error(`[apiFetch] EXCEPTION 'Failed to fetch' or network error for URL: ${url}`, error);
    throw error;
  }
}

/** 
 * API Routes wrapped 
 */

export const updateUser = (uid: string, username: string) => {
  return apiFetch("/api/v1/users/update", "POST", { uid, username });
};

export const addFriend = (uid1: string, uid2: string) => {
  return apiFetch("/api/v1/friends/add", "POST", { uid1, uid2 });
};

export const removeFriend = (uid1: string, uid2: string) => {
  return apiFetch("/api/v1/friends/remove", "POST", { uid1, uid2 });
};

export const reportThreat = (payload: {
  reporter_uid: string;
  threat_text: string;
  threat_type: string;
  sender_contact: string;
  sender_platform: string;
}) => {
  return apiFetch("/api/v1/threats/report", "POST", payload);
};

export const getFriendThreats = (uid: string) => {
  return apiFetch(`/api/v1/threats/friends/${uid}`, "GET");
};

export const fetchGraphData = (uid: string) => {
  return apiFetch(`/api/v1/graph-viz/${uid}`, "GET");
};
