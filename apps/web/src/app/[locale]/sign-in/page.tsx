import type { Metadata } from "next";
import { altLanguages, canonicalUrl } from "@/lib/seo";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const path = "/sign-in";
  return {
    title: "Sign In — Art from Romania",
    description: "Sign in to your Art from Romania account",
    alternates: {
      canonical: canonicalUrl(path),
      languages: altLanguages(path)
    }
  };
}

export default async function SignInPage({ params }: { params: { locale: string } }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">Sign In</h1>
        <p className="text-gray-600 mb-4">Locale: {params.locale}</p>
        <p className="text-gray-600">This is a placeholder for the sign-in page.</p>
      </div>
    </div>
  );
}
