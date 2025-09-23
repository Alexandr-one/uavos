import Cookies from 'js-cookie';
import { UploadImageResponseDto } from '@uavos/shared-types';

export async function uploadImage(
  file: File,
  articleId: string | number,
  api: string
): Promise<UploadImageResponseDto> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("articleId", String(articleId));
  
  const storedToken = Cookies.get('token');
  const res = await fetch(`${api}/images/upload`, {
    method: "POST",
    body: formData,
    headers: {
      Authorization: `Bearer ${storedToken}`,
    },
  });

  if (!res.ok) {
    throw new Error("Error uploading image");
  }

  const data: UploadImageResponseDto = await res.json();
  return data;
}
