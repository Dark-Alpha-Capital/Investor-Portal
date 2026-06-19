import { createAuthClient } from "better-auth/react";
import { adminClient, customSessionClient } from "better-auth/client/plugins";
import type { auth } from "@/auth";

export const authClient: ReturnType<typeof createAuthClient> = createAuthClient(
  {
    baseURL:
      import.meta.env.VITE_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
    plugins: [adminClient(), customSessionClient<typeof auth>()],
  }
);
