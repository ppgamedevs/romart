"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface ArtistTabsProps {
  artistId: string;
  locale: string;
  children: React.ReactNode;
}

export function ArtistTabs({ artistId, locale, children }: ArtistTabsProps) {
  return (
    <Tabs defaultValue="works" className="w-full">
      <div className="container">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="works">
            {locale === "ro" ? "Lucrări" : "Works"}
          </TabsTrigger>
          <TabsTrigger value="about">
            {locale === "ro" ? "Despre" : "About"}
          </TabsTrigger>
          <TabsTrigger value="exhibitions">
            {locale === "ro" ? "Expoziții" : "Exhibitions"}
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="works" className="mt-8">
        {children}
      </TabsContent>

      <TabsContent value="about" className="mt-8">
        <div className="container">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold mb-4">
              {locale === "ro" ? "Despre Artist" : "About the Artist"}
            </h2>
            <p className="text-muted leading-relaxed">
              {locale === "ro" 
                ? "Informații detaliate despre artist și procesul său creativ vor fi afișate aici."
                : "Detailed information about the artist and their creative process will be displayed here."
              }
            </p>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="exhibitions" className="mt-8">
        <div className="container">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold mb-4">
              {locale === "ro" ? "Expoziții" : "Exhibitions"}
            </h2>
            <p className="text-muted leading-relaxed">
              {locale === "ro"
                ? "Istoricul expozițiilor și evenimentelor artistului vor fi afișate aici."
                : "The artist's exhibition history and events will be displayed here."
              }
            </p>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
