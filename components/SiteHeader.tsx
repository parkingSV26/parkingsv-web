/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, type MouseEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logoutAction } from "@/app/lib/auth/actions";
import { siteDictionaries, type SiteDictionary } from "@/app/settings/_lib/preferences";
import { useSessionUser } from "@/components/useSessionUser";
import { useSitePreferences } from "@/components/useSitePreferences";

type SignupUserType = "" | "customer" | "owner";
type ActivePage = "home" | "parkings" | "about" | "none";

type SiteHeaderProps = {
  activePage?: ActivePage;
};

type NavItem = {
  href: string;
  labelKey: keyof SiteDictionary;
  className: string;
  iconClass: string;
  icon: string;
  activePages: ActivePage[];
};

const navItems: NavItem[] = [
  {
    href: "/#problematica",
    labelKey: "navHome",
    className: "inicio-link",
    iconClass: "inicio-icon",
    icon: "/parkingsv/home-icon.png",
    activePages: ["home"],
  },
  {
    href: "/parqueos",
    labelKey: "navParkings",
    className: "parqueos-link",
    iconClass: "parqueos-icon",
    icon: "/parkingsv/parkings-icon.png",
    activePages: ["parkings"],
  },
  {
    href: "/sobre-nosotros",
    labelKey: "navAbout",
    className: "about-link",
    iconClass: "about-icon",
    icon: "/parkingsv/about-icon.png",
    activePages: ["about"],
  },
];

const sessionFeatures = [
  {
    icon: "fa-solid fa-user-gear session-feature-icon",
    titleKey: "sessionFeaturePersonalizationTitle",
    descriptionKey: "sessionFeaturePersonalizationDesc",
  },
  {
    icon: "fa-solid fa-bookmark session-feature-icon",
    titleKey: "sessionFeatureSavedTitle",
    descriptionKey: "sessionFeatureSavedDesc",
  },
  {
    icon: "fa-solid fa-bell session-feature-icon",
    titleKey: "sessionFeatureNotificationsTitle",
    descriptionKey: "sessionFeatureNotificationsDesc",
  },
  {
    icon: "fa-solid fa-calendar-check session-feature-icon",
    titleKey: "sessionFeatureReservationsTitle",
    descriptionKey: "sessionFeatureReservationsDesc",
  },
] as const;

