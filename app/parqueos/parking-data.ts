export type ReservationFilter = "all" | "yes" | "no";

export type DayFilter =
  | ""
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type SpanishDay =
  | "domingo"
  | "lunes"
  | "martes"
  | "miercoles"
  | "jueves"
  | "viernes"
  | "sabado";

export type ScheduleSlot = {
  apertura: string;
  cierre: string;
};

export type ParkingService = {
  icon: string;
  value: string;
};

export type ParkingFee = {
  appliesTo: "all_week" | "weekdays" | "weekends";
  feeType: "evento" | "nocturno" | "normal" | "premium";
  icon: string;
  id: string;
  price: string;
  timeUnit: string;
  validFrom?: string | null;
  validTo?: string | null;
  vehicleType: string;
};

export type ParkingReview = {
  author: string;
  avatar: string;
  comment: string;
  createdAt: string;
  id: string;
  rating: number;
};

export type VehicleCapacity = {
  capacity: number;
  categoryName: string;
  icon: string;
  id: number;
  reservableCapacity: number;
};

export type Parking = {
  address: string;
  businessName: string;
  capacitySummary: {
    bicycle: number;
    disability: number;
    general: number;
    pregnant: number;
    reservable: number;
    taxi: number;
  };
  category: string;
  contact: {
    email: string;
    name: string;
    phone: string;
  };
  dbId: number;
  department: string;
  description: string;
  fees: ParkingFee[];
  id: string;
  image: string;
  images: string[];
  is24_7: boolean;
  location: {
    googleMapsEmbed: string;
    googleMapsLink: string;
    latitude: number;
    longitude: number;
    municipality: string;
    reference: string;
    streetAddress: string;
    wazeEmbed: string;
    wazeLink: string;
  };
  mainPrice: string;
  municipality: string;
  name: string;
  normalPrice: number;
  priceSummary: string;
  rating: number | null;
  reference: string;
  reservableSpaces: number;
  restrictions: {
    behavioral: string[];
    physical: {
      maxHeight: string;
      maxSpeed: string;
    };
  };
  reviews: ParkingReview[];
  schedule: Partial<Record<SpanishDay, ScheduleSlot[]>>;
  services: ParkingService[];
  vehicleCapacities: VehicleCapacity[];
};

export type ParkingFilters = {
  day: DayFilter;
  department: string;
  maxPrice: number;
  municipality: string;
  q: string;
  reservable: ReservationFilter;
};

export const DEFAULT_PARKING_FILTERS: ParkingFilters = {
  q: "",
  department: "",
  municipality: "",
  maxPrice: 50,
  reservable: "all",
  day: "",
};

export const dayOptions: Array<{ value: DayFilter; label: string }> = [
  { value: "", label: "Cualquier dia" },
  { value: "monday", label: "Lunes" },
  { value: "tuesday", label: "Martes" },
  { value: "wednesday", label: "Miercoles" },
  { value: "thursday", label: "Jueves" },
  { value: "friday", label: "Viernes" },
  { value: "saturday", label: "Sabado" },
  { value: "sunday", label: "Domingo" },
];

export const dayMap: Record<Exclude<DayFilter, "">, SpanishDay> = {
  monday: "lunes",
  tuesday: "martes",
  wednesday: "miercoles",
  thursday: "jueves",
  friday: "viernes",
  saturday: "sabado",
  sunday: "domingo",
};

