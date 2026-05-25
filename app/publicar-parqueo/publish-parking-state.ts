export const STATIC_PUBLISHED_PARKING_ID = "parqueo-espana";

// La publicación sigue en modo demo, pero este estado ya modela éxito, error y revisiones del formulario.
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
