import NextAuth, { NextAuthOptions, DefaultSession, DefaultUser } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"

// Étendre les types NextAuth pour inclure id, role et surname
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      surname: string
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    id: string
    role: string
    surname: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    surname: string
  }
}

// --- Configuration NextAuth ---
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.isActive) return null

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) return null

        // Retourner l'utilisateur avec tous les champs nécessaires
        return {
          id: user.id,
          email: user.email,
          name: user.firstName,
          surname: user.lastName,
          role: user.role,
        }
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    // Stocke les infos supplémentaires dans le JWT
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.surname = user.surname
      }
      return token
    },

    // Ajoute les infos du token dans la session
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.surname = token.surname
      }
      return session
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET, // Assure-toi d'avoir défini NEXTAUTH_SECRET dans ton .env
}

export default NextAuth(authOptions)
