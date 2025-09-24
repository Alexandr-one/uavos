import Cookies from 'js-cookie';
import {
  ContentCreateDto,
  ContentObjectDto,
  ContentResponseDto,
} from '@uavos/shared-types';
import { request } from '../helpers/request.helper';

export async function createContent(
  dto: ContentCreateDto,
  apiUrl: string
): Promise<ContentResponseDto<ContentObjectDto|null>> {
  const storedToken = Cookies.get('token');

  // Validate input DTO before sending to backend
  const validation = dto.validate();
  if (!validation.isValid) {
    return new ContentResponseDto(false, null, validation.errors.join(', '));
  }

  return request<ContentResponseDto<ContentObjectDto>>(`${apiUrl}/content/push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${storedToken}`,
    },
    body: JSON.stringify(dto),
  });
}