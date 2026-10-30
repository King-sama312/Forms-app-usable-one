type ApiFetchOptions = Omit<RequestInit, "body"> & { body?: unknown };

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

let refreshPromise: Promise<void> | null = null;

function refreshSession(): Promise<void> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "include",
  })
    .then(async (res) => {
      if (!res.ok) {
        const errorMessage = await getErrorMessage(res);
        throw new ApiError(res.status, errorMessage);
      }
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

async function getErrorMessage(response: Response): Promise<string> {
  try {
    const data = await response.json();
    return data.message ?? "Request failed";
  } catch {
    return "Request failed";
  }
}

export async function apiFetch<T>(
  url: string,
  options?: ApiFetchOptions,
): Promise<T> {
  const { body, ...rest } = options ?? {};
  const headers = new Headers(rest.headers);
  let jsonBody: string | undefined;
  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
    jsonBody = JSON.stringify(body);
  }

  const isAuthRoute =
    url.includes("/auth/login") ||
    url.includes("/auth/register") ||
    url.includes("/auth/refresh");

  function sendRequest() {
    return fetch(url, {
      ...rest,
      headers,
      body: jsonBody,
      credentials: "include",
    });
  }

  let result = await sendRequest();

  if (!isAuthRoute && result.status === 401) {
    await refreshSession();
    result = await sendRequest();
  }

  if (!result.ok) {
    const errorMessage = await getErrorMessage(result);
    throw new ApiError(result.status, errorMessage);
  }
  if (result.status === 204) {
    return undefined as T;
  }
  const data = (await result.json()) as T;
  return data;
}
