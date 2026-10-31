import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getForms, type Form } from "../api/form";
import { ApiError } from "../api/client";

export default function Dashboard() {
  const { user } = useAuth();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadForms() {
      try {
        const data = await getForms();
        if (!ignore) {
          setForms(data);
          setError(null);
        }
      } catch (e) {
        if (!ignore) {
          setError(
            e instanceof ApiError ? e.message : "Failed to load your forms",
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadForms();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6 px-8 pb-12 text-left">
      <h1 className="mb-2">Hello {user?.email}</h1>

      {loading && (
        <p className="rounded-xl border border-[var(--border)] p-8">Loading forms...</p>
      )}

      {!loading && error && (
        <p
          role="alert"
          className="rounded-xl border border-[var(--border)] p-8 text-red-500"
        >
          {error}
        </p>
      )}

      {!loading && !error && forms.length === 0 && (
        <p className="rounded-xl border border-[var(--border)] p-8">
          You have no forms yet.
        </p>
      )}

      {!loading && !error && forms.length > 0 && (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
          {forms.map((form) => (
            <li
              key={form.id}
              className="flex flex-col gap-3 rounded-xl border border-[var(--border)] p-5 transition-shadow hover:shadow-[var(--shadow)]"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[22px] leading-snug">{form.title}</h2>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[13px] ${
                    form.status === "EXPIRED"
                      ? "bg-red-500/10 text-red-500"
                      : "bg-[var(--accent-bg)] text-[var(--accent)]"
                  }`}
                >
                  {form.status}
                </span>
              </div>
              {form.description && (
                <p className="m-0 line-clamp-2">{form.description}</p>
              )}
              <footer className="mt-auto flex gap-4 border-t border-[var(--border)] pt-3 text-[15px]">
                <span>
                  {form._count?.fields ?? 0}{" "}
                  {(form._count?.fields ?? 0) === 1 ? "field" : "fields"}
                </span>
                <span>
                  {form._count?.submissions ?? 0}{" "}
                  {(form._count?.submissions ?? 0) === 1
                    ? "submission"
                    : "submissions"}
                </span>
              </footer>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
