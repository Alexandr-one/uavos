export async function uploadImage(
  file: File,
  articleId: string | number
): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("articleId", String(articleId));

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/images/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Error uploading image");
  }

  const data: { url: string } = await res.json();
  return { url: data.url };
}
