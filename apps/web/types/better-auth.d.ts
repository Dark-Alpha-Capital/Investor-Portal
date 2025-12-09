// Extend Better Auth types to include role field from customSession plugin
declare module "better-auth/types" {
  interface User {
    role?: string | null;
  }
}

