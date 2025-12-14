import Image from "next/image";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About DropXCult",
  description: "Discover the story behind DropXCult. Premium streetwear inspired by ancient mythology and auspicious beasts. Limited edition drops with heavyweight cotton and high-def prints.",
  keywords: ["about dropxcult", "mythology streetwear brand", "premium t-shirts india", "streetwear story", "limited edition clothing"],
  openGraph: {
    title: "About DropXCult - The Cult Origin",
    description: "Discover the story behind DropXCult. Premium streetwear inspired by ancient mythology.",
    type: "website",
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative h-[50vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-red-900/20 z-0"></div>
        <div className="z-10 text-center px-4 max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6">
            THE <span className="text-red-600">CULT</span> ORIGIN
          </h1>
          <p className="text-xl text-gray-300 italic">
            "Myths are not stories. They are memories of a time when the world was wild."
          </p>
        </div>
      </section>

      {/* The Story Section */}
      <section className="container mx-auto px-4 py-20 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <div className="space-y-6">
          <h2 className="text-3xl font-bold border-l-4 border-red-600 pl-4">WHY DROPXCULT?</h2>
          <p className="text-gray-400 leading-relaxed text-lg">
            We didn't start DropXCult to sell clothes. We started it to revive the ancient symbols of power, chaos, and divinity. From the <strong>Four Auspicious Beasts</strong> of the East to the <strong>Tragic Monsters</strong> of the West, every design is a chapter of history woven into fabric.
          </p>
          <p className="text-gray-400 leading-relaxed text-lg">
            We operate on a "Drop" basis. Our collections are limited, just like the myths they represent. Once they fade into history, they might never return.
          </p>
        </div>

        {/* Placeholder for a brand image */}
        <div className="relative h-[400px] bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden grayscale hover:grayscale-0 transition duration-700">
          {/* Replace this with a real photo of your team or workshop later */}
          <div className="absolute inset-0 flex items-center justify-center text-gray-600 font-bold">
            [BRAND AESTHETIC IMAGE]
          </div>
        </div>
      </section>

      {/* Quality Section */}
      <section className="bg-zinc-900 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-12">THE STANDARDS</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 border border-zinc-800 rounded">
              <h3 className="text-xl font-bold text-red-500 mb-2">Heavyweight Cotton</h3>
              <p className="text-gray-400">240 GSM French Terry for a structured, oversized fit that feels like armor.</p>
            </div>
            <div className="p-6 border border-zinc-800 rounded">
              <h3 className="text-xl font-bold text-red-500 mb-2">High-Def Prints</h3>
              <p className="text-gray-400">Puff print and screen print techniques that withstand the test of time.</p>
            </div>
            <div className="p-6 border border-zinc-800 rounded">
              <h3 className="text-xl font-bold text-red-500 mb-2">Limited Archives</h3>
              <p className="text-gray-400">Every piece is numbered. You aren't just buying a tee; you're collecting an artifact.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}