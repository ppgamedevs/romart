import { Metadata } from "next";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  
  return {
    title: `Artwork ${slug} | Artfromromania`,
    description: `Artwork ${slug} - Romanian art on Artfromromania`,
  };
}

export default async function ArtworkPage({ params }: PageProps) {
  const { locale, slug } = await params;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Artwork: {slug}</h1>
        <p className="text-gray-600">Locale: {locale}</p>
        <p className="text-gray-600">This is a placeholder for the artwork page.</p>
      </div>
    </div>
  );
}
