"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./LoginForm.module.css";
import { useRouter } from "next/navigation";
import { LoginDto } from "@uavos/shared-types";

export default function LoginForm() {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const { login, isLoading } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const loginDto = new LoginDto(username, password);
    const validation = loginDto.validate();

    if (!validation.isValid) { 
      alert(validation.errors.join('\n'));
      return;
    }

    const result = await login(username, password);

    if (result.success) {
      router.push("/");
    } else {
      alert(result.message);
    } 
  };

  return (
    <form className={styles.container} onSubmit={handleSubmit}>
      <h2 className={styles.title}>Login</h2>

      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
        className={styles.input}
      />

      <div className={styles.passwordWrapper}>
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className={styles.input}
        />
        <button
          type="button"
          className={styles.eyeButton}
          onClick={() => setShowPassword(!showPassword)}
          tabIndex={-1}
        >
          {showPassword ? "🙈" : "👁️"}
        </button>
      </div>

      <button type="submit" disabled={isLoading} className={styles.button}>
        {isLoading ? "Loading..." : "Login"}
      </button>
    </form>
  );
}
