import Link from "next/link";

export default function Home() {
  return (
    <main>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#0f3d2e22,transparent_40%),radial-gradient(circle_at_80%_0%,#b8860b22,transparent_35%)]" />
        <div className="relative mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-center px-5 py-20">
          <p className="text-xs uppercase tracking-[0.35em] text-gold">
            Private jewellery atelier
          </p>
          <h1 className="mt-5 max-w-3xl font-serif text-5xl leading-tight text-jewel sm:text-7xl">
            Coloured gemstones, chosen with quiet certainty.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-ink-soft">
            Sapphires, rubies, emeralds and rare stones sourced for collectors
            who prefer provenance over noise.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="#collection"
              className="rounded-full bg-jewel px-6 py-3 text-sm text-[#f7f1e8] transition hover:bg-[#0b2e22]"
            >
              View the collection
            </a>
            <Link
              href="/admin/login"
              className="rounded-full border border-gold/50 px-6 py-3 text-sm text-jewel hover:bg-gold/10"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <section id="collection" className="border-t border-gold/20 bg-card">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-3">
          {[
            ["Sapphire", "Cornflower, royal and padparadscha blues."],
            ["Ruby", "Pigeon-blood reds with a measured fire."],
            ["Emerald", "Garden greens from trusted origins."],
          ].map(([title, copy]) => (
            <article
              key={title}
              className="rounded-2xl border border-gold/20 px-6 py-8"
            >
              <div className="mb-6 h-28 rounded-xl bg-[linear-gradient(135deg,#0f3d2e,#b8860b55,#f7f1e8)]" />
              <h2 className="font-serif text-2xl text-jewel">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-ink-soft">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="atelier" className="mx-auto max-w-6xl px-5 py-20">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gold">
              The atelier
            </p>
            <h2 className="mt-4 font-serif text-4xl text-jewel">
              Stones first. Setting later.
            </h2>
            <p className="mt-5 leading-8 text-ink-soft">
              Each piece is photographed, described and priced before it reaches
              the tray. When you are ready, the house will take your order and
              keep you informed by email.
            </p>
          </div>
          <div className="rounded-3xl border border-gold/25 bg-jewel px-8 py-12 text-[#f7f1e8]">
            <p className="font-serif text-3xl">By appointment and by order.</p>
            <p className="mt-4 text-sm leading-7 text-[#f7f1e8]/80">
              Use the account icon to sign in to the atelier desk.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
