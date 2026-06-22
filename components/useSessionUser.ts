"use client";

import { useEffect, useState } from "react";

export type SessionUser = {
  email: string;
  fullName: string;
  id: number;
  profilePicture: string;
  userType: "customer" | "owner";
};

type SessionResponse = {
  user: SessionUser | null;
};

export function useSessionUser() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // The hook loads the session once and cancels the request if the component unmounts.
    const controller = new AbortController();

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("oo se pudo cargar la sesión.");
        }

        const payload = (await response.json()) as SessionResponse;
        setUser(payload.user);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        console.error(error);
        setUser(null);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadSession();

    const handleProfilePictureUpdated = (event: Event) => {
      // This avoids reloading the whole session when only the avatar changes from My Account.
      const customEvent = event as CustomEvent<{ url?: string }>;
      const nextUrl = customEvent.detail?.url;

      if (!nextUrl) {
        return;
      }

      setUser((current) =>
        current
          ? {
              ...current,
              profilePicture: nextUrl,
            }
          : current,
      );
    };

    window.addEventListener("parking-sv-profile-picture-updated", handleProfilePictureUpdated);

    return () => {
      controller.abort();
      window.removeEventListener(
        "parking-sv-profile-picture-updated",
        handleProfilePictureUpdated,
      );
    };
  }, []);

  return { isLoading, user };
}
