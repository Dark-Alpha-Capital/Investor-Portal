export type UserType = "guest" | "regular";

export type Session = {
  user: {
    id: string;
    type: UserType;
    email?: string;
    name?: string;
    role?: string;
    image?: string | null;
  };
} | null;
