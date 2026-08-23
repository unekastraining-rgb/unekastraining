export async function readJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();

  if (!text.trim()) {
    throw new Error(
      response.ok
        ? "The server returned an empty response."
        : `Request failed (${response.status}). Try refreshing the page.`,
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      response.ok
        ? "The server returned an unreadable response. Try again in a moment."
        : `Request failed (${response.status}). Try refreshing the page or signing in again.`,
    );
  }
}
