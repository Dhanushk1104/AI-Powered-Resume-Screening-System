import React, { useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { useNavigate, useLocation } from "react-router-dom";

export default function Login() {
  const auth = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || "/upload"; // default redirect after login

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await auth.login(email, password);
      nav(from, { replace: true });
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-indigo-100 to-teal-100">
      <div className="w-full max-w-3xl bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/30 p-6 flex flex-col md:flex-row gap-8">
        {/* Left info card */}
        <div className="w-full md:w-1/2 bg-gradient-to-b from-teal-500 to-teal-700 rounded-xl p-8 text-white hidden md:block">
          <h2 className="text-3xl font-bold mb-4">Welcome to AI Powered Resume Screening System</h2>
          <p className="text-sm opacity-90">
            Sign in to access your AI-powered resume analysis and career insights.
          </p>
          {/* <div className="mt-8 bg-white/10 p-4 rounded-lg">
            <div className="text-xs uppercase">Demo accounts</div>
            <div className="mt-2 text-sm space-y-1">
              <div><strong>Admin</strong> — admin / 1234</div>
              <div><strong>User</strong> — user@demo.com / userpass</div>
            </div>
          </div> */}
        </div>

        {/* Login form */}
        <form className="w-full md:w-1/2 flex flex-col" onSubmit={submit}>
          <h3 className="text-2xl font-semibold mb-6">Sign in</h3>
          {err && <div className="mb-4 text-red-600">{err}</div>}
          <input
            className="mb-4 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
          <input
            type="password"
            className="mb-4 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-400"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 text-white font-semibold hover:scale-105 transform transition disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p className="text-sm text-center text-gray-600 mt-4">
            New user?{" "}
            <button
              type="button"
              onClick={() => nav("/signup")}
              className="text-indigo-600 font-semibold hover:underline"
            >
              Create an account
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
