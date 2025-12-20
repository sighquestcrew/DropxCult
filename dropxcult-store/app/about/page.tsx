import { Metadata } from "next";
import { Crown, Flame, Shield, Zap, Star, Target, Users, Award, Package, Sparkles } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About DropXCult | Premium Streetwear Revolution",
  description: "Discover the story behind DropXCult. Premium streetwear inspired by ancient mythology and auspicious beasts. Limited edition drops with heavyweight cotton and high-def prints.",
  keywords: ["about dropxcult", "mythology streetwear brand", "premium t-shirts india", "streetwear story", "limited edition clothing"],
  openGraph: {
    title: "About DropXCult - The Cult Origin",
    description: "Discover the story behind DropXCult. Premium streetwear inspired by ancient mythology.",
    type: "website",
  },
};

const stats = [
  { value: "10K+", label: "Cult Members", icon: Users },
  { value: "500+", label: "Designs Created", icon: Sparkles },
  { value: "50+", label: "Limited Drops", icon: Package },
  { value: "4.9★", label: "Average Rating", icon: Star },
];

const values = [
  {
    icon: Crown,
    title: "Mythology Meets Modern",
    description: "Every design channels the power of ancient legends - from the Four Auspicious Beasts to forgotten deities."
  },
  {
    icon: Shield,
    title: "Premium Quality",
    description: "240 GSM French Terry cotton that feels like armor. Built to last through every adventure."
  },
  {
    icon: Flame,
    title: "Limited Editions",
    description: "Each drop is numbered and finite. Once it's gone, it becomes a legend of its own."
  },
  {
    icon: Zap,
    title: "Community Driven",
    description: "Our cult members design, vote, and shape what comes next. You're not a customer - you're a creator."
  },
];

