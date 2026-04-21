import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  const [mode, setMode] = useState("login");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    displayName: "",
    department: "",
    role: "STAFF",
  });

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      if (mode === "login") {
        await login(form.email, form.password);
        toast.success("Welcome back");
      } else {
        await signup(form);
        toast.success("Account created successfully");
      }
      navigate("/", { replace: true });
    } catch (error) {
      const message =
        error?.response?.data?.error || error?.message || "Authentication failed";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-shell">
      <div className="auth-hero">
        <h1>Medical College Inventory Management</h1>
        <p>
          Manage laboratory equipment, medical supplies, and stock movement with a role-based,
          audit-ready workflow.
        </p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>{mode === "login" ? "Sign In" : "Create Account"}</h2>

        {mode === "signup" && (
          <>
            <label>
              Full Name
              <input
                required
                value={form.displayName}
                onChange={(event) => updateField("displayName", event.target.value)}
              />
            </label>

            <label>
              Department
              <input
                value={form.department}
                onChange={(event) => updateField("department", event.target.value)}
              />
            </label>

            <label>
              Preferred Role
              <select value={form.role} onChange={(event) => updateField("role", event.target.value)}>
                <option value="STAFF">Staff</option>
                <option value="ADMIN">Admin</option>
              </select>
            </label>
          </>
        )}

        <label>
          Email Address
          <input
            required
            type="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
          />
        </label>

        <label>
          Password
          <input
            required
            type="password"
            minLength={6}
            value={form.password}
            onChange={(event) => updateField("password", event.target.value)}
          />
        </label>

        <button type="submit" className="primary-button" disabled={submitting}>
          {submitting
            ? "Please wait..."
            : mode === "login"
              ? "Sign In"
              : "Create Account"}
        </button>

        <button
          type="button"
          className="ghost-button"
          onClick={() => setMode((current) => (current === "login" ? "signup" : "login"))}
        >
          {mode === "login"
            ? "Need an account? Register"
            : "Already have an account? Sign in"}
        </button>
      </form>
    </section>
  );
}

export default LoginPage;
