import React, { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

type Props = { children: ReactNode; roles?: string[] };

export default function PrivateRoute({ children, roles }: Props) {
  const auth = useAuth();
  const location = useLocation();

  if (!auth.token) {
    // Redirect to login and store attempted URL
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && !roles.includes(auth.role || "")) {
    // Unauthorized role: redirect to resume upload
    return <Navigate to="/upload" replace />;
  }

  return <>{children}</>;
}
