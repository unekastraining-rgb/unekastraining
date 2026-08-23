/**
 * Moodle Web Services expect the site root (e.g. https://moodle.lsua.edu),
 * not deep links like /user/managetoken.php or /login/index.php.
 */
export function normalizeMoodleBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim();
  if (!trimmed) return trimmed;

  try {
    const parsed = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    return parsed.origin.replace(/\/$/, "");
  } catch {
    return trimmed.replace(/\/$/, "").replace(/\/[^/]+\.php.*$/i, "");
  }
}

export function moodleRestServerUrl(baseUrl: string): string {
  return `${normalizeMoodleBaseUrl(baseUrl)}/webservice/rest/server.php`;
}

export function moodleApiErrorMessage(status: number, baseUrl: string): string {
  const root = normalizeMoodleBaseUrl(baseUrl);
  if (status === 404) {
    return `Moodle API not found (404) at ${root}/webservice/rest/server.php. Web services may be disabled on your school's Moodle, or the site URL may need a subfolder (e.g. https://school.edu/moodle). Ask IT to enable Web services and the "Moodle mobile web service" external service.`;
  }
  if (status === 401 || status === 403) {
    return `Moodle rejected the request (${status}). Check that your Web Services token is valid and has not expired.`;
  }
  return `Moodle API error (${status}). Verify the site URL (${root}) and token.`;
}

export async function parseMoodleJsonResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();

  if (
    text.trimStart().startsWith("<!") ||
    text.trimStart().startsWith("<html") ||
    (!contentType.includes("json") && text.includes("<!DOCTYPE"))
  ) {
    throw new Error(
      "Moodle returned a web page instead of API data. Use your site root URL only (e.g. https://moodle.lsua.edu), not the token or login page. Confirm web services are enabled and your token is valid.",
    );
  }

  let data: T & { exception?: string; message?: string; errorcode?: string };
  try {
    data = JSON.parse(text) as T & { exception?: string; message?: string; errorcode?: string };
  } catch {
    throw new Error(
      "Moodle did not return valid JSON. Check the site URL (root only, e.g. https://moodle.lsua.edu) and your Web Services token.",
    );
  }

  if (data && typeof data === "object" && "exception" in data && data.exception) {
    throw new Error(data.message ?? data.exception);
  }

  return data;
}