const timeline = [
  { year: "2023", title: "The Beginning", desc: "DropXCult was born from a passion for mythology and fashion" },
  { year: "2024", title: "First Drop", desc: "Launched our first limited collection - sold out in 48 hours" },
  { year: "2024", title: "Community Era", desc: "Introduced community-driven design platform" },
  { year: "2025", title: "The Future", desc: "Expanding globally while staying true to our roots" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white">

      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-red-950/40 via-black to-purple-950/30" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-30" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-600/20 border border-red-600/30 rounded-full text-red-500 text-sm mb-8 backdrop-blur-sm">
            <Crown size={16} /> Established 2023
          </div>

          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter mb-6">
            THE <span className="bg-gradient-to-r from-red-500 via-orange-500 to-red-600 bg-clip-text text-transparent">CULT</span> ORIGIN
          </h1>

          <p className="text-xl sm:text-2xl text-gray-400 max-w-3xl mx-auto font-light italic mb-12">
            "Myths are not just stories. They are memories of a time when the world was wild."
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/shop" className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full transition-all hover:scale-105">
              Shop The Collection
            </Link>
            <Link href="/community" className="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-full border border-zinc-700 transition-all hover:scale-105">
              Join The Cult
            </Link>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-gray-600 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-gray-400 rounded-full animate-scroll" />
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 py-12 border-y border-zinc-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center group">
                <stat.icon className="mx-auto mb-3 text-red-500 group-hover:scale-110 transition" size={28} />
                <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div>
                <span className="text-red-500 text-sm font-bold tracking-widest uppercase">Our Story</span>
                <h2 className="text-4xl sm:text-5xl font-black mt-2 leading-tight">
                  Why <span className="text-red-500">DropXCult</span>?
                </h2>
              </div>

              <div className="space-y-6 text-lg text-gray-400 leading-relaxed">
                <p>
                  We didn't start DropXCult to sell clothes. We started it to <strong className="text-white">revive the ancient symbols</strong> of power, chaos, and divinity.
                </p>
                <p>
                  From the <strong className="text-red-500">Four Auspicious Beasts</strong> of the East to the <strong className="text-purple-500">Tragic Monsters</strong> of the West, every design is a chapter of history woven into fabric.
                </p>
                <p>
                  We operate on a "Drop" basis. Our collections are limited, just like the myths they represent. <strong className="text-white">Once they fade into history, they might never return.</strong>
                </p>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-purple-500 border-2 border-black flex items-center justify-center text-xs font-bold">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-gray-400">
                  Join <span className="text-white font-bold">10,000+</span> cult members
                </div>
              </div>
            </div>

            {/* Visual Element */}
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-3xl border border-zinc-700 overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-purple-600/10 group-hover:opacity-50 transition-opacity" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Crown size={80} className="mx-auto text-red-600 mb-4 group-hover:scale-110 transition" />
                    <p className="text-2xl font-bold">Est. 2023</p>
                    <p className="text-gray-500">Mumbai, India</p>
                  </div>
                </div>
                {/* Decorative corners */}
                <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-red-600/50 rounded-tl-lg" />
                <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-red-600/50 rounded-br-lg" />
              </div>

              {/* Floating badge */}
              <div className="absolute -bottom-6 -right-6 bg-red-600 text-white px-6 py-3 rounded-full font-bold shadow-2xl shadow-red-600/30">
                <Flame size={16} className="inline mr-2" />
                Premium Quality
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-24 bg-gradient-to-b from-black via-zinc-950 to-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-red-500 text-sm font-bold tracking-widest uppercase">What We Stand For</span>
            <h2 className="text-4xl sm:text-5xl font-black mt-2">The Cult Principles</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, i) => (
              <div key={i} className="group relative bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 hover:border-red-600/50 transition-all duration-300 hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-transparent opacity-0 group-hover:opacity-100 transition rounded-2xl" />
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-red-600/20 to-red-600/5 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                    <value.icon size={28} className="text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{value.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-red-500 text-sm font-bold tracking-widest uppercase">Our Journey</span>
            <h2 className="text-4xl sm:text-5xl font-black mt-2">The Timeline</h2>
          </div>

          <div className="max-w-3xl mx-auto">
            {timeline.map((item, i) => (
              <div key={i} className="flex gap-8 pb-12 last:pb-0">
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 bg-red-600 rounded-full ring-4 ring-red-600/30" />
                  {i !== timeline.length - 1 && <div className="w-0.5 h-full bg-zinc-800 mt-2" />}
                </div>
                <div className="pb-8">
                  <span className="text-red-500 font-bold text-sm">{item.year}</span>
                  <h3 className="text-xl font-bold mt-1">{item.title}</h3>
                  <p className="text-gray-500 mt-2">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quality Section */}
      <section className="py-24 bg-gradient-to-b from-zinc-900 to-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-red-500 text-sm font-bold tracking-widest uppercase">Uncompromising</span>
            <h2 className="text-4xl sm:text-5xl font-black mt-2">The Standards</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-orange-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition" />
              <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-8 h-full group-hover:border-red-600/50 transition">
                <div className="text-6xl font-black text-red-600 mb-4">240</div>
                <h3 className="text-xl font-bold mb-2">GSM Heavyweight</h3>
                <p className="text-gray-500">French Terry cotton for a structured, oversized fit that feels like armor.</p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition" />
              <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-8 h-full group-hover:border-purple-600/50 transition">
                <div className="text-6xl font-black text-purple-600 mb-4">HD</div>
                <h3 className="text-xl font-bold mb-2">Print Quality</h3>
                <p className="text-gray-500">Puff print and screen print techniques that withstand the test of time.</p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-600 to-orange-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition" />
              <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-8 h-full group-hover:border-yellow-600/50 transition">
                <div className="text-6xl font-black text-yellow-600 mb-4">#</div>
                <h3 className="text-xl font-bold mb-2">Numbered Editions</h3>
                <p className="text-gray-500">Every piece is numbered. You're not buying a tee - you're collecting an artifact.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-red-950/50 via-black to-purple-950/50" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />

        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-4xl sm:text-5xl font-black mb-6">Ready to Join?</h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Become part of a community that doesn't just wear clothes - they wear legends.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register" className="px-10 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-full transition-all hover:scale-105 shadow-lg shadow-red-600/30">
              Join The Cult
            </Link>
            <Link href="/customize" className="px-10 py-4 bg-white text-black font-bold rounded-full hover:bg-gray-100 transition-all hover:scale-105">
              Create Your Design
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}