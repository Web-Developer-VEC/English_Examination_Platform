import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
        key: "createtest",
        label: "Create-Test",
        icon: ClipboardPlus,
        location: "/admin/createtest",
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
  const [activeKey, setActiveKey] = useState("dashboard");
  const [expanded, setExpanded] = useState({ faculty: true });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const [hovering, setHovering] = useState(false);

  const toggleExpand = (key) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Only sets which item is highlighted as active — does not render/navigate
  // to any page. Wire this up to your router / page state later.
  const handleSelect = (key, hasChildren, location) => {
    setActiveKey(key);
    if (hasChildren) {
      if (collapsed) setCollapsed(false);
      toggleExpand(key);
    } else {
      setMobileOpen(false);
      if (location) navigate(location);
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
        <span className="vec-topbar-title">Admin Panel</span>
      </div>

      {/* Overlay for mobile drawer */}
      <div
        className={`vec-overlay ${mobileOpen ? "mobile-open" : ""}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`vec-sidebar ${mobileOpen ? "mobile-open" : ""} ${
          collapsed && !hovering ? "collapsed" : ""
        }`}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <div className="vec-header">
          <button
            className="vec-collapse-btn"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => {
              setCollapsed((c) => {
                const next = !c;
                if (next) setHovering(false); // force it shut even if cursor is still on it
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

        <nav className="vec-nav" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const hasChildren = !!item.children;
            const isParentActive =
              hasChildren && item.children.some((c) => c.key === activeKey);
            const isOpen = !!expanded[item.key];
            const isDirectActive = activeKey === item.key && !hasChildren;

            return (
              <div key={item.key}>
                <button
                  className={`vec-item-btn ${
                    isDirectActive
                      ? "active"
                      : isParentActive
                        ? "parent-active-only"
                        : ""
                  }`}
                  onClick={() =>
                    handleSelect(item.key, hasChildren, item.location)
                  }
                  aria-expanded={hasChildren ? isOpen : undefined}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="vec-icon" />
                  <span className="vec-label">{item.label}</span>
                  {hasChildren && (
                    <ChevronDown
                      className={`vec-chevron ${isOpen ? "open" : ""}`}
                    />
                  )}
                </button>

                {hasChildren && (
                  <div className={`vec-submenu ${isOpen ? "open" : ""}`}>
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      const childActive = activeKey === child.key;
                      return (
                        <button
                          key={child.key}
                          className={`vec-subitem-btn ${childActive ? "active" : ""}`}
                          onClick={() =>
                            handleSelect(child.key, false, child.location)
                          }
                        >
                          <ChildIcon className="vec-subicon" />
                          <span>{child.label}</span>
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
