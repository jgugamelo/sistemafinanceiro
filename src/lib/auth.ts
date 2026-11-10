import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const autorizados = () =>
  (process.env.EMAILS_AUTORIZADOS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    // Só entra quem está na lista EMAILS_AUTORIZADOS. Lista vazia = ninguém entra.
    signIn({ user }) {
      return autorizados().includes((user.email || "").toLowerCase());
    },
  },
};
