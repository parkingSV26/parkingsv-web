type RegisterUserType = "" | "customer" | "owner";

// Separamos los tipos del formulario para que la action y el cliente hablen el mismo idioma.
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
