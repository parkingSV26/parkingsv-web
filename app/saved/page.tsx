import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSavedParkingStateForUser } from "@/app/lib/favorites";
import { getPublishedParkings } from "@/app/lib/parkings";
import { getSessionUser } from "@/app/lib/auth/session";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import SavedClient from "./SavedClient";

export const metadata: Metadata = {
  title: "Parking SV - Guardados",
  description: "Biblioteca personal para organizar parqueos guardados y carpetas favoritas.",
};

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/login?redirect=/guardados");
  }

  const [savedState, parkings] = await Promise.all([
    getSavedParkingStateForUser(sessionUser.id),
    getPublishedParkings(),
  ]);

  return (
    <>
      <SiteHeader activePage="none" />
      <main>
        <SavedClient initialState={savedState} parkings={parkings} />
      </main>
      <SiteFooter />
    </>
  );
}
