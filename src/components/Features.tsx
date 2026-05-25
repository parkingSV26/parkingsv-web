import Image from "next/image";

import type { FeaturesCopy } from "./homepage-types";

type FeaturesProps = {
  copy: FeaturesCopy;
};

export function Features({ copy }: FeaturesProps) {
  return (
    <section className="px-4 pb-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-10">
        {copy.sections.map((section, index) => {
          const reverse = section.reverse ?? index % 2 === 1;

          return (
            <article
              key={section.id}
              id={section.id}
              className={`grid items-center gap-8 rounded-[2rem] border border-black/10 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.06)] sm:p-8 lg:grid-cols-[1fr_0.95fr] ${
                reverse ? "lg:[&>*:first-child]:order-2" : ""
              }`}
            >
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#0c6ff9]">
                  {index === 0 ? "Solución" : index === 1 ? "Funcionamiento" : "Valor"}
                </p>
                <h2 className="mt-3 font-display text-3xl tracking-tight text-slate-950 sm:text-4xl">
                  {section.title}
                </h2>
                <div className="mt-5 space-y-4 text-lg leading-8 text-slate-700">
                  {section.description.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>

                <ul className="mt-6 space-y-3">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-3 text-base leading-7 text-slate-700">
                      <span className="mt-2 inline-flex h-3 w-3 flex-none rounded-full bg-[#ffda36] ring-1 ring-black/15" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="relative">
                <div className="absolute -inset-3 rounded-[2rem] bg-[#ffda36]/20 blur-2xl" />
                <div className="relative overflow-hidden rounded-[1.6rem] border border-black/10 bg-black">
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={section.image}
                      alt={section.alt}
                      fill
                      sizes="(max-width: 1024px) 100vw, 45vw"
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
