// Compute redirect URLs dynamically at call time so they match the current domain
export const getAuthRedirects = () => {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://pro-placement-plus.vercel.app";
  return {
    signupVerify: `${origin}/login`,
    passwordRecovery: `${origin}/reset-password`,
  };
};
