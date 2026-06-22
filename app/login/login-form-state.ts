import type { UserType } from "@/app/lib/auth/user-types";

// Keep this state separate so the form and the action share the same data shape.
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
