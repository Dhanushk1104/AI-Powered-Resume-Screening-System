import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import API from "../api";

export default function EditProfile() {
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch current user profile
  useEffect(() => {
    async function fetchProfile() {
      try {
        interface MeResponse {
          email: string;
          role: string;
        }
        const res = await API.get<MeResponse>("/auth/me", {
          headers: { Authorization: `${auth.token}` },
        });
        setEmail(res.data.email);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch profile");
      }
    }
    fetchProfile();
  }, [auth.token]);

  // Handle profile update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      await API.put(
        "/auth/update",
        { email, password },
        { headers: { Authorization: `${auth.token}` } }
      );
      setMessage("Profile updated successfully");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      setError("Failed to update profile");
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-12 p-8 bg-white shadow-xl rounded-2xl border border-gray-200">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
        Edit Profile
      </h2>

      {message && (
        <div className="mb-4 p-3 text-green-700 bg-green-100 border border-green-200 rounded">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 text-red-700 bg-red-100 border border-red-200 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            New Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Leave blank to keep current password"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-500"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-md transition duration-200"
        >
          Update Profile
        </button>
      </form>
    </div>
  );
}
