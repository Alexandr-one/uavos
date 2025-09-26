import Cookies from "js-cookie";
import { request } from "../helpers/request.helper";
import { LoginDto, LoginResponseDto } from "@uavos/shared-types";

const API_HOST = process.env.NEXT_PUBLIC_API_HOST;

export async function loginService(
  username: string,
  password: string
): Promise<{ success: boolean; message?: string; user?: LoginResponseDto['user']; token?: string }> {
  try {
    const data: LoginResponseDto | { message: string } = await request<LoginResponseDto>(
      `${API_HOST}/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password } as LoginDto),
      }
    );

    if ("access_token" in data) {
      Cookies.set("token", data.access_token, { expires: 7 });
      Cookies.set("user", JSON.stringify(data.user), { expires: 7 });
      return { success: true, user: data.user, token: data.access_token };
    } else {
      return { success: false, message: "Invalid credentials" };
    }
  } catch (err: any) {
    return { success: false, message: err.message || "Network error" };
  }
}

export async function checkAuthService(): Promise<{ valid: boolean; user?: LoginResponseDto['user'] }> {
  const token = Cookies.get("token");
  const userCookie = Cookies.get("user");

  if (!token || !userCookie) return { valid: false };

  try {
    const res = await fetch(`${API_HOST}/auth/check`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      Cookies.remove("token");
      Cookies.remove("user");
      return { valid: false };
    }

    const user = JSON.parse(userCookie) as LoginResponseDto['user'];
    return { valid: true, user };
  } catch (err) {
    Cookies.remove("token");
    Cookies.remove("user");
    return { valid: false };
  }
}