export const parkingData: Parking[] = [
  {
    id: "parqueo-espana",
    dbId: 30,
    name: "Parqueo Espa\u00f1a",
    businessName: "Parqueo Espana",
    category: "historico",
    department: "San Salvador Centro",
    municipality: "San Salvador Centro",
    address: "Av. Espana 114",
    reference: "Sobre avenida Espana, junto a la Catedral Metropolitana en el Centro Historico.",
    description:
      "Parqueo amplio al aire libre, ubicado en una zona de alto movimiento peatonal del Centro Historico de San Salvador. Es una opcion practica para visitas a la Catedral Metropolitana, tramites, compras y recorridos por la Avenida Espana, con espacios marcados, acceso directo desde calle principal y vigilancia constante durante la jornada.",
    image: "/parkingsv/published/parqueo-espana-01.png",
    images: [
      "/parkingsv/published/parqueo-espana-01.png",
      "/parkingsv/published/parqueo-espana-02.png",
      "/parkingsv/published/parqueo-espana-03.png",
    ],
    schedule: {
      lunes: [{ apertura: "06:00", cierre: "22:00" }],
      martes: [{ apertura: "06:00", cierre: "22:00" }],
      miercoles: [{ apertura: "06:00", cierre: "22:00" }],
      jueves: [{ apertura: "06:00", cierre: "23:59" }],
      viernes: [{ apertura: "06:00", cierre: "23:59" }],
      sabado: [{ apertura: "06:00", cierre: "23:59" }],
      domingo: [{ apertura: "06:00", cierre: "21:00" }],
    },
    is24_7: false,
    rating: 4.8,
    normalPrice: 1,
    priceSummary: "Auto $1.50/h | Moto $1.00/h | Nocturno $4.50/noche",
    mainPrice: "$1.50/h",
    reservableSpaces: 10,
    capacitySummary: {
      general: 46,
      reservable: 10,
      disability: 2,
      pregnant: 1,
      taxi: 2,
      bicycle: 6,
    },
    services: [
      { icon: "fas fa-wheelchair", value: "Accesible" },
      { icon: "fas fa-shield-alt", value: "Vigilancia" },
      { icon: "fas fa-video", value: "Camaras" },
      { icon: "fas fa-soap", value: "Carwash" },
      { icon: "fas fa-restroom", value: "Sanitarios" },
    ],
    fees: [
      {
        id: "espana-auto",
        vehicleType: "Auto",
        icon: "car",
        price: "$1.50",
        feeType: "normal",
        timeUnit: "hora",
        appliesTo: "all_week",
      },
      {
        id: "espana-moto",
        vehicleType: "Motocicleta",
        icon: "motorcycle",
        price: "$1.00",
        feeType: "normal",
        timeUnit: "hora",
        appliesTo: "all_week",
      },
      {
        id: "espana-nocturno",
        vehicleType: "Nocturno",
        icon: "moon",
        price: "$4.50",
        feeType: "nocturno",
        timeUnit: "noche",
        appliesTo: "all_week",
      },
    ],
    contact: {
      name: "Administracion Parqueo Espana",
      phone: "7228-0118",
      email: "parqueoespana@parkingsv.com",
    },
    restrictions: {
      behavioral: ["no doble fila", "sin bloquear salidas", "sin musica alta", "sin ventas ambulantes"],
      physical: {
        maxHeight: "3.60",
        maxSpeed: "10",
      },
    },
    location: {
      municipality: "San Salvador Centro",
      streetAddress: "Av. Espana 114",
      reference: "Junto a la Catedral Metropolitana, con acceso rapido desde el Centro Historico.",
      latitude: 13.6984,
      longitude: -89.1912,
      googleMapsLink: "https://maps.google.com/?q=Parqueo+Espana,+Av.+Espana+114,+San+Salvador",
      googleMapsEmbed:
        "https://www.google.com/maps?q=Parqueo+Espana,+Av.+Espana+114,+San+Salvador&z=17&output=embed",
      wazeLink:
        "https://www.waze.com/es/live-map/directions/parqueo-espana-av.-espana-114-san-salvador?to=place.w.177471625.1774781786.13333635",
      wazeEmbed: "https://embed.waze.com/iframe?zoom=17&lat=13.6984&lon=-89.1912",
    },
    vehicleCapacities: [
      { id: 1, categoryName: "Motocicletas", icon: "motorcycle", capacity: 8, reservableCapacity: 2 },
      { id: 2, categoryName: "Autos Pequenos", icon: "car", capacity: 16, reservableCapacity: 3 },
      { id: 3, categoryName: "Autos Medianos", icon: "car-side", capacity: 14, reservableCapacity: 3 },
      { id: 5, categoryName: "Pickups", icon: "truck-pickup", capacity: 8, reservableCapacity: 2 },
      { id: 9, categoryName: "Bicicletas", icon: "bicycle", capacity: 6, reservableCapacity: 0 },
    ],
    reviews: [
      {
        id: "espana-review-1",
        author: "Gabriela Pineda",
        avatar: "/parkingsv/default-avatar.jpeg",
        rating: 5,
        comment: "Me sirvio bastante para ir al Centro Historico y la entrada se identifica rapido desde la avenida.",
        createdAt: "2026-05-08",
      },
      {
        id: "espana-review-2",
        author: "Ricardo Mejia",
        avatar: "/parkingsv/default-avatar.jpeg",
        rating: 5,
        comment: "Los espacios estan bien marcados y la ubicacion junto a la Catedral lo vuelve bien comodo para visitas y tramites.",
        createdAt: "2026-05-12",
      },
      {
        id: "espana-review-3",
        author: "Veronica Ayala",
        avatar: "/parkingsv/default-avatar.jpeg",
        rating: 4,
        comment: "En la tarde hay buen movimiento, pero se siente ordenado y con vigilancia visible.",
        createdAt: "2026-05-17",
      },
    ],
  },
  {
    id: "parqueo-centro-ilopango",
    dbId: 32,
    name: "Parqueo Pasaje La Laguna",
    businessName: "La Laguna Parking",
    category: "turistico",
    department: "San Salvador Norte",
    municipality: "Ilopango",
    address: "Pasaje 3, zona residencial",
    reference: "Con acceso frente a comercios y una zona de hospedaje",
    description:
      "Parqueo amplio al aire libre, con espacios bien marcados, carriles de circulacion claros y un acceso comodo para visitas cortas o estancias mas largas. La zona combina area abierta, entorno arbolado y frente de acceso ordenado cerca de comercios y hospedaje.",
    image: "/parkingsv/published/laguna-02.webp",
    images: [
      "/parkingsv/published/laguna-02.webp",
      "/parkingsv/published/laguna-01.webp",
      "/parkingsv/published/laguna-03.webp",
    ],
    schedule: {
      lunes: [
        { apertura: "07:00", cierre: "09:00" },
        { apertura: "12:00", cierre: "17:00" },
      ],
      martes: [{ apertura: "07:00", cierre: "17:00" }],
      miercoles: [{ apertura: "07:00", cierre: "17:00" }],
      jueves: [{ apertura: "07:00", cierre: "17:00" }],
      viernes: [{ apertura: "07:00", cierre: "18:00" }],
      sabado: [{ apertura: "08:00", cierre: "19:00" }],
      domingo: [{ apertura: "08:00", cierre: "18:00" }],
    },
    is24_7: true,
    rating: null,
    normalPrice: 0.5,
    priceSummary: "Auto $0.75/h | Moto $0.50/h | Mensual $22",
    mainPrice: "$0.75/h",
    reservableSpaces: 0,
    capacitySummary: {
      general: 28,
      reservable: 0,
      disability: 1,
      pregnant: 1,
      taxi: 0,
      bicycle: 3,
    },
    services: [
      { icon: "fas fa-restroom", value: "Sanitarios" },
      { icon: "fas fa-wheelchair", value: "Accesible" },
      { icon: "fas fa-shield-alt", value: "Vigilancia" },
      { icon: "fas fa-people-roof", value: "Area techada parcial" },
    ],
    fees: [
      {
        id: "ilopango-auto",
        vehicleType: "Auto",
        icon: "car",
        price: "$0.75",
        feeType: "normal",
        timeUnit: "hora",
        appliesTo: "all_week",
      },
      {
        id: "ilopango-moto",
        vehicleType: "Motocicleta",
        icon: "motorcycle",
        price: "$0.50",
        feeType: "normal",
        timeUnit: "hora",
        appliesTo: "weekdays",
      },
      {
        id: "ilopango-mensual",
        vehicleType: "Mensual",
        icon: "calendar-days",
        price: "$22.00",
        feeType: "nocturno",
        timeUnit: "mes",
        appliesTo: "all_week",
      },
    ],
    contact: {
      name: "Fernando Quintanilla",
      phone: "7654-8891",
      email: "lalaguna@parkingsv.com",
    },
    restrictions: {
      behavioral: ["no musica alta", "sin basura", "sin maniobras riesgosas"],
      physical: {
        maxHeight: "2.20",
        maxSpeed: "15",
      },
    },
    location: {
      municipality: "Ilopango",
      streetAddress: "Pasaje 3, zona residencial",
      reference: "Con acceso frente a comercios y una zona de hospedaje",
      latitude: 13.7074,
      longitude: -89.1123,
      googleMapsLink: "https://maps.google.com/?q=13.7074,-89.1123",
      googleMapsEmbed: "https://www.google.com/maps?q=13.7074,-89.1123&z=16&output=embed",
      wazeLink: "https://waze.com/ul?ll=13.7074,-89.1123&navigate=yes",
      wazeEmbed: "https://embed.waze.com/iframe?zoom=16&lat=13.7074&lon=-89.1123",
    },
    vehicleCapacities: [
      { id: 1, categoryName: "Motocicletas", icon: "motorcycle", capacity: 6, reservableCapacity: 0 },
      { id: 2, categoryName: "Autos Pequenos", icon: "car", capacity: 10, reservableCapacity: 0 },
      { id: 3, categoryName: "Autos Medianos", icon: "car-side", capacity: 9, reservableCapacity: 0 },
      { id: 9, categoryName: "Bicicletas", icon: "bicycle", capacity: 3, reservableCapacity: 0 },
    ],
    reviews: [],
  },
  {
    id: "parqueo-morazan",
    dbId: 33,
    name: "Parqueo 24H",
    businessName: "Parqueo 24H",
    category: "historico",
    department: "San Salvador Centro",
    municipality: "San Salvador Centro",
    address: "Zona Centro, acceso por calle de alto flujo",
    reference: "Entrada con porton negro, lote cercado e iluminado junto a locales comerciales.",
    description:
      "Parqueo urbano de formato abierto, con cierre perimetral, porton amplio e iluminacion nocturna marcada para facilitar el ingreso y la salida. Funciona bien para visitas al Centro Historico, diligencias en horas de la noche y estancias cortas o medias cerca de comercios y servicios de la zona.",
    image: "/parkingsv/published/parqueo-portalito-01.png",
    images: [
      "/parkingsv/published/parqueo-portalito-01.png",
      "/parkingsv/published/parqueo-portalito-02.png",
    ],
    schedule: {
      lunes: [{ apertura: "06:00", cierre: "23:00" }],
      martes: [{ apertura: "06:00", cierre: "23:00" }],
      miercoles: [{ apertura: "06:00", cierre: "23:00" }],
      jueves: [{ apertura: "06:00", cierre: "23:30" }],
      viernes: [{ apertura: "06:00", cierre: "23:59" }],
      sabado: [{ apertura: "06:00", cierre: "23:59" }],
      domingo: [{ apertura: "07:00", cierre: "22:00" }],
    },
    is24_7: false,
    rating: 4.4,
    normalPrice: 0.75,
    priceSummary: "Auto $1.00/h | Moto $0.75/h | Nocturno $3.50/noche",
    mainPrice: "$1.00/h",
    reservableSpaces: 0,
    capacitySummary: {
      general: 22,
      reservable: 0,
      disability: 0,
      pregnant: 0,
      taxi: 1,
      bicycle: 2,
    },
    services: [
      { icon: "fas fa-shield-alt", value: "Vigilancia" },
      { icon: "fas fa-lightbulb", value: "Iluminacion nocturna" },
      { icon: "fas fa-restroom", value: "Sanitarios" },
      { icon: "fas fa-video", value: "Camaras" },
      { icon: "fas fa-warehouse", value: "Lote cercado" },
      { icon: "fas fa-store", value: "Locales cercanos" },
    ],
    fees: [
      {
        id: "morazan-auto",
        vehicleType: "Auto",
        icon: "car-side",
        price: "$1.00",
        feeType: "normal",
        timeUnit: "hora",
        appliesTo: "all_week",
      },
      {
        id: "morazan-moto",
        vehicleType: "Motocicleta",
        icon: "motorcycle",
        price: "$0.75",
        feeType: "normal",
        timeUnit: "hora",
        appliesTo: "all_week",
      },
      {
        id: "morazan-nocturno",
        vehicleType: "Nocturno",
        icon: "moon",
        price: "$3.50",
        feeType: "nocturno",
        timeUnit: "noche",
        appliesTo: "all_week",
      },
    ],
    contact: {
      name: "Encargado Parqueo 24H",
      phone: "7615-2048",
      email: "parqueo24h@parkingsv.com",
    },
    restrictions: {
      behavioral: ["sin doble fila", "no dejar musica encendida", "sin bloquear el porton", "sin maniobras riesgosas"],
      physical: {
        maxHeight: "3.20",
        maxSpeed: "10",
      },
    },
    location: {
      municipality: "San Salvador Centro",
      streetAddress: "Zona Centro, acceso por calle de alto flujo",
      reference: "Entrada con porton negro, cerca de locales y con iluminacion visible desde la calle.",
      latitude: 13.6979,
      longitude: -89.1893,
      googleMapsLink: "https://maps.google.com/?q=13.6979,-89.1893",
      googleMapsEmbed: "https://www.google.com/maps?q=13.6979,-89.1893&z=16&output=embed",
      wazeLink: "https://waze.com/ul?ll=13.6979,-89.1893&navigate=yes",
      wazeEmbed: "https://embed.waze.com/iframe?zoom=16&lat=13.6979&lon=-89.1893",
    },
    vehicleCapacities: [
      { id: 1, categoryName: "Motocicletas", icon: "motorcycle", capacity: 4, reservableCapacity: 0 },
      { id: 2, categoryName: "Autos Pequenos", icon: "car", capacity: 8, reservableCapacity: 0 },
      { id: 3, categoryName: "Autos Medianos", icon: "car-side", capacity: 7, reservableCapacity: 0 },
      { id: 5, categoryName: "Pickups", icon: "truck-pickup", capacity: 3, reservableCapacity: 0 },
      { id: 9, categoryName: "Bicicletas", icon: "bicycle", capacity: 2, reservableCapacity: 0 },
    ],
    reviews: [
      {
        id: "morazan-review-1",
        author: "Luis Ortiz",
        avatar: "/parkingsv/default-avatar.jpeg",
        rating: 4,
        comment: "La entrada se distingue facil en la noche y el lote se siente bien iluminado.",
        createdAt: "2026-05-06",
      },
      {
        id: "morazan-review-2",
        author: "Ana Corea",
        avatar: "/parkingsv/default-avatar.jpeg",
        rating: 5,
        comment: "Me gusto que tenga sanitarios y que la salida sea comoda aun cuando hay movimiento en la zona.",
        createdAt: "2026-05-11",
      },
      {
        id: "morazan-review-3",
        author: "Dennis Marquez",
        avatar: "/parkingsv/default-avatar.jpeg",
        rating: 5,
        comment: "Buen parqueo para dejar el carro por la tarde o de noche, con vigilancia visible y acceso sencillo.",
        createdAt: "2026-05-18",
      },
    ],
  },
  {
    id: "parqueo-galerias",
    dbId: 34,
    name: "Parqueo Compras de El Salvador",
    businessName: "Compras de El Salvador Parking",
    category: "comercial",
    department: "San Salvador Centro",
    municipality: "San Salvador Centro",
    address: "Zona comercial con acceso directo desde calle principal",
    reference: "Entrada amplia con rotulo de parqueo, arboles al frente y espacio para autos y pickups.",
    description:
      "Parqueo comercial de formato abierto, con ingreso amplio desde la calle y circulacion sencilla para autos, pickups y vehiculos de reparto. El espacio combina zonas de concreto y tierra compactada, con sombra natural en parte del lote y una distribucion practica para visitas de compras, entregas y diligencias en la zona.",
    image: "/parkingsv/published/parqueo-compras-01.png",
    images: [
      "/parkingsv/published/parqueo-compras-01.png",
      "/parkingsv/published/parqueo-compras-02.png",
    ],
    schedule: {
      lunes: [{ apertura: "06:30", cierre: "18:30" }],
      martes: [{ apertura: "06:30", cierre: "18:30" }],
      miercoles: [{ apertura: "06:30", cierre: "18:30" }],
      jueves: [{ apertura: "06:30", cierre: "18:30" }],
      viernes: [{ apertura: "06:30", cierre: "19:00" }],
      sabado: [{ apertura: "07:00", cierre: "18:00" }],
      domingo: [{ apertura: "08:00", cierre: "15:00" }],
    },
    is24_7: false,
    rating: 4.3,
    normalPrice: 0.75,
    priceSummary: "Auto $1.00/h | Moto $0.75/h | Pickup $2.00/h",
    mainPrice: "$1.00/h",
    reservableSpaces: 3,
    capacitySummary: {
      general: 26,
      reservable: 3,
      disability: 0,
      pregnant: 0,
      taxi: 0,
      bicycle: 2,
    },
    services: [
      { icon: "fas fa-shield-alt", value: "Vigilancia" },
      { icon: "fas fa-tree", value: "Sombra natural" },
      { icon: "fas fa-truck-ramp-box", value: "Acceso para pickups" },
      { icon: "fas fa-store", value: "Zona comercial" },
      { icon: "fas fa-road", value: "Ingreso amplio" },
    ],
    fees: [
      {
        id: "galerias-auto",
        vehicleType: "Auto",
        icon: "car",
        price: "$1.00",
        feeType: "normal",
        timeUnit: "hora",
        appliesTo: "all_week",
      },
      {
        id: "galerias-moto",
        vehicleType: "Motocicleta",
        icon: "motorcycle",
        price: "$0.75",
        feeType: "normal",
        timeUnit: "hora",
        appliesTo: "all_week",
      },
      {
        id: "galerias-pickup",
        vehicleType: "Pickup",
        icon: "truck-pickup",
        price: "$2.00",
        feeType: "normal",
        timeUnit: "hora",
        appliesTo: "all_week",
      },
    ],
    contact: {
      name: "Administracion Compras de El Salvador",
      phone: "7224-6031",
      email: "compraselsalvador@parkingsv.com",
    },
    restrictions: {
      behavioral: ["sin bloquear la entrada", "no dejar vehiculos mal alineados", "sin maniobras riesgosas"],
      physical: {
        maxHeight: "3.40",
        maxSpeed: "15",
      },
    },
    location: {
      municipality: "San Salvador Centro",
      streetAddress: "Zona comercial con acceso directo desde calle principal",
      reference: "Entrada amplia con rotulo de parqueo y patio con espacio para autos y pickups.",
      latitude: 13.7038,
      longitude: -89.2015,
      googleMapsLink: "https://maps.google.com/?q=13.7038,-89.2015",
      googleMapsEmbed: "https://www.google.com/maps?q=13.7038,-89.2015&z=16&output=embed",
      wazeLink: "https://waze.com/ul?ll=13.7038,-89.2015&navigate=yes",
      wazeEmbed: "https://embed.waze.com/iframe?zoom=16&lat=13.7038&lon=-89.2015",
    },
    vehicleCapacities: [
      { id: 1, categoryName: "Motocicletas", icon: "motorcycle", capacity: 5, reservableCapacity: 0 },
      { id: 2, categoryName: "Autos Pequenos", icon: "car", capacity: 9, reservableCapacity: 1 },
      { id: 3, categoryName: "Autos Medianos", icon: "car-side", capacity: 8, reservableCapacity: 1 },
      { id: 5, categoryName: "Pickups", icon: "truck-pickup", capacity: 4, reservableCapacity: 1 },
      { id: 9, categoryName: "Bicicletas", icon: "bicycle", capacity: 2, reservableCapacity: 0 },
    ],
    reviews: [
      {
        id: "galerias-review-1",
        author: "Sofia Hernandez",
        avatar: "/parkingsv/default-avatar.jpeg",
        rating: 4,
        comment: "La entrada es amplia y me sirvio para dejar el carro mientras hacia compras rapidas en la zona.",
        createdAt: "2026-05-09",
      },
      {
        id: "galerias-review-2",
        author: "Rene Castillo",
        avatar: "/parkingsv/default-avatar.jpeg",
        rating: 4,
        comment: "Se siente practico para pickups y carros medianos, aunque al mediodia se llena un poco.",
        createdAt: "2026-05-14",
      },
      {
        id: "galerias-review-3",
        author: "Claudia Rivera",
        avatar: "/parkingsv/default-avatar.jpeg",
        rating: 5,
        comment: "Buen punto para compras y entregas cortas, con acceso facil desde la calle principal.",
        createdAt: "2026-05-18",
      },
    ],
  },
  {
    id: "parqueo-san-jose-centro",
    dbId: 35,
    name: "Parqueo San Jos\u00e9 Centro de San Salvador",
    businessName: "Parqueo San Jose",
    category: "historico",
    department: "San Salvador Centro",
    municipality: "San Salvador Centro",
    address: "125 8a Calle Poniente",
    reference:
      "Ingreso con barrera automatica, caseta de control y acceso principal en plena zona centro.",
    description:
      "Parqueo amplio de superficie, con caseta de entrada, barrera automatica y circulacion sencilla dentro del lote. Las imagenes muestran un espacio adoquinado y abierto, con zonas para autos, pickups y motocicletas, pensado para visitas al Centro de San Salvador, tramites, compras y jornadas de trabajo en horarios comerciales.",
    image: "/parkingsv/published/parqueo-san-jose-01.png",
    images: [
      "/parkingsv/published/parqueo-san-jose-01.png",
      "/parkingsv/published/parqueo-san-jose-02.png",
      "/parkingsv/published/parqueo-san-jose-03.png",
    ],
    schedule: {
      lunes: [{ apertura: "06:30", cierre: "19:00" }],
      martes: [{ apertura: "06:30", cierre: "19:00" }],
      miercoles: [{ apertura: "06:30", cierre: "19:00" }],
      jueves: [{ apertura: "06:30", cierre: "19:00" }],
      viernes: [{ apertura: "06:30", cierre: "19:00" }],
      sabado: [{ apertura: "06:30", cierre: "19:00" }],
      domingo: [{ apertura: "06:30", cierre: "17:00" }],
    },
    is24_7: false,
    rating: 4.7,
    normalPrice: 0.75,
    priceSummary: "Fraccion $0.75/h | Dia $3.00 + IVA | Mes $60.00 + IVA",
    mainPrice: "$0.75/h",
    reservableSpaces: 0,
    capacitySummary: {
      general: 38,
      reservable: 0,
      disability: 1,
      pregnant: 0,
      taxi: 1,
      bicycle: 3,
    },
    services: [
      { icon: "fas fa-shield-alt", value: "Vigilancia" },
      { icon: "fas fa-road-barrier", value: "Barrera automatica" },
      { icon: "fas fa-bell", value: "Alarma" },
      { icon: "fas fa-motorcycle", value: "Acceso para motos" },
      { icon: "fas fa-square-parking", value: "Espacios marcados" },
    ],
    fees: [
      {
        id: "san-jose-fraccion",
        vehicleType: "Fraccion",
        icon: "clock",
        price: "$0.75",
        feeType: "normal",
        timeUnit: "hora",
        appliesTo: "all_week",
      },
      {
        id: "san-jose-dia",
        vehicleType: "Estadia diaria",
        icon: "sun",
        price: "$3.00 + IVA",
        feeType: "normal",
        timeUnit: "dia",
        appliesTo: "all_week",
      },
      {
        id: "san-jose-mensual",
        vehicleType: "Mensual",
        icon: "calendar-days",
        price: "$60.00 + IVA",
        feeType: "premium",
        timeUnit: "mes",
        appliesTo: "all_week",
      },
    ],
    contact: {
      name: "Administracion Parqueo San Jose",
      phone: "7308-8211",
      email: "parqueosanjose@parkingsv.com",
    },
    restrictions: {
      behavioral: [
        "sin bloquear la barrera",
        "no estacionar fuera de linea",
        "respetar instrucciones del personal",
      ],
      physical: {
        maxHeight: "3.40",
        maxSpeed: "10",
      },
    },
    location: {
      municipality: "San Salvador Centro",
      streetAddress: "125 8a Calle Poniente",
      reference:
        "Acceso principal con barrera automatica y caseta, dentro de la zona centro de San Salvador.",
      latitude: 13.6981,
      longitude: -89.1914,
      googleMapsLink: "https://maps.google.com/?q=125+8a+Calle+Poniente,+San+Salvador",
      googleMapsEmbed:
        "https://www.google.com/maps?q=125+8a+Calle+Poniente,+San+Salvador&z=16&output=embed",
      wazeLink: "https://waze.com/ul?ll=13.6981,-89.1914&navigate=yes",
      wazeEmbed: "https://embed.waze.com/iframe?zoom=16&lat=13.6981&lon=-89.1914",
    },
    vehicleCapacities: [
      { id: 1, categoryName: "Motocicletas", icon: "motorcycle", capacity: 6, reservableCapacity: 0 },
      { id: 2, categoryName: "Autos Pequenos", icon: "car", capacity: 12, reservableCapacity: 0 },
      { id: 3, categoryName: "Autos Medianos", icon: "car-side", capacity: 10, reservableCapacity: 0 },
      { id: 5, categoryName: "Pickups", icon: "truck-pickup", capacity: 7, reservableCapacity: 0 },
      { id: 9, categoryName: "Bicicletas", icon: "bicycle", capacity: 3, reservableCapacity: 0 },
    ],
    reviews: [
      {
        id: "san-jose-review-1",
        author: "Marta Flores",
        avatar: "/parkingsv/default-avatar.jpeg",
        rating: 5,
        comment: "La entrada con barrera hace que el acceso se vea ordenado y rapido para diligencias en el centro.",
        createdAt: "2026-05-10",
      },
      {
        id: "san-jose-review-2",
        author: "Nelson Diaz",
        avatar: "/parkingsv/default-avatar.jpeg",
        rating: 4,
        comment: "Buen espacio para dejar el carro unas horas y caminar por la zona comercial sin complicarse.",
        createdAt: "2026-05-14",
      },
      {
        id: "san-jose-review-3",
        author: "Roxana Mena",
        avatar: "/parkingsv/default-avatar.jpeg",
        rating: 5,
        comment: "Se siente amplio y las tarifas del rotulo son claras, sobre todo para estancia diaria.",
        createdAt: "2026-05-18",
      },
    ],
  },
  {
    id: "parqueo-plaza-comercial-libertad",
    dbId: 36,
    name: "Parqueo Plaza Comercial Libertad",
    businessName: "Plaza Comercial Libertad Parking",
    category: "subterraneo",
    department: "San Salvador Centro",
    municipality: "San Salvador Centro",
    address: "4a Calle Oriente, zona Plaza Libertad",
    reference:
      "Entrada techada con barrera automatica, caseta de ticket y acceso vehicular dentro del centro de San Salvador.",
    description:
      "Parqueo cubierto de estilo comercial, con entrada controlada por ticket, barrera automatica y circulacion interna de un solo sentido. Las imagenes muestran un espacio interior amplio, con rampa de conexion entre niveles, iluminacion artificial constante y espacios marcados para autos en una zona de alto movimiento peatonal y comercial.",
    image: "/parkingsv/published/parqueo-libertad-02.png",
    images: [
      "/parkingsv/published/parqueo-libertad-02.png",
      "/parkingsv/published/parqueo-libertad-01.png",
    ],
    schedule: {
      lunes: [{ apertura: "07:00", cierre: "19:00" }],
      martes: [{ apertura: "07:00", cierre: "19:00" }],
      miercoles: [{ apertura: "07:00", cierre: "19:00" }],
      jueves: [{ apertura: "07:00", cierre: "19:00" }],
      viernes: [{ apertura: "07:00", cierre: "19:00" }],
      sabado: [{ apertura: "07:00", cierre: "19:00" }],
      domingo: [{ apertura: "07:00", cierre: "19:00" }],
    },
    is24_7: false,
    rating: 4.5,
    normalPrice: 1,
    priceSummary: "Auto $1.00 hora o fraccion",
    mainPrice: "$1.00/h",
    reservableSpaces: 0,
    capacitySummary: {
      general: 32,
      reservable: 0,
      disability: 1,
      pregnant: 0,
      taxi: 0,
      bicycle: 0,
    },
    services: [
      { icon: "fas fa-ticket", value: "Ticket de ingreso" },
      { icon: "fas fa-road-barrier", value: "Barrera automatica" },
      { icon: "fas fa-people-roof", value: "Cubierto" },
      { icon: "fas fa-lightbulb", value: "Iluminacion interior" },
      { icon: "fas fa-arrow-right-arrow-left", value: "Circulacion interna" },
    ],
    fees: [
      {
        id: "libertad-auto",
        vehicleType: "Auto",
        icon: "car",
        price: "$1.00",
        feeType: "normal",
        timeUnit: "hora",
        appliesTo: "all_week",
      },
    ],
    contact: {
      name: "Administracion Plaza Comercial Libertad",
      phone: "7210-4458",
      email: "plazalibertad@parkingsv.com",
    },
    restrictions: {
      behavioral: [
        "respetar el sentido de circulacion",
        "sin reversa contra flujo",
        "no bloquear la rampa",
        "conservar el ticket de ingreso",
      ],
      physical: {
        maxHeight: "2.10",
        maxSpeed: "10",
      },
    },
    location: {
      municipality: "San Salvador Centro",
      streetAddress: "4a Calle Oriente, zona Plaza Libertad",
      reference:
        "Ingreso dentro de Plaza Comercial Libertad, cerca de la Plaza Libertad en el Centro Historico.",
      latitude: 13.6974,
      longitude: -89.189,
      googleMapsLink: "https://maps.google.com/?q=Plaza+Comercial+Libertad,+San+Salvador",
      googleMapsEmbed:
        "https://www.google.com/maps?q=Plaza+Comercial+Libertad,+San+Salvador&z=17&output=embed",
      wazeLink: "https://www.waze.com/live-map/directions/plaza-comercial-libertad-san-salvador",
      wazeEmbed: "https://embed.waze.com/iframe?zoom=17&lat=13.6974&lon=-89.1890",
    },
    vehicleCapacities: [
      { id: 2, categoryName: "Autos Pequenos", icon: "car", capacity: 12, reservableCapacity: 0 },
      { id: 3, categoryName: "Autos Medianos", icon: "car-side", capacity: 12, reservableCapacity: 0 },
      { id: 5, categoryName: "Pickups", icon: "truck-pickup", capacity: 8, reservableCapacity: 0 },
    ],
    reviews: [
      {
        id: "libertad-review-1",
        author: "Kevin Salazar",
        avatar: "/parkingsv/default-avatar.jpeg",
        rating: 5,
        comment: "La entrada con ticket es rapida y adentro se siente ordenado para moverse entre niveles.",
        createdAt: "2026-05-11",
      },
      {
        id: "libertad-review-2",
        author: "Andrea Mejia",
        avatar: "/parkingsv/default-avatar.jpeg",
        rating: 4,
        comment: "Buen parqueo para hacer compras en el centro, con techo e iluminacion suficiente.",
        createdAt: "2026-05-15",
      },
      {
        id: "libertad-review-3",
        author: "Oscar Ramirez",
        avatar: "/parkingsv/default-avatar.jpeg",
        rating: 4,
        comment: "La rampa y el sentido de circulacion se entienden bien, aunque en horas pico toca entrar con paciencia.",
        createdAt: "2026-05-18",
      },
    ],
  },
];

export function getParkingBySlug(slug: string) {
  return parkingData.find((parking) => parking.id === slug) ?? null;
}
