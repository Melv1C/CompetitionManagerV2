type AuthRedirect = "/" | "/login";

export function getAuthRedirect(
  pathname: string,
  hasSession: boolean,
  authPaths: readonly string[],
): AuthRedirect | null {
  const isAuthPage = authPaths.includes(pathname);

  if (!hasSession && !isAuthPage) {
    return "/login";
  }

  if (hasSession && isAuthPage) {
    return "/";
  }

  return null;
}
