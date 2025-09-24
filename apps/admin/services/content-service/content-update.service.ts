import Cookies from 'js-cookie';
import { ContentUpdateDto, ContentResponseDto } from '@uavos/shared-types';
import { request } from '../helpers/request.helper';

export async function updateContent(
  slug: string,
  dto: ContentUpdateDto,
  apiUrl: string
): Promise<ContentResponseDto<any>> {
  const storedToken = Cookies.get('token');

  // Validate input DTO before sending to backend
  const validation = dto.validate();
  if (!validation.isValid) {
    return new ContentResponseDto(false, null, validation.errors.join(', '));
  }

  try {
    return request<ContentResponseDto<any>>(`${apiUrl}/content/update/${slug}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${storedToken}`,
      },
      body: JSON.stringify(dto),
    });
  } catch (error: any) {
    return new ContentResponseDto(false, null, error.message);
  }
}
