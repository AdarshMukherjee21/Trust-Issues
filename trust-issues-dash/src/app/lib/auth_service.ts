import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendEmailVerification, 
  GoogleAuthProvider, 
  signInWithPopup,
  User,
  onAuthStateChanged
} from "firebase/auth";
import { auth } from "./firebase";

export const signUpWithEmail = async (email: string, password: string): Promise<User | null> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error signing up:", error);
    throw error;
  }
};

export const signInWithEmail = async (email: string, password: string): Promise<User | null> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error signing in:", error);
    throw error;
  }
};

export const verifyUserEmail = async (user: User): Promise<void> => {
  try {
    await sendEmailVerification(user);
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
};

export const checkEmailVerification = async (user: User): Promise<boolean> => {
  // Reload the user to get the most up-to-date verification status
  await user.reload();
  return user.emailVerified;
};

export const signInWithGoogle = async (): Promise<User | null> => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    return userCredential.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

export const logOut = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
