import type { UserType } from "@/app/lib/auth/user-types";

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
  userType: UserType | null;
};
