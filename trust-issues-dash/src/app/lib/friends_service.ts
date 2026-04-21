import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  onSnapshot,
  getDoc,
  deleteDoc // <-- Added deleteDoc for removing/canceling
} from "firebase/firestore";
import { db } from "./firebase";
import { UserProfile } from "./user_service"; // Assuming this exists in your project
import { addFriend, removeFriend as removeFriendFromGraph } from "./community_service";

// ==========================================
// 1. INTERFACES
// ==========================================

export interface FriendStatus {
  uid: string;
  sent_by_me: boolean;
  accepted_by_me: boolean;
  accepted_by_them: boolean;
  timestamp: any;
}

export interface SearchUserResult extends UserProfile {
  uid: string;
}

// ==========================================
// 2. SEARCH & DISCOVERY
// ==========================================

export const searchUsers = async (searchTerm: string): Promise<SearchUserResult[]> => {
  const usersRef = collection(db, "users");
  const results: SearchUserResult[] = [];
  const term = searchTerm.toLowerCase().trim();

  if (!term) return results;

  try {
    const snap = await getDocs(usersRef);
    snap.forEach((doc) => {
      const data = doc.data();
      const username = (data.username || "").toLowerCase();
      const name = (data.name || "").toLowerCase();
      const uid = doc.id.toLowerCase();

      if (username.includes(term) || name.includes(term) || uid.includes(term)) {
        results.push({ uid: doc.id, ...data } as SearchUserResult);
      }
    });
  } catch (error) {
    console.error("Error searching users:", error);
  }

  return results;
};

// ==========================================
// 3. SENDING & ACCEPTING REQUESTS
// ==========================================

export const sendFriendRequest = async (currentUid: string, targetUid: string) => {
  if (currentUid === targetUid) throw new Error("Cannot add yourself.");

  const mySideRef = doc(db, "users", currentUid, "friends", targetUid);
  await setDoc(mySideRef, {
    sent_by_me: true,
    accepted_by_me: true,
    accepted_by_them: false,
    timestamp: new Date()
  }, { merge: true });

  const theirSideRef = doc(db, "users", targetUid, "friends", currentUid);
  await setDoc(theirSideRef, {
    sent_by_me: false,
    accepted_by_me: false,
    accepted_by_them: true,
    timestamp: new Date()
  }, { merge: true });
};

export const acceptFriendRequest = async (currentUid: string, targetUid: string) => {
  const mySideRef = doc(db, "users", currentUid, "friends", targetUid);
  await setDoc(mySideRef, {
    accepted_by_me: true
  }, { merge: true });

  const theirSideRef = doc(db, "users", targetUid, "friends", currentUid);
  await setDoc(theirSideRef, {
    accepted_by_them: true
  }, { merge: true });

  // Alert the Trust Issues Graph API Backend
  await addFriend(currentUid, targetUid);
};

// ==========================================
// 4. REMOVING, CANCELING & REJECTING
// ==========================================

export const removeOrCancelFriend = async (currentUid: string, targetUid: string) => {
  try {
    // 1. Delete from Current User's side
    const mySideRef = doc(db, "users", currentUid, "friends", targetUid);
    await deleteDoc(mySideRef);

    // 2. Delete from Target User's side
    const theirSideRef = doc(db, "users", targetUid, "friends", currentUid);
    await deleteDoc(theirSideRef);

    // 3. Sever the tie in Neo4j (Fails silently if they weren't fully friends yet)
    await removeFriendFromGraph(currentUid, targetUid).catch(err => {
      console.warn("Neo4j edge removal skipped/failed (likely wasn't an active friend yet):", err);
    });

  } catch (error) {
    console.error("Error removing/canceling friend:", error);
    throw error;
  }
};

// ==========================================
// 5. ONE-TIME DATA FETCHERS
// ==========================================

export const getReceivedRequests = async (currentUid: string): Promise<FriendStatus[]> => {
  const friendsRef = collection(db, "users", currentUid, "friends");
  const q = query(friendsRef, where("sent_by_me", "==", false), where("accepted_by_me", "==", false));

  const snap = await getDocs(q);
  const requests: FriendStatus[] = [];
  snap.forEach((doc) => {
    requests.push({ uid: doc.id, ...doc.data() } as FriendStatus);
  });
  return requests;
};

export const getSentRequests = async (currentUid: string): Promise<FriendStatus[]> => {
  const friendsRef = collection(db, "users", currentUid, "friends");
  const q = query(friendsRef, where("sent_by_me", "==", true), where("accepted_by_them", "==", false));

  const snap = await getDocs(q);
  const requests: FriendStatus[] = [];
  snap.forEach((doc) => {
    requests.push({ uid: doc.id, ...doc.data() } as FriendStatus);
  });
  return requests;
};

// ==========================================
// 6. REAL-TIME LISTENERS (For UI state)
// ==========================================

export const listenToIncomingRequests = (currentUid: string, callback: (requests: FriendStatus[]) => void) => {
  const friendsRef = collection(db, "users", currentUid, "friends");
  const q = query(friendsRef, where("sent_by_me", "==", false), where("accepted_by_me", "==", false));

  return onSnapshot(q, (snapshot) => {
    const requests: FriendStatus[] = [];
    snapshot.forEach((doc) => {
      requests.push({ uid: doc.id, ...doc.data() } as FriendStatus);
    });
    callback(requests);
  });
};

export const listenToSentRequests = (currentUid: string, callback: (requests: FriendStatus[]) => void) => {
  const friendsRef = collection(db, "users", currentUid, "friends");
  const q = query(friendsRef, where("sent_by_me", "==", true), where("accepted_by_them", "==", false));

  return onSnapshot(q, (snapshot) => {
    const requests: FriendStatus[] = [];
    snapshot.forEach((doc) => {
      requests.push({ uid: doc.id, ...doc.data() } as FriendStatus);
    });
    callback(requests);
  });
};

export const listenToFriends = (currentUid: string, callback: (friends: FriendStatus[]) => void) => {
  const friendsRef = collection(db, "users", currentUid, "friends");
  const q = query(friendsRef, where("accepted_by_me", "==", true), where("accepted_by_them", "==", true));

  return onSnapshot(q, (snapshot) => {
    const friends: FriendStatus[] = [];
    snapshot.forEach((doc) => {
      friends.push({ uid: doc.id, ...doc.data() } as FriendStatus);
    });
    callback(friends);
  });
};