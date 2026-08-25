import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ChevronDown,
  UserCog,
  ClipboardPlus,
  CalendarClock,
  UploadCloud,
  ClipboardList,
  Menu,
  X,
  PanelLeftClose,
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
    children: [
      {
        key: "QuestionUpload",
        label: "Question Upload",
        icon: ClipboardPlus,
        location: "/admin/QuestionUpload",
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
        location: "/admin/student-data",
      },
      {
        key: "student-result",
        label: "Result Download",
        icon: ClipboardList,
        location: "/admin/student-result",
      },
    ],
  },
];
export default function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [expanded, setExpanded] = useState({ faculty: true });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const [hovering, setHovering] = useState(false);

  const toggleExpand = (key) => {
    setExpanded((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSelect = (key, hasChildren, path) => {
    if (hasChildren) {
      if (collapsed) {
        setCollapsed(false);
      }

      toggleExpand(key);
    } else {
      setMobileOpen(false);

      if (path) {
        navigate(path);
      }
    }
  };

  return (
    <div className="vec-shell">

      {/* Mobile topbar */}
      <div className="vec-topbar">
        <button
          className="vec-hamburger"
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={19} />
        </button>

        <span className="vec-topbar-title">
          Admin Panel
        </span>
      </div>

      {/* Overlay for mobile drawer */}
      <div
        className={`vec-overlay ${
          mobileOpen ? "mobile-open" : ""
        }`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`vec-sidebar ${
          mobileOpen ? "mobile-open" : ""
        } ${
          collapsed && !hovering ? "collapsed" : ""
        }`}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >

        <div className="vec-header">

          <button
            className="vec-collapse-btn"
            aria-label={
              collapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
            onClick={() => {
              setCollapsed((c) => {
                const next = !c;

                if (next) {
                  setHovering(false);
                }

                return next;
              });
            }}
          >
            <PanelLeftClose size={18} />
          </button>

          <button
            className="vec-close-btn"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          >
            <X size={20} />
          </button>

        </div>

        <nav
          className="vec-nav"
          aria-label="Main navigation"
        >

          {NAV_ITEMS.map((item) => {

            const Icon = item.icon;
            const hasChildren = !!item.children;

            /*
             * Check the current URL.
             */
            const isDirectActive =
              !hasChildren &&
              location.pathname === item.location;

            /*
             * Check if one of the child routes
             * matches the current URL.
             */
            const isParentActive =
              hasChildren &&
              item.children.some(
                (child) =>
                  location.pathname === child.location
              );

            const isOpen = !!expanded[item.key];

            return (
              <div key={item.key}>

                {/* Main menu item */}
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

                {/* Submenu */}
                {hasChildren && (
                  <div
                    className={`vec-submenu ${
                      isOpen ? "open" : ""
                    }`}
                  >

                    {item.children.map((child) => {

                      const ChildIcon = child.icon;

                      /*
                       * THIS is the important part.
                       * Active state comes from URL.
                       */
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

      </aside>

    </div>
  );
}