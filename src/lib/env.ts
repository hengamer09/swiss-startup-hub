// Server-only — do not import in client components.
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const env = {
  get DATABASE_URL() { return requireEnv("DATABASE_URL"); },
  get AUTH_SECRET() { return requireEnv("AUTH_SECRET"); },
  get SMTP_HOST() { return process.env.SMTP_HOST ?? ""; },
  get SMTP_USER() { return process.env.SMTP_USER ?? ""; },
  get SMTP_PASS() { return process.env.SMTP_PASS ?? ""; },
  get SMTP_PORT() { return process.env.SMTP_PORT ?? "587"; },
  get SMTP_FROM() { return process.env.SMTP_FROM ?? ""; },
  get CONTACT_EMAIL() { return process.env.CONTACT_EMAIL ?? "hello@swissstartuphub.ch"; },
  // Shared secret used to authenticate Vercel Cron requests.
  get CRON_SECRET() { return process.env.CRON_SECRET ?? ""; },
};
