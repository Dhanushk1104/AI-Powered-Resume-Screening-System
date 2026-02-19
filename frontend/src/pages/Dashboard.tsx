import React from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LabelList,
} from "recharts";
import type { AnalyzeResp } from "../types";

// Sample ROLE_KEYWORDS dictionary
const ROLE_KEYWORDS: Record<string, string[]> = {
  "Software Engineer": [
    "python", "java", "c++", "javascript", "spring", "react", "node.js", "api", "docker", "git"
  ],
  "Data Scientist": [
    "python", "r", "sql", "pandas", "numpy", "tensorflow", "keras", "ml", "data analysis", "statistics"
  ],
  "DevOps Engineer": [
    "docker", "kubernetes", "ci/cd", "terraform", "jenkins", "aws", "azure", "monitoring", "linux", "bash"
  ],
};

interface DashboardProps {
  resumeResult: AnalyzeResp | null;
}

const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#3B82F6", "#8B5CF6", "#EC4899"];

export default function Dashboard({ resumeResult }: DashboardProps) {
  const navigate = useNavigate();

  if (!resumeResult)
    return (
      <p className="p-6 text-gray-600 text-center text-lg">
        Upload a resume to see detailed dashboard analytics.
      </p>
    );

  // Map matched keywords for role scoring
  const roleMatchData = Object.entries(ROLE_KEYWORDS).map(([role, keywords]) => {
    const matchedCount = keywords.filter((k) =>
      resumeResult.matched_keywords?.includes(k)
    ).length;
    return { role, matchedCount };
  });

  // Sort roles from high chance to low chance
  roleMatchData.sort((a, b) => b.matchedCount - a.matchedCount);

  // Keyword data for Pie chart and Top keywords
  const keywordData =
    resumeResult.matched_keywords?.map((k) => ({ name: k, value: 1 })) || [];
  const topKeywords = keywordData.slice(0, 5);

  return (
    <div className="p-6 md:p-12 space-y-8">
      {/* Header + ATS + Suggested Role */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-center p-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 mt-1 text-lg">
            Analytics for the uploaded resume.
          </p>
        </div>
        <div className="mt-4 md:mt-0 text-center md:text-right space-y-2">
          <div className="bg-gray-50 p-4 rounded-lg shadow-sm inline-block w-36">
            <p className="text-sm font-medium text-gray-600">ATS Score</p>
            <p className="text-3xl font-bold text-gray-800">{resumeResult.ats_score}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg shadow-sm mt-2 inline-block w-48">
            <p className="text-sm font-medium text-gray-600">Suggested Role</p>
            <p className="text-lg font-semibold text-gray-800">{resumeResult.recommended_role}</p>
          </div>
        </div>
      </div>

      {/* Upload Resume Button */}
      <div className="text-center">
        <button
          onClick={() => navigate("/upload")}
          className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-6 rounded-xl shadow-md transition-transform transform hover:scale-105"
        >
          Upload Another Resume
        </button>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Line Chart: Role vs Keyword Matches */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center">
            RoleMatch Insights
          </h2>
          {roleMatchData.length === 0 ? (
            <p className="text-gray-500 text-center py-10">No role keywords matched.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={roleMatchData}>
                <XAxis dataKey="role" tick={{ fontSize: 12, fill: "#374151" }} />
                <YAxis tick={{ fill: "#374151" }} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: "#F9FAFB", borderRadius: "8px" }} />
                <Line
                  type="monotone"
                  dataKey="matchedCount"
                  stroke="#4F46E5"
                  strokeWidth={3}
                  activeDot={{ r: 6 }}
                >
                  <LabelList dataKey="matchedCount" position="top" />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie Chart */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center">
            Matched Keywords (Pie Chart)
          </h2>
          {keywordData.length === 0 ? (
            <p className="text-gray-500 text-center py-10">No keywords matched.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={keywordData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                  isAnimationActive
                >
                  {keywordData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#F9FAFB", borderRadius: "8px" }} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Keywords + ATS Gauge + Suggested Role */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Top Keywords */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4 text-center">Top 5 Keywords</h2>
          {topKeywords.length === 0 ? (
            <p className="text-gray-500 text-center py-6">No keywords matched.</p>
          ) : (
            <ul className="space-y-2 text-gray-700 text-center">
              {topKeywords.map((k, idx) => (
                <li
                  key={idx}
                  className="p-2 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors duration-200 shadow-sm font-medium"
                >
                  {k.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ATS Gauge */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 flex flex-col items-center justify-center">
          <h2 className="text-lg font-semibold text-gray-700 mb-4 text-center">ATS Gauge</h2>
          <div className="relative w-40 h-40">
            <PieChart width={160} height={160}>
              <Pie
                data={[
                  { name: "Score", value: resumeResult.ats_score },
                  { name: "Remaining", value: 100 - resumeResult.ats_score },
                ]}
                dataKey="value"
                startAngle={180}
                endAngle={0}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                stroke="none"
              >
                <Cell key="score" fill="#4F46E5" />
                <Cell key="remaining" fill="#E5E7EB" />
              </Pie>
            </PieChart>
            <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
              <p className="text-lg font-bold text-gray-800">{resumeResult.ats_score}%</p>
              <p className="text-sm text-gray-500">ATS Score</p>
            </div>
          </div>
        </div>

        {/* Suggested Role */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 flex flex-col items-center justify-center">
          <h2 className="text-lg font-semibold text-gray-700 mb-4 text-center">Suggested Role</h2>
          <p className="text-xl font-bold text-gray-800">{resumeResult.recommended_role}</p>
        </div>
      </div>

      {/* Keyword Cloud */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center">Keyword Cloud</h2>
        <div className="flex flex-wrap justify-center items-center gap-2">
          {keywordData.map((k, idx) => (
            <span
              key={idx}
              className="font-medium text-gray-800 bg-gray-50 px-2 py-1 rounded-md shadow-sm cursor-default"
              title={`Keyword: ${k.name}`}
            >
              {k.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
