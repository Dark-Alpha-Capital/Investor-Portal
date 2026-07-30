import { createAuthClient } from "better-auth/react";
import { adminClient, customSessionClient } from "better-auth/client/plugins";
import type { auth } from "@/auth";
import { getAuthBaseURL } from "@/lib/auth-base-url";

export const authClient: ReturnType<typeof createAuthClient> = createAuthClient({
  baseURL: getAuthBaseURL(),
  plugins: [adminClient(), customSessionClient<typeof auth>()],
});
