import Cookies from "js-cookie";

export interface DeploymentStatus {
  hasUnpublishedChanges?: boolean;
  message?: string;
  currentTag?: string;
  [key: string]: any;
}

export async function fetchDeploymentStatus(apiUrl: string): Promise<DeploymentStatus> {
  const res = await fetch(`${apiUrl}/deploy/status`, {
    headers: { Authorization: `Bearer ${Cookies.get("token")}` },
    cache: "no-store",
  });
  return res.json();
}
