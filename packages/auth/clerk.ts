import { auth } from '@clerk/nextjs/server'

import { env } from "./env.mjs";

export async function getSessionUser() {
  // For testing purposes, return a mock user without using auth()
  if (process.env.NODE_ENV === 'development') {
    return {
      email: 'test@saasfly.io',
      firstName: 'Test',
      lastName: 'User',
      isAdmin: false
    };
  }

  try {
    const { sessionClaims } = await auth();
    if (env.ADMIN_EMAIL) {
      const adminEmails = env.ADMIN_EMAIL.split(",");
      if (sessionClaims?.user?.email) {
        sessionClaims.user.isAdmin = adminEmails.includes(sessionClaims?.user?.email);
      }
    }
    return sessionClaims?.user;
  } catch (error) {
    // If auth fails, return null for testing
    return null;
  }
}
