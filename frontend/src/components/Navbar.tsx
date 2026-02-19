import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import API from "../api";

export default function Navbar() {
  const auth = useAuth();
  const nav = useNavigate();
  const [showProfile, setShowProfile] = useState(false);

  const handleDelete = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    ) {
      try {
        await API.delete("/auth/delete", {
          headers: { Authorization: `${auth.token}` },
        });
        alert("Account deleted successfully");
        auth.logout();
        nav("/login");
      } catch (err) {
        console.error("Delete failed", err);
        alert("Failed to delete account");
      }
    }
  };

  return (
    <header className="w-full bg-white shadow-md px-6 py-4 flex justify-between items-center sticky top-0 z-50">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="text-2xl font-bold text-teal-700">AI Powered Resume Screening System</div>
        {/* <div className="text-sm text-gray-500">AI Resume Screening</div> */}
      </div>

      {/* Navigation Links */}
      <nav className="flex items-center gap-6">
        <button
          onClick={() => nav("/upload")}
          className="text-gray-700 hover:text-teal-700 transition font-medium"
        >
          Home
        </button>
        <button
          onClick={() => nav("/dashboard")}
          className="text-gray-700 hover:text-teal-700 transition font-medium"
        >
          Dashboard
        </button>
        {auth.role === "ADMIN" && (
          <button
            onClick={() => nav("/admin")}
            className="text-gray-700 hover:text-teal-700 transition font-medium"
          >
            Admin
          </button>
        )}
      </nav>

      {/* Profile Menu */}
      <div className="relative">
        <button
          className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-100 transition"
          onClick={() => setShowProfile(!showProfile)}
        >
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600">
            {auth.username?.[0] || "U"}
          </div>
          <span className="hidden md:block">{auth.username || "User"}</span>
        </button>

        {showProfile && (
          <div className="absolute right-0 mt-2 w-52 bg-white border rounded-lg shadow-lg py-2 z-50">
            <button
              className="w-full text-left px-4 py-2 hover:bg-gray-100 transition"
              onClick={() => {
                nav("/edit-profile");
                setShowProfile(false);
              }}
            >
              Edit Profile
            </button>

            <button
              className="w-full text-left px-4 py-2 hover:bg-gray-100 transition"
              onClick={() => {
                auth.logout();
                nav("/login");
              }}
            >
              Logout
            </button>

            <button
              className="w-full text-left px-4 py-2 hover:bg-red-100 text-red-600 font-medium transition"
              onClick={handleDelete}
            >
              Delete Account
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
