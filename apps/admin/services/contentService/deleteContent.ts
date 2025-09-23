import Cookies from 'js-cookie';
import { DeleteContentResponseDto } from '@uavos/shared-types';

export const deleteContent = async (
  slug: string,
  apiUrl: string
): Promise<DeleteContentResponseDto> => {
  const storedToken = Cookies.get('token');

  try {
    const response = await fetch(`${apiUrl}/content/delete/${slug}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${storedToken}`,
      },
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data: DeleteContentResponseDto = await response.json();
    return data;
  } catch (error: any) {
    return { success: false, message: error.message };
  }
};
