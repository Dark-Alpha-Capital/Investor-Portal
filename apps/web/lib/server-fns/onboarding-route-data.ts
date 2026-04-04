import { createServerFn } from "@tanstack/react-start";
import { authSession } from "@/lib/auth-session-from-request";
import {
  getUserOnboardingStatus,
  getOnboardingWithEditHistory,
  getUserWithOnboarding,
} from "@repo/db/queries";
import { isOnboardingAdminRestrictedUser } from "@/lib/user-role-guards";

type LoginRedirect = { tag: "redirect"; to: "/login" };

export const fetchOnboardingPageData = createServerFn({ method: "GET" }).handler(
  async ():
    | LoginRedirect
    | { tag: "admin_restricted" }
    | { tag: "flow" }
    | {
        tag: "complete";
        onboarding: NonNullable<
          Awaited<ReturnType<typeof getOnboardingWithEditHistory>>
        >["onboarding"];
        editHistory: NonNullable<
          Awaited<ReturnType<typeof getOnboardingWithEditHistory>>
        >["editHistory"];
      } => {
    const session = await authSession();
    if (!session?.user) {
      return { tag: "redirect", to: "/login" };
    }
    if (isOnboardingAdminRestrictedUser(session.user)) {
      return { tag: "admin_restricted" };
    }

    const userId = session.user.id;
    const { isOnboardingCompleted } = await getUserOnboardingStatus(userId);

    if (!isOnboardingCompleted) {
      return { tag: "flow" };
    }

    const data = await getOnboardingWithEditHistory(userId);
    if (!data) {
      return { tag: "flow" };
    }

    return {
      tag: "complete",
      onboarding: data.onboarding,
      editHistory: data.editHistory,
    };
  },
);

export const fetchOnboardingEditPageData = createServerFn({
  method: "GET",
}).handler(
  async ():
    | LoginRedirect
    | { tag: "admin_restricted" }
    | { tag: "no_onboarding" }
    | { tag: "editing_disabled" }
    | {
        tag: "edit_flow";
        existingOnboarding: NonNullable<
          Awaited<ReturnType<typeof getUserWithOnboarding>>["onboarding"]
        >;
      } => {
    const session = await authSession();
    if (!session?.user) {
      return { tag: "redirect", to: "/login" };
    }
    if (isOnboardingAdminRestrictedUser(session.user)) {
      return { tag: "admin_restricted" };
    }

    const userId = session.user.id;
    const data = await getUserWithOnboarding(userId);

    if (!data || !data.onboarding) {
      return { tag: "no_onboarding" };
    }

    if (data.onboarding.isEditable === false) {
      return { tag: "editing_disabled" };
    }

    return { tag: "edit_flow", existingOnboarding: data.onboarding };
  },
);

export const fetchProfileEditOnboardingData = createServerFn({
  method: "GET",
}).handler(
  async ():
    | LoginRedirect
    | { tag: "admin_restricted" }
    | { tag: "no_onboarding" }
    | {
        tag: "ok";
        onboarding: NonNullable<
          Awaited<ReturnType<typeof getOnboardingWithEditHistory>>
        >["onboarding"];
        editHistory: NonNullable<
          Awaited<ReturnType<typeof getOnboardingWithEditHistory>>
        >["editHistory"];
      } => {
    const session = await authSession();
    if (!session?.user) {
      return { tag: "redirect", to: "/login" };
    }
    if (isOnboardingAdminRestrictedUser(session.user)) {
      return { tag: "admin_restricted" };
    }

    const userId = session.user.id;
    const data = await getOnboardingWithEditHistory(userId);

    if (!data || !data.onboarding) {
      return { tag: "no_onboarding" };
    }

    return {
      tag: "ok",
      onboarding: data.onboarding,
      editHistory: data.editHistory,
    };
  },
);
