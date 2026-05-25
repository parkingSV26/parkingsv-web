// El formulario de verificación usa este contrato tanto al validar código como al reenviarlo.
export type VerifyEmailState = {
  codeError: string;
  generalError: string;
  isExpired: boolean;
  remainingAttempts: number;
  resendSuccess: string;
  revision: number;
  success: boolean;
};
