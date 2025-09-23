import Cookies from 'js-cookie';

interface Content {
  id: string;
  slug: string;
  title: string;
  content: string;
  images?: {
    url: string;
    path?: string;
    filename?: string;
    originalName?: string;
  }[];
  [key: string]: any;
}

export async function fetchContent(slug: string, apiUrl: string): Promise<Content> {
  const storedToken = Cookies.get('token');

  const response = await fetch(`${apiUrl}/content/${slug}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${storedToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load content: ${response.status} ${response.statusText}`);
  }

  const data: { data: Content } = await response.json();
  return data.data;
}