export function SiteHeader({ activePage }: SiteHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const preferences = useSitePreferences();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [signupUserType, setSignupUserType] = useState<SignupUserType>("");
  const [sessionOpen, setSessionOpen] = useState(false);
  const { user } = useSessionUser();
  const dictionary = siteDictionaries[preferences.language];

  useEffect(() => {
    // Cuando hay modales abiertos bloqueamos el scroll del body para que la UI no se desacomode.
    document.body.style.overflow = authOpen || sessionOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [authOpen, sessionOpen]);

  const resolvedActivePage = activePage ?? resolveActivePage(pathname);

  const closeMenus = () => {
    setMenuOpen(false);
    setUserMenuOpen(false);
  };

  const navigateToLogin = () => {
    closeMenus();
    setSessionOpen(false);
    setAuthOpen(false);

    const redirectTarget = pathname === "/" ? "/parqueos" : pathname;
    router.push(`/login?redirect=${encodeURIComponent(redirectTarget)}`);
  };

  const navigateToRegister = () => {
    closeMenus();
    setSessionOpen(false);
    setAuthOpen(false);
    router.push("/register");
  };

  const handleRestrictedLink = (event: MouseEvent<HTMLAnchorElement>) => {
    // Algunas secciones se anuncian antes de estar listas, así que abrimos el modal de sesión en su lugar.
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
          <Link href="/#problematica" onClick={closeMenus}>
            <img
              src="/parkingsv/logo-parking-sv.png"
              alt={dictionary.brandName}
              width={60}
              height={60}
            />
          </Link>
          <h2 className="name">{dictionary.brandName}</h2>
        </div>

        <button
          type="button"
          className="navbar-toggle"
          id="navbarToggle"
          aria-label={menuOpen ? dictionary.navCloseMenu : dictionary.navMenuToggle}
          onClick={() => setMenuOpen((current) => !current)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav>
          <ul className={`navbar-links ${menuOpen ? "show" : ""}`}>
            {navItems.map((item) => {
              const isActive = item.activePages.includes(resolvedActivePage);

              return (
                <li key={item.href} className="nav-item">
                  <a
                    href={item.href}
                    className={`nav-link ${item.className} ${isActive ? "active" : ""}`}
                    onClick={closeMenus}
                  >
                    <img
                      src={item.icon}
                      className={item.iconClass}
                      alt={`${dictionary.brandName} ${dictionary[item.labelKey].toLowerCase()}`}
                      width={30}
                      height={30}
                    />
                    <span>{dictionary[item.labelKey]}</span>
                  </a>
                </li>
              );
            })}

            <li className={`user-dropdown ${userMenuOpen ? "active" : ""}`}>
              <a href="#" id="userMenuBtn" onClick={toggleUserMenu}>
                <img
                  src={user?.profilePicture ?? "/parkingsv/default-avatar.jpeg"}
                  alt={user ? `Profile picture of ${user.fullName}` : "Profile picture"}
                  className="user-profile-picture"
                  id="userMenuIcon"
                  width={53}
                  height={53}
                />
              </a>

              <ul className="user-dropdown-menu" id="userDropdown">
                {user ? (
                  <>
                    {(() => {
                      const roleLink =
                        user.userType === "owner"
                          ? {
                              href: "/mis-parqueos",
                              icon: "fa-solid fa-square-parking",
                              label: dictionary.userMyParkings,
                            }
                          : {
                              href: "/mis-reservas",
                              icon: "fa-solid fa-calendar-check",
                              label: dictionary.userReservations,
                            };

                      return (
                        <>
                    <li className="user-dropdown-summary">
                      <span>{user.fullName}</span>
                      <small>
                        {user.userType === "owner" ? dictionary.userOwnerRole : dictionary.userCustomerRole}
                      </small>
                    </li>
                    <li>
                      <Link href="/mi-cuenta" onClick={closeMenus}>
                        <i className="fa-solid fa-user" aria-hidden="true" />{" "}
                        <span>{dictionary.userAccount}</span>
                      </Link>
                    </li>
                    <li>
                      <Link href={roleLink.href} onClick={closeMenus}>
                        <i className={roleLink.icon} aria-hidden="true" /> <span>{roleLink.label}</span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/guardados" onClick={closeMenus}>
                        <i className="fa-solid fa-bookmark" aria-hidden="true" />{" "}
                        <span>{dictionary.userSaved}</span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/notificaciones" onClick={closeMenus}>
                        <i className="fa-solid fa-bell" aria-hidden="true" />{" "}
                        <span>{dictionary.userNotifications}</span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/configuracion" onClick={closeMenus}>
                        <i className="fa-solid fa-gear" aria-hidden="true" />{" "}
                        <span>{dictionary.userSettings}</span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/parqueos" onClick={closeMenus}>
                        <i className="fa-solid fa-car" aria-hidden="true" />{" "}
                        <span>{dictionary.navParkings}</span>
                      </Link>
                    </li>
                    <li>
                      <form action={logoutAction} className="user-dropdown-form">
                        <button type="submit" className="user-dropdown-button">
                          <i className="fa-solid fa-right-from-bracket" aria-hidden="true" />
                          <span>{dictionary.userLogout}</span>
                        </button>
                      </form>
                    </li>
                        </>
                      );
                    })()}
                  </>
                ) : (
                  <>
                    <li>
                      <a href="#" className="restricted-link" onClick={handleRestrictedLink}>
                        <i className="fa-solid fa-user" aria-hidden="true" />{" "}
                        <span>{dictionary.userAccount}</span>
                      </a>
                    </li>
                    <li>
                      <a href="#" className="restricted-link" onClick={handleRestrictedLink}>
                        <i className="fa-solid fa-calendar-check" aria-hidden="true" />{" "}
                        <span>{dictionary.userReservations}</span>
                      </a>
                    </li>
                    <li>
                      <a href="#" className="restricted-link" onClick={handleRestrictedLink}>
                        <i className="fa-solid fa-bookmark" aria-hidden="true" />{" "}
                        <span>{dictionary.userSaved}</span>
                      </a>
                    </li>
                    <li>
                      <a href="#" className="restricted-link" onClick={handleRestrictedLink}>
                        <i className="fa-solid fa-bell" aria-hidden="true" />{" "}
                        <span>{dictionary.userNotifications}</span>
                      </a>
                    </li>
                    <li>
                      <a href="#" className="restricted-link" onClick={handleRestrictedLink}>
                        <i className="fa-solid fa-gear" aria-hidden="true" />{" "}
                        <span>{dictionary.userSettings}</span>
                      </a>
                    </li>
                  </>
                )}
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
                alt="Locked"
                className="lock-icon"
                width={100}
                height={100}
              />
            </div>
            <h2 className="session-modal-title">{dictionary.sessionTitle}</h2>
            <p className="session-modal-subtitle">{dictionary.sessionSubtitle}</p>
          </div>

          <div className="session-modal-features-container">
            <div className="features-scroll">
              {sessionFeatures.map((feature) => (
                <div key={feature.titleKey} className="session-feature-item">
                  <i className={feature.icon} aria-hidden="true" />
                  <div className="session-feature-text">
                    <h3>{dictionary[feature.titleKey]}</h3>
                    <p>{dictionary[feature.descriptionKey]}</p>
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
              <i className="fa-solid fa-right-to-bracket" aria-hidden="true" />
              <span>{dictionary.sessionLogin}</span>
            </button>
            <button
              id="sessionModalGuest"
              className="btn session-btn-secondary session-btn-guest"
              type="button"
              onClick={() => setSessionOpen(false)}
            >
              <i className="fa-solid fa-user-secret" aria-hidden="true" />
              <span>{dictionary.sessionGuest}</span>
            </button>
            <p className="account-prompt">
              <span>{dictionary.sessionNoAccount}</span>{" "}
              <span className="register-link" onClick={navigateToRegister}>
                {dictionary.sessionCreateAccount}
              </span>
            </p>
          </div>
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
            aria-label={dictionary.closeModal}
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
                {dictionary.sessionLogin}
              </button>
              <button
                id="switchSignup"
                type="button"
                className="auth-tab"
                onClick={navigateToRegister}
              >
                {dictionary.signupSubmit}
              </button>
          </div>

          <div className="logo-container">
            <img
              src="/parkingsv/logo-parking-sv.png"
              alt={dictionary.brandName}
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
              <i className="fa-solid fa-envelope" aria-hidden="true" />
              <input
                type="email"
                name="loginEmail"
                placeholder={dictionary.loginEmailPlaceholder}
                required
              />
            </div>
            <div className="form-group">
              <i className="fa-solid fa-lock" aria-hidden="true" />
              <input
                type="password"
                name="loginPassword"
                placeholder={dictionary.loginPasswordPlaceholder}
                required
              />
            </div>
            <button type="submit" name="login" className="btn-auth btn-login">
              {dictionary.sessionLogin}
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
              <i className="fa-solid fa-user" aria-hidden="true" />
              <input
                type="text"
                name="name"
                placeholder={dictionary.signupNamePlaceholder}
                required
              />
            </div>
            <div className="form-group">
              <i className="fa-solid fa-user" aria-hidden="true" />
              <input
                type="text"
                name="lastName"
                placeholder={dictionary.signupLastNamePlaceholder}
                required
              />
            </div>
            <div className="form-group">
              <i className="fa-solid fa-envelope" aria-hidden="true" />
              <input
                type="email"
                name="email"
                placeholder={dictionary.signupEmailPlaceholder}
                required
              />
            </div>
            <div className="form-group">
              <i className="fa-solid fa-lock" aria-hidden="true" />
              <input
                type="password"
                name="password"
                placeholder={dictionary.signupPasswordPlaceholder}
                minLength={8}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="userTypeSelect">{dictionary.signupRolePrompt}</label>
              <select
                name="userType"
                id="userTypeSelect"
                required
                value={signupUserType}
                onChange={(event) => setSignupUserType(event.target.value as SignupUserType)}
              >
                <option value="">{dictionary.signupRolePlaceholder}</option>
                <option value="customer">{dictionary.signupCustomer}</option>
                <option value="owner">{dictionary.signupOwner}</option>
              </select>
            </div>
            <div className="form-group">
              <i className="fa-solid fa-phone" aria-hidden="true" />
              <input
                type="text"
                name="phone"
                placeholder={dictionary.signupPhonePlaceholder}
                required
                autoComplete="tel"
              />
            </div>
            <div
              className="form-group"
              id="birthDateGroup"
              style={{ display: signupUserType === "customer" ? "block" : "none" }}
            >
              <i className="fa-solid fa-calendar-days" aria-hidden="true" />
              <p>{dictionary.signupBirthDate}</p>
              <input type="date" name="birth_date" id="birthDateInput" />
            </div>
            <div
              className="form-group"
              id="businessNameGroup"
              style={{ display: signupUserType === "owner" ? "block" : "none" }}
            >
              <i className="fa-solid fa-store" aria-hidden="true" />
              <input
                type="text"
                name="business_name"
                placeholder={dictionary.signupBusinessNamePlaceholder}
                id="businessNameInput"
              />
            </div>
            <button type="submit" name="register" className="btn-auth btn-signup">
              {dictionary.signupSubmit}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

function resolveActivePage(pathname: string): ActivePage {
  if (pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/verify-email")) {
    return "none";
  }

  if (pathname.startsWith("/sobre-nosotros")) {
    return "about";
  }

  if (pathname.startsWith("/parqueos")) {
    return "parkings";
  }

  return "home";
}
