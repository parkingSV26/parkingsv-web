import Link from "next/link";

export function SiteAdSlot() {
  return (
    // Este bloque se reutiliza como espacio comercial suave entre secciones de producto.
    <section className="site-ad-slot">
      <div className="site-ad-slot__content">
        <span className="site-ad-slot__eyebrow">Espacio Comercial</span>
        <h3>Anúnciate aquí</h3>
        <p>
          Parking SV puede destacar negocios cercanos, servicios vehiculares y marcas locales sin
          interrumpir la experiencia.
        </p>
      </div>
      <Link href="/planes" className="site-ad-slot__cta">
        Conocer planes
      </Link>
    </section>
  );
}
