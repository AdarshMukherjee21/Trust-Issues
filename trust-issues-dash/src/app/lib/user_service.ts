import { doc, setDoc, getDoc, collection, getDocs, serverTimestamp, query, orderBy } from "firebase/firestore";
import { db } from "./firebase";

export interface UserProfile {
  username: string;
  name: string;
  age: string;
  createdAt: any;
}

export const createUserProfile = async (uid: string, username: string, name: string, age: string) => {
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, {
    username,
    name,
    age,
    createdAt: serverTimestamp(),
  });
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    return snap.data() as UserProfile;
  }
  return null;
};

export const getSubcollectionCount = async (uid: string, subcollection: string): Promise<number> => {
  const subRef = collection(db, "users", uid, subcollection);
  const snap = await getDocs(subRef);
  return snap.size;
};

export const getSubcollectionDocs = async (uid: string, subcollection: string): Promise<any[]> => {
  const subRef = collection(db, "users", uid, subcollection);
  const q = query(subRef, orderBy("timestamp", "desc"));
  try {
    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    // Fallback if there's no index or elements don't have timestamp yet
    const fallbackSnap = await getDocs(subRef);
    return fallbackSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }
};
