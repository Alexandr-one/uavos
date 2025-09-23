import Cookies from 'js-cookie';
import { ContentCreateDto } from '@uavos/shared-types';

// -----------------------
// API helper
// -----------------------
async function request(url: string, options: RequestInit) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

// -----------------------
// Create Content
// -----------------------
export async function createContent(dto: ContentCreateDto, apiUrl: string) {
  const storedToken = Cookies.get('token');
  const validation = dto.validate();
  if (!validation.isValid) {
    return { success: false, error: validation.errors.join(', ') };
  }

  return request(`${apiUrl}/content/push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${storedToken}`,
    },
    body: JSON.stringify(dto),
  });
}
