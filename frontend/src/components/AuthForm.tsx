import { useForm } from "react-hook-form";

type AuthFormData = {
  email: string;
  password: string;
};

type AuthFormProps = {
  onSubmit: (data: AuthFormData) => Promise<void>;
  buttonText: string;
  error: string;
};

export default function AuthForm({ onSubmit, buttonText, error }: AuthFormProps) {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<AuthFormData>();

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        type="email"
        placeholder="Email"
        {...register("email", { required: "Email is required" })}
      />

      {errors.email && <p>{errors.email.message}</p>}

      <input
        type="password"
        placeholder="Password"
        {...register("password", { required: "Password is required" })}
      />

      {errors.password && <p>{errors.password.message}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : buttonText}
      </button>

      {error && <p>{error}</p>}
    </form>
  );
}
