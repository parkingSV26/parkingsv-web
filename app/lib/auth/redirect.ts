const FALLBACK_REDIRECT = "/parqueos";

export function sanitizeAppRedirect(redirectValue: string | null | undefined) {
  const redirect = (redirectValue ?? "").trim();

  // Block empty, external, or suspicious redirects with line breaks.
  if (!redirect || /[\r\n]/.test(redirect)) {
    return FALLBACK_REDIRECT;
  }

  if (/^https?:\/\//i.test(redirect) || redirect.startsWith("//")) {
    return FALLBACK_REDIRECT;
  }

  if (redirect.startsWith("/")) {
    return redirect;
  }

  // Allow simple internal paths even when they arrive without a leading slash.
  if (/^[A-Za-z0-9/_?=&%-]+$/.test(redirect)) {
    return `/${redirect.replace(/^\/+/, "")}`;
  }

  return FALLBACK_REDIRECT;
}

export function getDefaultRedirect() {
  return FALLBACK_REDIRECT;
}
