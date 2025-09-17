export async function uploadImage(file, articleId) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("articleId", articleId);

  const res = await fetch('http://localhost:3003/images/upload', {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Error loading image  ");
  }

  const data = await res.json();

  return { url: data.url };
}
