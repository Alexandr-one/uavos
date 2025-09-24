import Cookies from 'js-cookie';
import { ContentResponseDto } from '@uavos/shared-types';
import { request } from '../helpers/request.helper';

export async function deleteContent(
  slug: string,
  apiUrl: string
): Promise<ContentResponseDto<string>> {
  const storedToken = Cookies.get('token');

  try {
    return request<ContentResponseDto<string>>(`${apiUrl}/content/delete/${slug}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${storedToken}`,
      },
    });
  } catch (error: any) {
    return new ContentResponseDto(false, error.message);
  }
}
