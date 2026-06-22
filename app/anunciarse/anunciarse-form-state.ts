export type AnunciarseFormState = {
  errorMessage: string;
  fieldErrors: Partial<{
    budgetRange: string;
    businessName: string;
    campaignGoal: string;
    category: string;
    description: string;
    preferredContact: string;
    termsAccepted: string;
    websiteOrSocial: string;
  }>;
  successMessage: string;
};

export const initialAnunciarseFormState: AnunciarseFormState = {
  errorMessage: "",
  fieldErrors: {},
  successMessage: "",
};
