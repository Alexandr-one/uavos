import Cookies from 'js-cookie';
import { request } from '../helpers/request.helper';
import { ContentFetchDto, ContentResponseDto } from '@uavos/shared-types';

/**
 * Fetch a single content item by slug
 * Returns a ContentFetchDto
 * @param apiUrl base API URL
 */
export async function getContent(
  apiUrl: string
): Promise<ContentFetchDto[] | null> {
  const storedToken = Cookies.get('token');

  try {
    // Use generic request helper for consistency
    const content: ContentResponseDto<ContentFetchDto[]> =  await request<{
      data: ContentFetchDto[];
      success: boolean;
      message?: string;
    }>(`${apiUrl}/content/`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${storedToken}`,
        'Content-Type': 'application/json',
      },
    });

    return content.data;
  } catch (error: any) {
    // In case of error, throw to handle in caller
    throw new Error(error.message);
  }
}
