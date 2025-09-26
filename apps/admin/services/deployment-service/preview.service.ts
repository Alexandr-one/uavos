import Cookies from "js-cookie";

export async function startPreview(apiUrl: string) {
  const res = await fetch(`${apiUrl}/deploy/preview`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${Cookies.get("token")}`
    },
  });
  return res.json();
}
