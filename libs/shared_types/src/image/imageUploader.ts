import Cookies from 'js-cookie';

export async function uploadImage(
    file: File,
    articleId: string | number,
    api: string
  ): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("articleId", String(articleId));
    const storedToken = Cookies.get('token');
    const res = await fetch(`${api}/images/upload`, {
      method: "POST",
      body: formData,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${storedToken}`,
      },
    });
  
    if (!res.ok) {
      throw new Error("Error uploading image");
    }
  
    const data: { url: string } = await res.json();
    return { url: data.url };
  }
  