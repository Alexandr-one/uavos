import Cookies from 'js-cookie';
import { ContentUpdateDto } from '@uavos/shared-types';

export const updateContent = async (
  slug: string,
  dto: ContentUpdateDto,
  apiUrl: string
): Promise<{ success: boolean; message?: string }> => {
  const storedToken = Cookies.get('token');

  try {
    const response = await fetch(`${apiUrl}/content/update/${slug}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${storedToken}`,
      },
      body: JSON.stringify(dto),
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
};
