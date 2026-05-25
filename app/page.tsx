/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, type CSSProperties, type MouseEvent } from "react";
import { useRouter } from "next/navigation";

type AuthMode = "login" | "signup";
type SignupUserType = "" | "customer" | "owner";
type NavItem = {
  href: string;
  label: string;
  className: string;
  iconClass: string;
  icon: string;
  active?: boolean;
};

const navItems: NavItem[] = [
  {
    href: "/#problematica",
    label: "Inicio",
    className: "inicio-link",
    iconClass: "inicio-icon",
    icon: "/parkingsv/home-icon.png",
    active: true,
  },
  {
    href: "/parqueos",
    label: "Parqueos",
    className: "parqueos-link",
    iconClass: "parqueos-icon",
    icon: "/parkingsv/parkings-icon.png",
  },
  {
    href: "/sobre-nosotros",
    label: "Sobre nosotros",
    className: "about-link",
    iconClass: "about-icon",
    icon: "/parkingsv/about-icon.png",
  },
] as const;

const socialLinks = [
  {
    label: "YouTube",
    href: "https://youtube.com/",
    accentColor: "red",
    path: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/parkingsv/?utm_source=ig_web_button_share_sheet",
    accentColor: "#fe107c",
    path: "M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/",
    accentColor: "#106bff",
    path: "M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z",
  },
] as const;

const sessionFeatures = [
  {
    icon: "fas fa-user-cog session-feature-icon",
    title: "Personalización total",
    description: "Adaptamos tu experiencia a tus preferencias",
  },
  {
    icon: "fas fa-bookmark session-feature-icon",
    title: "Organiza favoritos",
    description: "Guarda tus parqueos preferidos",
  },
  {
    icon: "fas fa-bell session-feature-icon",
    title: "Notificaciones",
    description: "Alertas de disponibilidad y promociones",
  },
  {
    icon: "fas fa-calendar-check session-feature-icon",
    title: "Reservas anticipadas",
    description: "Asegura tu espacio antes de llegar",
  },
] as const;

const ads = [
  "Lugares turísticos",
  "Carwash para autos",
  "Talleres mecánicos",
  "Tiendas de accesorios vehiculares",
  "Restaurantes cercanos",
  "Servicios de taxi",
] as const;

const currentYear = new Date().getFullYear();

