import React, { useEffect, useState } from "react";
import API from "../api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { TrashIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

interface User {
  id: number;
  email: string;
  role: string;
  createdAt: string;
}

export default function Admin() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const COLORS = ["#6366F1", "#10B981", "#FBBF24", "#F97316", "#38BDF8", "#8B5CF6", "#F472B6"];

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await API.get<User[]>("/admin/users");
        setUsers(res.data);
      } catch (err) {
        console.error(err);
        alert("Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const deleteUser = async (id: number) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      await API.delete(`/admin/users/${id}`);
      setUsers(users.filter((u) => u.id !== id));
      alert("User deleted successfully");
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.error || "Failed to delete user");
    }
  };

  return (
    <div className="p-6 md:p-12 space-y-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center bg-gradient-to-r from-indigo-500 via-teal-400 to-purple-400 text-white p-6 rounded-3xl shadow-xl">
        <h1 className="text-3xl font-bold">Admin Console</h1>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/30 backdrop-blur-md rounded-lg hover:bg-white/50 transition"
        >
          <ArrowPathIcon className="w-5 h-5" />
          Refresh Data
        </button>
      </div>

      {/* User Table */}
      <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition">
        <h2 className="text-xl font-semibold mb-4">All Users</h2>
        {loading ? (
          <p className="text-gray-500">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="text-gray-500">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Role</th>
                  <th className="px-4 py-2 text-left">Created At</th>
                  <th className="px-4 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-4 py-2">{u.id}</td>
                    <td className="px-4 py-2">{u.email}</td>
                    <td className="px-4 py-2">{u.role}</td>
                    <td className="px-4 py-2">{new Date(u.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => deleteUser(u.id)}
                        className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 transition"
                      >
                        <TrashIcon className="w-4 h-4" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
