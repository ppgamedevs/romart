import { Metadata } from "next";
import { auth } from "@/auth/client";
import { redirect } from "next/navigation";
import { PayoutsDashboard } from "./PayoutsDashboard";

export const metadata: Metadata = {
  title: "Payouts | Studio | RomArt",
  description: "Manage your Stripe Connect account and view earnings",
};

export default async function PayoutsPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  if (session.user.role !== "ARTIST") {
    redirect("/studio");
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Payouts</h1>
          <p className="text-muted-foreground">
            Manage your Stripe Connect account and track your earnings
          </p>
        </div>
        
        <PayoutsDashboard />
      </div>
    </div>
  );
}