export default function HomePage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [signupUserType, setSignupUserType] = useState<SignupUserType>("");
  const [sessionOpen, setSessionOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = authOpen || sessionOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [authOpen, sessionOpen]);

  const closeMenus = () => {
    setMenuOpen(false);
    setUserMenuOpen(false);
  };

  const navigateToLogin = () => {
    closeMenus();
    setSessionOpen(false);
    setAuthOpen(false);
    router.push("/login?redirect=%2Fparqueos");
  };

  const navigateToRegister = () => {
    closeMenus();
    setSessionOpen(false);
    setAuthOpen(false);
    router.push("/register");
  };

  const openAuthModal = (mode: AuthMode) => {
    if (mode === "login") {
      navigateToLogin();
      return;
    }

    navigateToRegister();
  };

  const handlePrimaryCta =
    (mode: AuthMode) => (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      openAuthModal(mode);
    };

  const handleRestrictedLink = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setSessionOpen(true);
    setUserMenuOpen(false);
  };

  const toggleUserMenu = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setUserMenuOpen((current) => !current);
  };

  return (
    <>
      <header className="navbar">
        <div className="logo">
          <a href="#problematica" onClick={closeMenus}>
            <img
              src="/parkingsv/logo-parking-sv.png"
              alt="Logo Parking SV"
              width={60}
              height={60}
            />
          </a>
          <h2 className="name">Parking SV</h2>
        </div>

        <button
          type="button"
          className="navbar-toggle"
          id="navbarToggle"
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setMenuOpen((current) => !current)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav>
          <ul className={`navbar-links ${menuOpen ? "show" : ""}`}>
            {navItems.map((item) => (
              <li key={item.label} className="nav-item">
                <a
                  href={item.href}
                  className={`nav-link ${item.className} ${item.active ? "active" : ""}`}
                  onClick={() => {
                    closeMenus();
                  }}
                >
                  <img
                    src={item.icon}
                    className={item.iconClass}
                    alt={`Icono ${item.label.toLowerCase()}`}
                    width={30}
                    height={30}
                  />
                  <span>{item.label}</span>
                </a>
              </li>
            ))}

            <li className={`user-dropdown ${userMenuOpen ? "active" : ""}`}>
              <a href="#" id="userMenuBtn" onClick={toggleUserMenu}>
                <img
                  src="/parkingsv/default-avatar.jpeg"
                  alt="Foto de perfil"
                  className="user-profile-picture"
                  id="userMenuIcon"
                  width={53}
                  height={53}
                />
              </a>

              <ul className="user-dropdown-menu" id="userDropdown">
                <li>
                  <a href="#" className="restricted-link" onClick={handleRestrictedLink}>
                    <i className="fas fa-user" aria-hidden="true" />{" "}
                    <span>Mi cuenta</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="restricted-link" onClick={handleRestrictedLink}>
                    <i className="fas fa-calendar-check" aria-hidden="true" />{" "}
                    <span>Mis reservas</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="restricted-link" onClick={handleRestrictedLink}>
                    <i className="fas fa-bookmark" aria-hidden="true" />{" "}
                    <span>Guardados</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="restricted-link" onClick={handleRestrictedLink}>
                    <i className="fas fa-bell" aria-hidden="true" />{" "}
                    <span>Notificaciones</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="restricted-link" onClick={handleRestrictedLink}>
                    <i className="fas fa-cog" aria-hidden="true" />{" "}
                    <span>Configuración</span>
                  </a>
                </li>
              </ul>
            </li>
          </ul>
        </nav>
      </header>

      <div
        id="sessionModal"
        className={`session-modal ${sessionOpen ? "active" : ""}`}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            setSessionOpen(false);
          }
        }}
      >
        <div className="session-modal-content">
          <div className="session-modal-header">
            <div className="session-modal-icon">
              <img
                src="/parkingsv/locked.png"
                alt="Bloqueado"
                className="lock-icon"
                width={100}
                height={100}
              />
            </div>
            <h2 className="session-modal-title">No iniciaste sesión</h2>
            <p className="session-modal-subtitle">
              Inicia sesión para desbloquear estos beneficios exclusivos
            </p>
          </div>

          <div className="session-modal-features-container">
            <div className="features-scroll">
              {sessionFeatures.map((feature) => (
                <div key={feature.title} className="session-feature-item">
                  <i className={feature.icon} aria-hidden="true" />
                  <div className="session-feature-text">
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="session-modal-actions">
            <button
              id="sessionModalLogin"
              className="btn session-btn-primary"
              type="button"
              onClick={navigateToLogin}
            >
              <i className="fas fa-sign-in-alt" aria-hidden="true" />
              <span>Iniciar sesión</span>
            </button>
            <button
              id="sessionModalGuest"
              className="btn session-btn-secondary session-btn-guest"
              type="button"
              onClick={() => setSessionOpen(false)}
            >
              <i className="fas fa-user-secret" aria-hidden="true" />
              <span>Explorar como invitado</span>
            </button>
            <p className="account-prompt">
              <span>¿No tienes cuenta?</span>{" "}
              <span className="register-link" onClick={navigateToRegister}>
                Crear una cuenta
              </span>
            </p>
          </div>
        </div>
      </div>

      <main>
        <section className="problem-wrapper snap-section" id="problematica">
          <h1 className="problem-title">
            <span className="highlight">Todos</span> nos enfrentamos a esta problemática.
            <br />
            En El Salvador y en el mundo.
          </h1>

          <div className="problem-content">
            <div className="problem-left">
              <p className="problem-desc">
                Cada día, miles de nosotros perdemos tiempo, dinero y energía buscando parqueo.
                El tráfico y la falta de información dificultan estacionarse con eficiencia.
              </p>
              <p className="problem-desc">
                Parking SV nace como una solución rápida y confiable para encontrar espacios
                disponibles, sin estrés ni pérdidas de tiempo.
              </p>
            </div>

            <div className="problem-right">
              <div className="floating-images">
                <img src="/parkingsv/bubble-accent.png" alt="Solución Parking SV" />
              </div>
            </div>
          </div>

          <div className="buttons">
            <a
              href="#"
              id="openLoginModal"
              className="btn-action"
              onClick={handlePrimaryCta("login")}
            >
              Empezar ya
            </a>
            <a
              href="#"
              id="openSignupModal"
              className="btn-action"
              onClick={handlePrimaryCta("signup")}
            >
              Publicar mi espacio ya
            </a>
          </div>
        </section>

        <section className="inline-ad-slot">
          <div className="inline-ad-slot__content">
            <span className="inline-ad-slot__eyebrow">Monetización MVP</span>
            <h3>Anúnciate aquí</h3>
            <p>
              Ideal para carwash, talleres, restaurantes cercanos, turismo local y servicios
              pensados para conductores.
            </p>
          </div>
          <a href="#footer-contact" className="inline-ad-slot__cta">
            Reservar espacio
          </a>
        </section>

        <section className="carousel-slide snap-section" id="solucion1">
          <h2>Parking SV tiene la solución</h2>
          <div className="carousel-slide-content">
            <div className="carousel-slide-text">
              <p>
                Parking SV es la solución inteligente, rápida y local para conectar personas que
                necesitan parqueo con quienes tienen un espacio disponible.
              </p>
              <p className="feature-item">Sin complicaciones, sin perder tiempo, sin estrés.</p>
              <p className="feature-item">Publica tu lote o empieza a ganar</p>
              <p className="feature-item">
                Encontra un parqueo cerca, confiable y en minutos.
              </p>
            </div>
            <div className="carousel-slide-img">
              <img src="/parkingsv/solution-card.png" alt="solución img" />
            </div>
          </div>
        </section>

        <section className="carousel-slide snap-section" id="solucion2">
          <h2>¿Cómo funciona?</h2>
          <div className="carousel-slide-content">
            <div className="carousel-slide-text">
              <p className="feature-item">Explora la lista de parqueos en tiempo real</p>
              <p className="feature-item">Encuentra parqueos cerca de tu destino</p>
              <p className="feature-item">
                Verifica la información del espacio y la calificación del parqueo
              </p>
              <p className="feature-item">
                Selecciona un parqueo, mira el mapa, maneja en Waze y listo
              </p>
            </div>
            <div className="carousel-slide-img">
              <img src="/parkingsv/process-card.png" alt="video" />
            </div>
          </div>
        </section>

        <section className="carousel-slide snap-section" id="solucion3">
          <h2>¿Por qué Parking SV?</h2>
          <div className="carousel-slide-content">
            <div className="carousel-slide-text">
              <p className="feature-item">Hecha por salvadoreños, para salvadoreños</p>
              <p className="feature-item">Sin comisiones, sin apps complicadas</p>
              <p className="feature-item">Comunidad verificada</p>
              <p className="feature-item">Ahorro de tiempo, combustible y dinero</p>
            </div>
            <div className="carousel-slide-img">
              <img src="/parkingsv/value-card.png" alt="por que Parking SV" />
            </div>
          </div>
        </section>

        <div className="message-modal" id="messageModal" style={{ display: "none" }}>
          <div className="message-modal-content">
            <span className="close-message-modal" id="closeMessageModal">
              &times;
            </span>
            <div id="messageContent" />
          </div>
        </div>

        <div
          className="login-signup-modal"
          id="loginSignupModal"
          style={{ display: authOpen ? "block" : "none" }}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setAuthOpen(false);
            }
          }}
        >
          <div className="modal-content">
            <button
              type="button"
              className="close-modal"
              id="closeModalBtn"
              aria-label="Cerrar modal"
              onClick={() => setAuthOpen(false)}
            >
              &times;
            </button>

            <div className="auth-tabs">
              <button
                id="switchLogin"
                type="button"
                className="auth-tab active"
                onClick={navigateToLogin}
              >
                Iniciar sesión
              </button>
              <button
                id="switchSignup"
                type="button"
                className="auth-tab"
                onClick={navigateToRegister}
              >
                Registrarse
              </button>
            </div>

            <div className="logo-container">
              <img
                src="/parkingsv/logo-parking-sv.png"
                alt="Logo Parking SV"
                className="auth-logo"
                width={80}
                height={80}
              />
            </div>

            <form
              id="loginForm"
              method="post"
              action=""
              onSubmit={(event) => {
                event.preventDefault();
                navigateToLogin();
              }}
              style={{ display: "block" }}
            >
              <div className="form-group">
                <i className="fas fa-envelope" aria-hidden="true" />
                <input type="email" name="loginEmail" placeholder="Correo electrónico" required />
              </div>
              <div className="form-group">
                <i className="fas fa-lock" aria-hidden="true" />
                <input type="password" name="loginPassword" placeholder="Contraseña" required />
              </div>
              <button type="submit" name="login" className="btn-auth btn-login">
                Iniciar sesión
              </button>
            </form>

            <form
              id="signupForm"
              method="post"
              action=""
              onSubmit={(event) => {
                event.preventDefault();
                navigateToRegister();
              }}
              style={{ display: "none" }}
            >
              <div className="form-group">
                <i className="fas fa-user" aria-hidden="true" />
                <input type="text" name="name" placeholder="Nombre" required />
              </div>
              <div className="form-group">
                <i className="fas fa-user" aria-hidden="true" />
                <input type="text" name="lastName" placeholder="Apellidos" required />
              </div>
              <div className="form-group">
                <i className="fas fa-envelope" aria-hidden="true" />
                <input type="email" name="email" placeholder="Correo electrónico" required />
              </div>
              <div className="form-group">
                <i className="fas fa-lock" aria-hidden="true" />
                <input
                  type="password"
                  name="password"
                  placeholder="Contraseña"
                  minLength={8}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="userTypeSelect">¿Eres cliente o propietario?</label>
                <select
                  name="userType"
                  id="userTypeSelect"
                  required
                  value={signupUserType}
                  onChange={(event) => setSignupUserType(event.target.value as SignupUserType)}
                >
                  <option value="">Selecciona una opción</option>
                  <option value="customer">Cliente</option>
                  <option value="owner">Propietario</option>
                </select>
              </div>
              <div className="form-group">
                <i className="fas fa-phone" aria-hidden="true" />
                <input type="text" name="phone" placeholder="Teléfono" required autoComplete="tel" />
              </div>
              <div
                className="form-group"
                id="birthDateGroup"
                style={{ display: signupUserType === "customer" ? "block" : "none" }}
              >
                <i className="fas fa-calendar-alt" aria-hidden="true" />
                <p>Fecha de nacimiento</p>
                <input type="date" name="birth_date" id="birthDateInput" />
              </div>
              <div
                className="form-group"
                id="businessNameGroup"
                style={{ display: signupUserType === "owner" ? "block" : "none" }}
              >
                <i className="fas fa-store" aria-hidden="true" />
                <input
                  type="text"
                  name="business_name"
                  placeholder="Nombre del negocio"
                  id="businessNameInput"
                />
              </div>
              <button type="submit" name="register" className="btn-auth btn-signup">
                Registrarse
              </button>
            </form>
          </div>
        </div>

        <div className="ad-card snap-section" id="anuncios">
          <h3 className="ad-title">Anúnciate Aquí</h3>
          <p className="ad-subtitle">Ejemplos de anunciantes potenciales:</p>
          <ul className="ad-examples">
            {ads.map((ad) => (
              <li key={ad}>{ad}</li>
            ))}
          </ul>
        </div>
      </main>

      <section className="site-ad-slot" id="footer-contact">
        <div className="site-ad-slot__content">
          <span className="site-ad-slot__eyebrow">Espacio Comercial</span>
          <h3>Anúnciate aquí</h3>
          <p>
            Parking SV puede destacar negocios cercanos, servicios vehiculares y marcas locales
            sin interrumpir la experiencia.
          </p>
        </div>
        <a href="#anuncios" className="site-ad-slot__cta">
          Quiero anunciarme
        </a>
      </section>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-left">
            <a href="#problematica">
              <img
                src="/parkingsv/logo-parking-sv.png"
                alt="Logo Parking SV"
                className="footer-logo-img"
                width={60}
                height={60}
              />
            </a>
            <span className="footer-logo-text">Parking SV</span>
            <div className="footer-copy">Copyright &copy; {currentYear} Parking SV</div>
          </div>

          <div className="footer-center">
            <p className="footer-social-title">Síguenos en nuestras redes sociales!</p>
            <div className="socials-container">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  data-social={social.label}
                  style={{ "--accent-color": social.accentColor } as CSSProperties}
                  href={social.href}
                  aria-label={social.label}
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <title>{social.label}</title>
                    <path d={social.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
