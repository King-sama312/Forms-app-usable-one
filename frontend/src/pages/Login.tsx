import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthForm from "../components/AuthForm";
import { useState } from "react";
import { ApiError } from "../api/client";

export default function Login() {
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleLogin(data: { email: string; password: string }) {
    setError("");
    try {
      await login(data.email, data.password);
      navigate("/");
    } catch (e) {
      if (e instanceof ApiError) {
        setError(error);
      } else {
        setError("Something went wrong");
      }
    }
  }

  return (
    <div>
      <h1>Login</h1>
      <AuthForm onSubmit={handleLogin} buttonText="Login" error={error} />
    </div>
  );
}
