const API_BASE_URL = 'http://localhost:8080';

export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, options);

  if (!response.ok) {
    const message = await getErrorMessage(response);
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function uploadRequest<T>(path: string, formData: FormData): Promise<T> {
  return apiRequest<T>(path, {
    method: 'POST',
    body: formData
  });
}

async function getErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    return body.message || body.error || `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
}
