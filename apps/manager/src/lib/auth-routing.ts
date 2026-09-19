type ManagerAuthRedirect = "/" | "/login" | "/unauthorized";

export function getManagerAuthRedirect(
  pathname: string,
  hasSession: boolean,
  isEmailVerified: boolean,
  hasOrganization: boolean,
): ManagerAuthRedirect | null {
  const isPublicPage = pathname === "/login" || pathname === "/unauthorized";

  if (!hasSession && !isPublicPage) {
    return "/login";
  }

  if (pathname === "/unauthorized") {
    return null;
  }

  const hasManagerAccess = isEmailVerified && hasOrganization;

  if (hasSession && pathname === "/login") {
    return hasManagerAccess ? "/" : "/unauthorized";
  }

  if (hasSession && !hasManagerAccess) {
    return "/unauthorized";
  }

  return null;
}
