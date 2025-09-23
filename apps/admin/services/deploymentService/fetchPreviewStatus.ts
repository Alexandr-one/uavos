import Cookies from "js-cookie";

export interface PreviewStatus {
  isRunning: boolean;
  url?: string;
  port?: number;
  [key: string]: any;
}

export async function fetchPreviewStatus(apiUrl: string): Promise<PreviewStatus> {
  const res = await fetch(`${apiUrl}/deploy/preview-status`, {
    headers: { Authorization: `Bearer ${Cookies.get("token")}` },
    cache: "no-store",
  });
  return res.json();
}
