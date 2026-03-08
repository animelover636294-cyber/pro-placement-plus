// Use the current origin so redirects work on whichever domain the app is served from
// (Vercel, Lovable preview, or localhost)
export const APP_WEB_URL = typeof window !== "undefined" ? window.location.origin : "https://pro-placement-plus.vercel.app";

export const AUTH_REDIRECTS = {
  signupVerify: `${APP_WEB_URL}/login`,
  passwordRecovery: `${APP_WEB_URL}/reset-password`,
} as const;
