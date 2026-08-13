import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/admin/Sidebar";
import Boot from "../components/common/boot"; // adjust path if you placed it elsewhere

export default function AdminLayout() {
  const location = useLocation();
  const [showBoot, setShowBoot] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setShowBoot(true);
    setIsLoaded(false);

    const loadTimer = setTimeout(() => setIsLoaded(true), 300);
    const removeTimer = setTimeout(() => setShowBoot(false), 3000);

    return () => {
      clearTimeout(loadTimer);
      clearTimeout(removeTimer);
    };
  }, [location.pathname]);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {showBoot && <Boot isAuth={true} isLoaded={isLoaded} />}
        <Outlet />
      </main>
    </div>
  );
}