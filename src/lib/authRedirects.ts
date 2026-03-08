export const APP_WEB_URL = "https://pro-placement-plus.vercel.app";

export const AUTH_REDIRECTS = {
  signupVerify: `${APP_WEB_URL}/login`,
  passwordRecovery: `${APP_WEB_URL}/reset-password`,
} as const;
