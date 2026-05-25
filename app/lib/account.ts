import "server-only";

import { db, type DatabaseRow } from "@/app/lib/db";

const DEFAULT_AVATAR = "/parkingsv/default-avatar.jpeg";
const LEGACY_UPLOAD_PREFIX = "/crud-php2/public/uploads/";

type AccountUserRow = DatabaseRow & {
  email: string;
  full_name: string;
  id: number;
  latitude: number | null;
  longitude: number | null;
  phone_number: string | null;
  profile_picture: string | null;
  user_type: "customer" | "owner";
};

type UserVehicleRow = DatabaseRow & {
  category_name: string;
  description: string;
  icon: string;
  id: number;
};

type VehicleOptionRow = DatabaseRow & {
  category_name: string;
  description: string;
  icon: string;
  id: number;
};

type UserSpecificationRow = DatabaseRow & {
  description: string;
  has_value: number;
  icon: string;
  id: number;
  name: string;
  value: string | null;
  value_label: string | null;
};

export type AccountVehicle = {
  categoryName: string;
  description: string;
  icon: string;
  id: number;
};

export type VehicleOption = {
  categoryName: string;
  description: string;
  icon: string;
  id: number;
};

export type AccountSpecification = {
  description: string;
  hasValue: boolean;
  icon: string;
  id: number;
  isActive: boolean;
  name: string;
  value: string;
  valueLabel: string | null;
};

export type AccountPageData = {
  allVehicleTypes: VehicleOption[];
  locationText: string;
  specifications: AccountSpecification[];
  user: {
    email: string;
    fullName: string;
    id: number;
    latitude: number | null;
    longitude: number | null;
    phoneNumber: string;
    profilePicture: string;
    userType: "customer" | "owner";
  };
  userVehicles: AccountVehicle[];
};

const DEMO_VEHICLE_OPTIONS: VehicleOption[] = [
  {
    categoryName: "Motocicletas",
    description: "Scooters, motocicletas estandar y grandes",
    icon: "motorcycle",
    id: 1,
  },
  {
    categoryName: "Autos Pequeños",
    description: "Sedanes compactos, hatchbacks y subcompactos",
    icon: "car",
    id: 2,
  },
  {
    categoryName: "Autos Medianos",
    description: "Sedanes familiares y crossovers pequeños",
    icon: "car-side",
    id: 3,
  },
  {
    categoryName: "Autos Grandes",
    description: "SUV medianas, minivans y sedanes ejecutivos",
    icon: "car-alt",
    id: 4,
  },
  {
    categoryName: "Pickups/Furgonetas",
    description: "Pickups pequeñas o grandes y furgonetas",
    icon: "truck-pickup",
    id: 5,
  },
  {
    categoryName: "Vehículos Comerciales",
    description: "Microbuses y buses pequeños",
    icon: "bus",
    id: 6,
  },
  {
    categoryName: "Vehículos Pesados",
    description: "Camiones de carga liviana y volquetas",
    icon: "truck",
    id: 7,
  },
  {
    categoryName: "Trailers/Remolques",
    description: "Remolques pequeños y semirremolques",
    icon: "trailer",
    id: 8,
  },
  {
    categoryName: "Bicicletas",
    description: "Bicis, triciclos y uniciclos",
    icon: "bicycle",
    id: 9,
  },
];

const DEMO_SPECIFICATIONS: AccountSpecification[] = [
  {
    description: "Personas con movilidad reducida",
    hasValue: false,
    icon: "wheelchair",
    id: 1,
    isActive: false,
    name: "Discapacitad@ a bordo",
    value: "",
    valueLabel: null,
  },
  {
    description: "Conductor de servicio de taxi",
    hasValue: false,
    icon: "taxi",
    id: 2,
    isActive: false,
    name: "Conductor/a de Taxi",
    value: "",
    valueLabel: null,
  },
  {
    description: "Mujeres embarazadas",
    hasValue: false,
    icon: "person-pregnant",
    id: 3,
    isActive: false,
    name: "Futura mama a bordo",
    value: "",
    valueLabel: null,
  },
  {
    description: "Transporta mascotas regularmente",
    hasValue: false,
    icon: "paw",
    id: 4,
    isActive: false,
    name: "Mascotas a bordo",
    value: "",
    valueLabel: null,
  },
  {
    description: "Vehículo con motorizacion eléctrica",
    hasValue: false,
    icon: "charging-station",
    id: 5,
    isActive: false,
    name: "Vehículo eléctrico",
    value: "",
    valueLabel: null,
  },
  {
    description: "Altura máxima del vehículo",
    hasValue: true,
    icon: "ruler-vertical",
    id: 6,
    isActive: false,
    name: "Altura del vehículo",
    value: "",
    valueLabel: "metros",
  },
];

