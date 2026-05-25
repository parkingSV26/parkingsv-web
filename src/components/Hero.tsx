import Image from "next/image";

import type { HeroCopy } from "./homepage-types";

type HeroProps = {
  copy: HeroCopy;
};

export function Hero({ copy }: HeroProps) {
  return (
    <section
      id="problematica"
      className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-16"
    >
      <div className="flex flex-col justify-center">
        <p className="mb-4 inline-flex w-fit rounded-full bg-[#ffda36] px-4 py-2 text-sm font-bold uppercase tracking-[0.2em] text-slate-950 ring-1 ring-black/10">
          {copy.eyebrow}
        </p>

        <h1 className="max-w-3xl font-display text-5xl leading-[0.98] tracking-tight text-slate-950 sm:text-6xl lg:text-[4.4rem]">
          <span className="text-[#0c6ff9]">{copy.title.split(" ")[0]}</span>{" "}
          {copy.title.slice(copy.title.indexOf(" ") + 1)}
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700">{copy.description}</p>
        <p className="mt-3 max-w-2xl text-lg leading-8 text-slate-700">{copy.descriptionSecondary}</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href="#solucion2"
            className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-black/15 transition hover:-translate-y-0.5 hover:bg-slate-800"
          >
            {copy.primaryCta}
          </a>
          <a
            href="#footer-contact"
            className="inline-flex items-center justify-center rounded-full border border-black/15 bg-white px-6 py-3.5 text-base font-bold text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
          >
            {copy.secondaryCta}
          </a>
        </div>

        <div className="mt-6 inline-flex w-fit items-center gap-3 rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-black/10">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ffda36]" />
          {copy.badge}
        </div>
      </div>

      <div className="relative flex items-center justify-center">
        <div className="absolute -left-6 top-10 h-32 w-32 rounded-full bg-[#ffda36]/35 blur-3xl" />
        <div className="absolute -right-8 bottom-4 h-40 w-40 rounded-full bg-black/10 blur-3xl" />
        <div className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-black/10 bg-white p-5 shadow-[0_30px_80px_rgba(0,0,0,0.12)]">
          <div className="rounded-[1.4rem] bg-[#111] p-3">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[1.2rem] bg-black">
              <Image
                src="/parkingsv/problem-hero.png"
                alt={copy.imageAlt}
                fill
                preload
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover"
              />
            </div>
          </div>
          <div className="mt-4 rounded-[1.2rem] bg-[#ffda36] px-4 py-4 text-slate-950">
            <p className="text-sm font-bold uppercase tracking-[0.2em]">Problema</p>
            <p className="mt-2 text-sm leading-6">
              El tráfico y la falta de información dificultan estacionarse con eficiencia.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
