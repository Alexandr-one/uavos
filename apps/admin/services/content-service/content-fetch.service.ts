import Cookies from 'js-cookie';
import { request } from '../helpers/request.helper';
import { ContentFetchDto } from '@uavos/shared-types';

/**
 * Fetch a single content item by slug
 * Returns a ContentFetchDto
 * @param slug unique identifier of the content
 * @param apiUrl base API URL
 */
export async function fetchContent(
  slug: string,
  apiUrl: string
): Promise<ContentFetchDto> {
  const storedToken = Cookies.get('token');

  try {
    // Use generic request helper for consistency
    const content =  await request<{
      data: ContentFetchDto;
      success: boolean;
      message?: string;
    }>(`${apiUrl}/content/${slug}`, {
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
