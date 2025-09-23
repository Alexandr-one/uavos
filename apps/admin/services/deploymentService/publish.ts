import Cookies from "js-cookie";

export async function publish(apiUrl: string) {
  const res = await fetch(`${apiUrl}/deploy/publish`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${Cookies.get("token")}`
    },
  });
  return res.json();
}
