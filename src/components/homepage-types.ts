// These types keep the landing-page copy variants aligned in both languages.
export type LanguageCode = "es" | "en";

export type NavCopy = {
  home: string;
  menuOpen: string;
  menuClose: string;
};

export type HeroStat = {
  value: string;
  label: string;
};

export type HeroStep = {
  index: string;
  title: string;
  description: string;
};

export type HeroCopy = {
  eyebrow: string;
  title: string;
  description: string;
  descriptionSecondary: string;
  primaryCta: string;
  secondaryCta: string;
  badge: string;
  imageAlt: string;
};

export type StorySectionCopy = {
  id: string;
  title: string;
  description: string[];
  bullets: string[];
  image: string;
  alt: string;
  reverse?: boolean;
};

export type FeaturesCopy = {
  sections: StorySectionCopy[];
};

export type FooterCopy = {
  adEyebrow: string;
  adTitle: string;
  adDescription: string;
  adCta: string;
  socialTitle: string;
  copyright: string;
};

export type HomeCopy = {
  brand: {
    name: string;
  };
  nav: NavCopy;
  hero: HeroCopy;
  features: FeaturesCopy;
  footer: FooterCopy;
};
