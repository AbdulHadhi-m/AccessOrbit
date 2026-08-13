const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export const env = {
  apiUrl,
  isDev: process.env.NODE_ENV === "development",
} as const;