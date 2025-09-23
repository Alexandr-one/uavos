import Cookies from "js-cookie";

export async function rollback(apiUrl: string, tag: string) {
  const res = await fetch(`${apiUrl}/deploy/rollback`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${Cookies.get("token")}`
    },
    body: JSON.stringify({ tag }),
  });
  return res.json();
}
