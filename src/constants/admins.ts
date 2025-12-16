export const ADMIN_EMAILS = ['onlinewebspacejunk@gmail.com'];

export const isAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
};
