import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getAdminSession } from "../../utils/helpers";

import {
  LayoutDashboard,
  Users,
  ChevronDown,
  UserCog,
  ClipboardPlus,
  CalendarClock,
  UploadCloud,
  ClipboardList,
  ShieldCheck,
  PanelLeftOpen,
  PanelLeftClose,
  Menu,
  X,
  LogOut,
} from "lucide-react";

import "./Sidebar.css";

const NAV_ITEMS = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    location: "/admin/dashboard",
  },

  {
    key: "faculty",
    label: "Faculty",
    icon: Users,
    adminOnly: true,

    children: [
      {
        key: "faculty-list",
        label: "Faculty Incharge",
        icon: UserCog,
        location: "/admin/FacultyIncharge",
      },

      {
        key: "QuestionUpload",
        label: "Question Upload",
        icon: ClipboardPlus,
        location: "/admin/questionupload",
      },

      {
        key: "schedule-test",
        label: "Schedule Test",
        icon: CalendarClock,
        location: "/admin/schedule",
      },

      {
        key: "student-data-upload",
        label: "Student Data Upload",
        icon: UploadCloud,
        location: "/admin/StudentData",
      },

      {
        key: "student-profile-access",
        label: "Student Profile Access",
        icon: ShieldCheck,
        location: "/admin/StudentProfileAccess",
      },
    ],
  },

  // STAFF + ADMIN
  {
    key: "student-result",
    label: "Result Download",
    icon: ClipboardList,
    location: "/admin/student-result",
  },
];

