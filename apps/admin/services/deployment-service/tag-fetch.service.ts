import Cookies from "js-cookie";

export interface TagsResponse {
  tags: string[];
}

export async function fetchTags(apiUrl: string): Promise<TagsResponse> {
  const res = await fetch(`${apiUrl}/deploy/tags`, {
    headers: { Authorization: `Bearer ${Cookies.get("token")}` },
    cache: "no-store",
  });
  return res.json();
}
