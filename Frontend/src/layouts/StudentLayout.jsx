import React from "react";
import { Outlet } from "react-router-dom";

export default function StudentLayout() {

  return (
    <div>
      <Outlet />
    </div>
  );
}