export default function AdminSidebar() {

  const session = getAdminSession();
const role = session?.user?.role;
console.log("ROLE:", role);
  const navigate = useNavigate();
  const location = useLocation();

  /* Faculty submenu */
  const [expanded, setExpanded] = useState({
    faculty: true,
  });

  /* Mobile drawer */
  const [mobileOpen, setMobileOpen] = useState(false);

  /*
   * TRUE  = sidebar collapsed
   * FALSE = sidebar expanded
   */
  const [collapsed, setCollapsed] = useState(true);

  /*
   * Used only for hover expansion.
   * Manual toggle still controls collapsed state.
   */
  const [hovering, setHovering] = useState(false);

  /* =========================================================
     FACULTY SUBMENU
     ========================================================= */

  const toggleExpand = (key) => {
    setExpanded((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  /* =========================================================
     NAVIGATION
     ========================================================= */

  const handleSelect = (key, hasChildren, path) => {
    if (hasChildren) {
      /*
       * If sidebar is collapsed and Faculty is clicked,
       * open sidebar first.
       */
      if (collapsed) {
        setCollapsed(false);
      }

      toggleExpand(key);
      return;
    }

    setMobileOpen(false);

    if (path) {
      navigate(path);
    }
  };

  /* =========================================================
     SIDEBAR TOGGLE
     ========================================================= */

  const handleSidebarToggle = () => {
    setCollapsed((prev) => !prev);
  };

  /* =========================================================
     LOGOUT
     ========================================================= */

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");

    setMobileOpen(false);
    setCollapsed(true);
    setHovering(false);

    navigate("/login");
  };

  /*
   * Effective visual state:
   *
   * collapsed = true + hovering = false
   *      -> CLOSED
   *
   * collapsed = false
   *      -> OPEN
   *
   * collapsed = true + hovering = true
   *      -> TEMPORARILY OPEN
   */

  const isVisuallyOpen = !collapsed || hovering;

  return (
    <div
      className={`vec-shell ${
        isVisuallyOpen ? "vec-shell-open" : "vec-shell-collapsed"
      }`}
    >
      {/* =====================================================
          MOBILE TOPBAR
          ===================================================== */}

      <div className="vec-topbar">
        <button
          className="vec-hamburger"
          aria-label="Open sidebar"
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={20} />
        </button>

        <span className="vec-topbar-title">
          Admin Panel
        </span>
      </div>

      {/* =====================================================
          MOBILE OVERLAY
          ===================================================== */}

      <div
        className={`vec-overlay ${
          mobileOpen ? "mobile-open" : ""
        }`}
        onClick={() => setMobileOpen(false)}
      />

      {/* =====================================================
          SIDEBAR
          ===================================================== */}

      <aside
        className={`vec-sidebar ${
          collapsed ? "collapsed" : "expanded"
        } ${mobileOpen ? "mobile-open" : ""}`}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >

        {/* ===================================================
            SIDEBAR HEADER / TOGGLE
            =================================================== */}

        <div className="vec-sidebar-header">

          {/* Desktop toggle */}

          <button
            className="vec-sidebar-toggle"
            onClick={handleSidebarToggle}
            aria-label={
              collapsed
                ? "Open sidebar"
                : "Close sidebar"
            }
            title={
              collapsed
                ? "Open sidebar"
                : "Close sidebar"
            }
          >
            {collapsed ? (
              <PanelLeftOpen size={21} />
            ) : (
              <PanelLeftClose size={21} />
            )}
          </button>

          {/* Mobile close */}

          <button
            className="vec-close-btn"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          >
            <X size={21} />
          </button>

        </div>

        {/* ===================================================
            NAVIGATION
            =================================================== */}

        <nav
          className="vec-nav"
          aria-label="Main navigation"
        >

{NAV_ITEMS
    .filter((item) => !item.adminOnly || role === "admin")
    .map((item) => {
                  const Icon = item.icon;
            const hasChildren = !!item.children;

            /*
             * Direct active item
             */
            const isDirectActive =
              !hasChildren &&
              location.pathname === item.location;

            /*
             * Parent active if any child is active
             */
            const isParentActive =
              hasChildren &&
              item.children.some(
                (child) =>
                  location.pathname === child.location
              );

            const isOpen = !!expanded[item.key];

            return (
              <div
                key={item.key}
                className="vec-nav-group"
              >

                {/* ==============================
                    MAIN MENU ITEM
                    ============================== */}

                <button
                  className={`vec-item-btn ${
                    isDirectActive
                      ? "active"
                      : isParentActive
                      ? "parent-active-only"
                      : ""
                  }`}
                  onClick={() =>
                    handleSelect(
                      item.key,
                      hasChildren,
                      item.location
                    )
                  }
                  aria-expanded={
                    hasChildren
                      ? isOpen
                      : undefined
                  }
                  title={
                    collapsed
                      ? item.label
                      : undefined
                  }
                >

                  <Icon className="vec-icon" />

                  <span className="vec-label">
                    {item.label}
                  </span>

                  {hasChildren && (
                    <ChevronDown
                      className={`vec-chevron ${
                        isOpen ? "open" : ""
                      }`}
                    />
                  )}

                </button>

                {/* ==============================
                    SUBMENU
                    ============================== */}

                {hasChildren && (
                  <div
                    className={`vec-submenu ${
                      isOpen ? "open" : ""
                    }`}
                  >

                    {item.children.map((child) => {
                      const ChildIcon = child.icon;

                      const childActive =
                        location.pathname ===
                        child.location;

                      return (
                        <button
                          key={child.key}
                          className={`vec-subitem-btn ${
                            childActive
                              ? "active"
                              : ""
                          }`}
                          onClick={() =>
                            handleSelect(
                              child.key,
                              false,
                              child.location
                            )
                          }
                        >

                          <ChildIcon className="vec-subicon" />

                          <span>
                            {child.label}
                          </span>

                        </button>
                      );
                    })}

                  </div>
                )}

              </div>
            );
          })}

        </nav>

        {/* ===================================================
            LOGOUT
            =================================================== */}

        <div className="vec-sidebar-footer">

          <button
            className="vec-logout-btn"
            onClick={handleLogout}
            title={
              collapsed
                ? "Logout"
                : undefined
            }
          >

            <LogOut className="vec-icon" />

            <span className="vec-label">
              Logout
            </span>

          </button>

        </div>

      </aside>
    </div>
  );
}