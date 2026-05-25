"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import type { HomeCopy } from "./homepage-types";

type NavbarProps = {
  copy: HomeCopy["nav"];
  brandName: string;
};

const links = [
  { id: "problematica", label: "Inicio" },
  { id: "solucion1", label: "Parqueos" },
  { id: "solucion3", label: "Sobre nosotros" },
];

export function Navbar({ copy, brandName }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-[#ffda36] text-slate-950 shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="#problematica"
          className="flex items-center gap-3 rounded-2xl px-1 py-1"
          onClick={() => setMenuOpen(false)}
        >
          <Image
            src="/parkingsv/logo-parking-sv.png"
            alt="Parking SV"
            width={46}
            height={46}
            className="h-11 w-11 object-contain"
          />
          <span className="font-display text-2xl font-black tracking-tight text-slate-950">
            {brandName}
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-6 lg:flex">
          {links.map((link) => (
            <Link
              key={link.id}
              href={`#${link.id}`}
              className="border-b-2 border-transparent px-1 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-950"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-black/15 bg-black text-white shadow-sm lg:hidden"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? copy.menuClose : copy.menuOpen}
          onClick={() => setMenuOpen((current) => !current)}
        >
          <span className="sr-only">Toggle navigation</span>
          <span className="space-y-1.5">
            <span className="block h-0.5 w-5 rounded-full bg-current" />
            <span className="block h-0.5 w-5 rounded-full bg-current" />
            <span className="block h-0.5 w-5 rounded-full bg-current" />
          </span>
        </button>

        <div className="hidden lg:block">
          <div className="h-11 w-11 overflow-hidden rounded-full border-2 border-white bg-black/10">
            <Image
              src="/parkingsv/bubble-accent.png"
              alt="Perfil"
              width={44}
              height={44}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>

      <div
        className={`border-t border-black/10 bg-[#ffda36] px-4 pb-4 pt-2 lg:hidden ${
          menuOpen ? "block" : "hidden"
        }`}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-2">
          {links.map((link) => (
            <Link
              key={link.id}
              href={`#${link.id}`}
              className="rounded-2xl px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-black/5"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
