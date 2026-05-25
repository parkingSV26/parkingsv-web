export type DemoAccountKind = "customer" | "owner";

export type DemoAccountPreset = {
  description: string;
  email: string;
  fullName: string;
  id: number;
  password: string;
  profilePicture: string;
  quickAccessLabel: string;
  title: string;
  userType: DemoAccountKind;
};

// Estas cuentas sirven como semilla para probar recorridos completos sin autenticación real.
export const demoAccountPresets: Record<DemoAccountKind, DemoAccountPreset> = {
  customer: {
    id: 1010,
    userType: "customer",
    fullName: "Daniela Flores",
    email: "cliente@parkingsv.com",
    password: "Cliente123!",
    profilePicture: "/parkingsv/emely-marroquin-avatar.jpg",
    quickAccessLabel: "Cliente",
    title: "Cuenta cliente",
    description: "Pensada para revisar reservas, favoritos, notificaciones y perfil personal.",
  },
  owner: {
    id: 1515,
    userType: "owner",
    fullName: "Carlos Herrera",
    email: "propietario@parkingsv.com",
    password: "Propietario123!",
    profilePicture: "/parkingsv/emely-marroquin-avatar.jpg",
    quickAccessLabel: "Propietario",
    title: "Cuenta propietaria",
    description: "Preparada para gestionar publicaciones, reservas y configuracion del negocio.",
  },
};

export function getDemoAccountPreset(accountKind: DemoAccountKind) {
  return demoAccountPresets[accountKind];
}

export function getDemoAccountOptions() {
  return [demoAccountPresets.customer, demoAccountPresets.owner] as const;
}

export function findDemoAccountByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  return getDemoAccountOptions().find((account) => account.email === normalizedEmail) ?? null;
}

export function findDemoAccountByCredentials(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPassword = password.trim();

  return (
    getDemoAccountOptions().find(
      (account) =>
        account.email === normalizedEmail && account.password === normalizedPassword,
    ) ?? null
  );
}

export function parseDemoAccountKind(value: string | null | undefined): DemoAccountKind {
  return value === "owner" ? "owner" : "customer";
}

export function resolveDefaultRouteForUserType(userType: DemoAccountKind) {
  // Cada rol aterriza en la pantalla que mejor representa su caso de uso principal.
  return userType === "owner" ? "/mis-parqueos" : "/mis-reservas";
}
