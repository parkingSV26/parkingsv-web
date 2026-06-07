import "server-only";

type SupabaseErrorLike = {
  code?: string | number | null;
  details?: string | null;
  hint?: string | null;
  message?: string | null;
};

const CONNECTION_ERROR_MESSAGE =
  "No se pudo conectar con Supabase. Verifica que la URL del proyecto sea correcta y que el proyecto siga activo.";

const RECOVERY_ERROR_MESSAGE =
  "La base de datos de Supabase está temporalmente en reposo o en recuperación. Intenta de nuevo en unos minutos.";

const SCHEMA_MISMATCH_ERROR_MESSAGE =
  "La base de datos de Supabase no coincide con el código actual. Revisa la migración o el nombre de las columnas/tablas.";

const DUPLICATE_ERROR_MESSAGE =
  "Ya existe un registro con esos datos. Revisa el correo u otro campo único.";

const INVALID_INPUT_ERROR_MESSAGE =
  "Supabase rechazó uno de los valores porque no coincide con el tipo esperado.";

function toIssue(error: unknown): SupabaseErrorLike {
  if (typeof error === "object" && error !== null) {
    const candidate = error as Partial<SupabaseErrorLike> & { [key: string]: unknown };

    return {
      code: candidate.code as string | number | null | undefined,
      details: typeof candidate.details === "string" ? candidate.details : null,
      hint: typeof candidate.hint === "string" ? candidate.hint : null,
      message: typeof candidate.message === "string" ? candidate.message : null,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  if (typeof error === "string") {
    return {
      message: error,
    };
  }

  return {};
}

function normalizeText(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function isConnectionError(text: string) {
  return /fetch failed|network|enotfound|eai_again|econNrefused|timeout/i.test(text);
}

function isDatabaseRecoveryError(text: string) {
  return /database is currently in recovery mode|currently in recovery|read-only transaction|recovery mode/i.test(
    text,
  );
}

function isSchemaMismatchError(issue: SupabaseErrorLike, text: string) {
  return (
    String(issue.code) === "42703" ||
    String(issue.code) === "PGRST205" ||
    /column .* does not exist|could not find the table|undefined column/i.test(text)
  );
}

function isDuplicateError(issue: SupabaseErrorLike, text: string) {
  return String(issue.code) === "23505" || /duplicate key value|already exists/i.test(text);
}

function isInvalidInputError(issue: SupabaseErrorLike, text: string) {
  return String(issue.code) === "22P02" || /invalid input syntax/i.test(text);
}

export function getSupabaseFriendlyErrorMessage(error: unknown, fallbackMessage: string) {
  const issue = toIssue(error);
  const normalized = normalizeText([issue.code, issue.message, issue.details, issue.hint].filter(Boolean).join(" "));

  if (isConnectionError(normalized)) {
    return CONNECTION_ERROR_MESSAGE;
  }

  if (isDatabaseRecoveryError(normalized)) {
    return RECOVERY_ERROR_MESSAGE;
  }

  if (isSchemaMismatchError(issue, normalized)) {
    return SCHEMA_MISMATCH_ERROR_MESSAGE;
  }

  if (isDuplicateError(issue, normalized)) {
    return DUPLICATE_ERROR_MESSAGE;
  }

  if (isInvalidInputError(issue, normalized)) {
    return INVALID_INPUT_ERROR_MESSAGE;
  }

  return fallbackMessage;
}

export function formatSupabaseErrorForLog(error: unknown) {
  const issue = toIssue(error);
  const parts = [
    issue.code ? `code=${String(issue.code)}` : null,
    issue.message ? `message=${issue.message}` : null,
    issue.details ? `details=${issue.details}` : null,
    issue.hint ? `hint=${issue.hint}` : null,
  ].filter(Boolean);

  return parts.join(" | ") || "unknown supabase error";
}

