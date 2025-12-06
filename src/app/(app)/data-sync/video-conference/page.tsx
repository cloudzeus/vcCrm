import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { VideoConferenceClient } from "@/components/data-sync/video-conference-client";

export const dynamic = "force-dynamic";

export default async function VideoConferencePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <VideoConferenceClient />;
}
