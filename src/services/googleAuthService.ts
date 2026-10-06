import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
];

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
SCOPES.forEach(scope => provider.addScope(scope));
// Allow seamless automatic account selection without forcing manual account picker every time

let isSigningIn = false;
let activeSignInPromise: Promise<{ user: User; accessToken: string } | null> | null = null;
// In-memory cache for the access token as required by Workspace guidelines (never in localStorage/sessionStorage)
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // User is logged in to Firebase but token is not in memory for this session
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  if (activeSignInPromise) {
    return activeSignInPromise;
  }

  activeSignInPromise = (async () => {
    try {
      isSigningIn = true;
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) {
        throw new Error('No se pudo obtener el token de acceso de Google');
      }

      cachedAccessToken = credential.accessToken;
      return { user: result.user, accessToken: cachedAccessToken };
    } catch (error: any) {
      // Gracefully handle harmless popup dismissals or supersessions
      if (
        error.code === 'auth/popup-closed-by-user' || 
        error.code === 'auth/cancelled-popup-request' ||
        error.code === 'auth/user-cancelled'
      ) {
        console.warn('Inicio de sesión de Google cancelado o ventana cerrada por el usuario.');
        return null;
      }
      console.error('Error durante la autenticación con Google:', error);
      throw error;
    } finally {
      isSigningIn = false;
      activeSignInPromise = null;
    }
  })();

  return activeSignInPromise;
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Auto-connects to Google Drive if not already connected.
 * Safe to call from any user action or gesture handler.
 */
export const autoConnectDrive = async (): Promise<string | null> => {
  if (cachedAccessToken) return cachedAccessToken;
  const res = await googleSignIn();
  return res?.accessToken || null;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};
