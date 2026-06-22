type RegisterUserType = "" | "customer" | "owner";

// Keep the form types separate so the action and the client share the same contract.
type RegisterFormValues = {
  date_of_birth: string;
  email: string;
  full_name: string;
  terms_accepted: boolean;
  user_type: RegisterUserType;
};

type RegisterFormErrors = {
  general?: string;
};

export type RegisterFormState = {
  errors: RegisterFormErrors;
  values: RegisterFormValues;
};
