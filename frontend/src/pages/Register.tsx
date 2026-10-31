import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthForm from "../components/AuthForm";
import { useState } from "react";
import { ApiError } from "../api/client";

export default function Register() {
  const [error, setError] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleRegister(data: { email: string; password: string }) {
    setError("")
    try {
      await register(data.email, data.password);
      navigate("/");
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
      }else{
        setError("Something went wrong")
      }
    }
  }

  return (
    <div>
      <h1>Register</h1>
      <AuthForm onSubmit={handleRegister} buttonText="Register" error={error} />
    </div>
  );
}