export function resolveAccountProfilePicture(profilePicture: string | null) {
  if (!profilePicture) {
    return DEFAULT_AVATAR;
  }

  if (profilePicture.startsWith(LEGACY_UPLOAD_PREFIX)) {
    return `/legacy-assets/${profilePicture.slice(LEGACY_UPLOAD_PREFIX.length)}`;
  }

  if (profilePicture.startsWith("/crud-php2/assets/images/")) {
    return DEFAULT_AVATAR;
  }

  return profilePicture;
}

function mapVehicle(vehicle: UserVehicleRow | VehicleOptionRow): AccountVehicle {
  return {
    categoryName: vehicle.category_name,
    description: vehicle.description,
    icon: vehicle.icon,
    id: vehicle.id,
  };
}

function mapSpecification(specification: UserSpecificationRow): AccountSpecification {
  const value = specification.value?.trim() ?? "";

  return {
    description: specification.description,
    hasValue: Boolean(specification.has_value),
    icon: specification.icon,
    id: specification.id,
    isActive: value.length > 0 || specification.value === "0",
    name: specification.name,
    value,
    valueLabel: specification.value_label,
  };
}

function formatLocationText(latitude: number | null, longitude: number | null) {
  if (latitude === null || longitude === null) {
    return "No has compartido tu ubicación aún";
  }

  return `Lat: ${latitude}, Long: ${longitude}`;
}

export async function getAccountPageData(userId: number): Promise<AccountPageData | null> {
  const [userRows] = await db.execute<AccountUserRow[]>(
    `
      SELECT id, full_name, email, phone_number, profile_picture, user_type, latitude, longitude
      FROM users
      WHERE id = ?
      LIMIT 1
    `,
    [userId],
  );

  const user = userRows[0];

  if (!user) {
    return null;
  }

  const [vehicleRows, specificationRows, vehicleOptionRows] = await Promise.all([
    db.execute<UserVehicleRow[]>(
      `
        SELECT vt.id, vt.category_name, vt.icon, vt.description
        FROM user_vehicles uv
        JOIN vehicle_types vt ON uv.vehicle_type_id = vt.id
        WHERE uv.user_id = ?
        ORDER BY vt.id
      `,
      [userId],
    ),
    db.execute<UserSpecificationRow[]>(
      `
        SELECT ust.id, ust.name, ust.icon, ust.has_value, ust.value_label, ust.description, us.value
        FROM user_specification_types ust
        LEFT JOIN user_specifications us
          ON ust.id = us.specification_type_id
         AND us.user_id = ?
        ORDER BY ust.id
      `,
      [userId],
    ),
    db.execute<VehicleOptionRow[]>(
      `
        SELECT id, category_name, icon, description
        FROM vehicle_types
        ORDER BY id
      `,
    ),
  ]);

  const [userVehicles] = vehicleRows;
  const [specifications] = specificationRows;
  const [allVehicleTypes] = vehicleOptionRows;

  return {
    allVehicleTypes: allVehicleTypes.map(mapVehicle),
    locationText: formatLocationText(user.latitude, user.longitude),
    specifications: specifications.map(mapSpecification),
    user: {
      email: user.email,
      fullName: user.full_name,
      id: user.id,
      latitude: user.latitude,
      longitude: user.longitude,
      phoneNumber: user.phone_number?.trim() ?? "No registrado",
      profilePicture: resolveAccountProfilePicture(user.profile_picture),
      userType: user.user_type,
    },
    userVehicles: userVehicles.map(mapVehicle),
  };
}

export function createMockAccountPageData(user: {
  email: string;
  fullName: string;
  id: number;
  profilePicture: string;
  userType: "customer" | "owner";
}): AccountPageData {
  const primaryVehicle = user.userType === "owner" ? 5 : 2;
  const secondaryVehicle = user.userType === "owner" ? 7 : 3;

  return {
    allVehicleTypes: DEMO_VEHICLE_OPTIONS,
    locationText: "No has compartido tu ubicación aún",
    specifications: DEMO_SPECIFICATIONS.map((specification) => {
      if (specification.id === 4) {
        return {
          ...specification,
          isActive: user.userType === "customer",
        };
      }

      if (specification.id === 6) {
        return {
          ...specification,
          isActive: true,
          value: user.userType === "owner" ? "2.6" : "1.8",
        };
      }

      return specification;
    }),
    user: {
      email: user.email,
      fullName: user.fullName,
      id: user.id,
      latitude: null,
      longitude: null,
      phoneNumber: "0000-0000",
      profilePicture: user.profilePicture,
      userType: user.userType,
    },
    userVehicles: DEMO_VEHICLE_OPTIONS.filter((vehicle) =>
      [primaryVehicle, secondaryVehicle].includes(vehicle.id),
    ),
  };
}
