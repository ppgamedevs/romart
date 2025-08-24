import { Metadata } from "next";
import { auth } from "@/auth/client";
import { redirect } from "next/navigation";
import { FulfillmentQueue } from "./FulfillmentQueue";

export const metadata: Metadata = {
  title: "Fulfillment | Studio | RomArt",
  description: "Manage print orders and fulfillment",
};

export default async function FulfillmentPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  if (session.user.role !== "ARTIST" && session.user.role !== "ADMIN") {
    redirect("/studio");
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Fulfillment</h1>
          <p className="text-muted-foreground">
            Manage print orders and track production status
          </p>
        </div>

        <FulfillmentQueue />
      </div>
    </div>
  );
}
