import React from "react";
import { Outlet } from "react-router-dom";
import Boot from "../components/common/boot";
import useOnlineStatus from "../hooks/useOnlineStatus";

export default function StudentLayout() {
  const isOnline = useOnlineStatus();

  if (!isOnline) {
    return <Boot isOffline={true} />;
  }

  return (
    <div>
      <Outlet />
    </div>
  );
}