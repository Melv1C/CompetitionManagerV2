type ManagerAuthRedirect = "/" | "/login" | "/unauthorized";

export function getManagerAuthRedirect(
  pathname: string,
  hasSession: boolean,
  hasOrganization: boolean,
): ManagerAuthRedirect | null {
  const isPublicPage = pathname === "/login" || pathname === "/unauthorized";

  if (!hasSession && !isPublicPage) {
    return "/login";
  }

  if (hasSession && pathname === "/login") {
    return "/";
  }

  if (hasSession && !hasOrganization && !isPublicPage) {
    return "/unauthorized";
  }

  return null;
}
