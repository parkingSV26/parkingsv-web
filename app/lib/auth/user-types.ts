export type UserType = "customer" | "owner";

export function normalizeUserType(value: string | null | undefined): UserType {
  return value === "owner" ? "owner" : "customer";
}

export function resolveDefaultRouteForUserType(userType: UserType) {
  return userType === "owner" ? "/mis-parqueos" : "/mis-reservas";
}
