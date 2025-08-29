import Image from "next/image";
import Link from "next/link";

export default function HomeHero({ t, locale }: { t: (k: string, ...a: any[]) => string; locale: string }) {
  return (
    <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="relative p-8 md:p-12 grid md:grid-cols-2 gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold">{t("heroTitle")}</h1>
          <p className="mt-3 text-lg opacity-80">{t("heroSubtitle")}</p>
          <div className="mt-6 flex gap-3">
            <Link 
              href={`/${locale}/discover`} 
              className="px-4 py-2 rounded-xl bg-black text-white hover:bg-gray-800 transition-colors"
            >
              {t("shopNow")}
            </Link>
            <Link 
              href={`/${locale}/collections`} 
              className="px-4 py-2 rounded-xl border hover:bg-gray-50 transition-colors"
            >
              Collections
            </Link>
          </div>
        </div>
        <div className="relative h-64 md:h-full bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center">
          <div className="text-center text-gray-600">
            <div className="text-6xl mb-4">🎨</div>
            <div className="text-lg font-medium">Romanian Art</div>
          </div>
        </div>
      </div>
    </section>
  );
}
