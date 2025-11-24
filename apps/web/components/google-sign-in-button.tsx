"use client";

import React from "react";
import { FcGoogle } from "react-icons/fc";
import { Button } from "./ui/button";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

const GoogleSignInButton = () => {
  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={async () => {
        const data = await authClient.signIn.social({
          provider: "google",
        });

        if (data.error) {
          toast.error(data.error.message);
        }
      }}
    >
      <FcGoogle className="w-4 h-4 mr-2" />
      Continue with Google
    </Button>
  );
};

export default GoogleSignInButton;
