export type PublishParkingCategory = {
  description: string;
  icon: string;
  id: number;
  name: string;
};

export type PublishParkingService = {
  icon: string;
  id: number;
  name: string;
};

export type PublishParkingRestriction = {
  id: number;
  name: string;
};

export type PublishParkingVehicleType = {
  categoryKey: string;
  categoryName: string;
  description: string;
  icon: string;
  id: number;
};

export type PublishParkingCatalog = {
  categories: PublishParkingCategory[];
  restrictions: PublishParkingRestriction[];
  services: PublishParkingService[];
  vehicleTypes: PublishParkingVehicleType[];
};
