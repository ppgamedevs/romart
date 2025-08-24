import { Metadata } from "next";
import { auth } from "@/auth/client";
import { redirect } from "next/navigation";
import { DownloadsList } from "./DownloadsList";

export const metadata: Metadata = {
  title: "My Downloads | RomArt",
  description: "Access your purchased digital files",
};

export default async function DownloadsPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Downloads</h1>
          <p className="text-muted-foreground">
            Access and download your purchased digital files. Each file can be downloaded up to 5 times.
          </p>
        </div>
        
        <DownloadsList userId={session.user.id} />
      </div>
    </div>
  );
}
