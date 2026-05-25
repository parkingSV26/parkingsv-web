import type { DemoAccountKind } from "@/app/lib/auth/demo-accounts";

// Este estado vive aparte para que el formulario y la action compartan la misma forma de datos.
export type LoginFormState = {
  errorMessage: string;
  fieldErrors: {
    email?: string;
    password?: string;
  };
  redirectTarget: string;
  values: {
    email: string;
    password: string;
  };
  userType: DemoAccountKind | null;
};
