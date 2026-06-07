export type PublishParkingState = {
  errorMessage: string;
  publishedParkingId: string | null;
  revision: number;
  successMessage: string;
};

export const initialPublishParkingState: PublishParkingState = {
  errorMessage: "",
  publishedParkingId: null,
  revision: 0,
  successMessage: "",
};
