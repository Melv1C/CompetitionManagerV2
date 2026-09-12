import {
  apiErrorEnvelopeSchema,
  authSessionResponseSchema,
  type AuthSessionResponse,
  type AuthUser,
} from "@competition-manager/contracts";

export type AuthCredentials = {
  email: string;
  password: string;
};

export type AuthRegistration = AuthCredentials & {
  name: string;
};

export class AuthClientError extends Error {
  readonly code: string;
  readonly status: number;
  readonly requestId: string;

  constructor(message: string, status: number, code = "AUTH_REQUEST_FAILED", requestId = "") {
    super(message);
    this.name = "AuthClientError";
    this.code = code;
    this.status = status;
    this.requestId = requestId;
  }
}

export type SessionClient = {
  getSession(): Promise<AuthSessionResponse | null>;
  signIn(credentials: AuthCredentials): Promise<AuthSessionResponse | null>;
  signUp(registration: AuthRegistration): Promise<AuthSessionResponse | null>;
  signOut(): Promise<void>;
};

type AuthFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

async function responseError(response: Response): Promise<AuthClientError> {
  const body: unknown = await response.json().catch(() => null);
  const contract = (() => {
    try {
      return apiErrorEnvelopeSchema.parse(body).error;
    } catch {
      return null;
    }
  })();
  const native = body as { code?: string; message?: string } | null;
  return new AuthClientError(
    contract?.message ?? native?.message ?? "Authentication request failed",
    response.status,
    contract?.code ?? native?.code,
    contract?.requestId ?? response.headers.get("x-request-id") ?? "",
  );
}

export function createSessionClient(baseUrl: string, fetcher: AuthFetch = fetch): SessionClient {
  const endpoint = `${baseUrl.replace(/\/$/, "")}/api/auth`;

  async function request(path: string, init?: RequestInit): Promise<Response> {
    const headers = new Headers(init?.headers);
    headers.set("Content-Type", "application/json");
    const response = await fetcher(`${endpoint}${path}`, {
      ...init,
      credentials: "include",
      headers,
    });
    if (!response.ok) {
      throw await responseError(response);
    }
    return response;
  }

  async function getSession(): Promise<AuthSessionResponse | null> {
    const response = await request("/get-session", { method: "GET" });
    const body: unknown = await response.json();
    return body === null ? null : authSessionResponseSchema.parse(body);
  }

  return {
    getSession,
    async signIn(credentials) {
      await request("/sign-in/email", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
      return getSession();
    },
    async signUp(registration) {
      const { name, email, password } = registration;
      await request("/sign-up/email", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      return getSession();
    },
    async signOut() {
      await request("/sign-out", { method: "POST" });
    },
  };
}

export type { AuthSessionResponse, AuthUser };
