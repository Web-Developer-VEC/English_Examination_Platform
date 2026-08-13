import React, { useMemo, useState } from "react";
import {
  Plus,
  Search,
  UserRound,
  Building2,
  X,
  Pencil,
  Trash2,
  Eye,
  Users,
  ShieldCheck,
  GraduationCap,
} from "lucide-react";

import facultyData from "../../data/FacultyData";
import "./FacultyList.css";

const FacultyList = ({ isAdmin = false }) => {
  const [faculty, setFaculty] = useState(facultyData);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const [selectedMember, setSelectedMember] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  const emptyForm = {
    name: "",
    role: "",
    section: "English Department",
    category: "faculty",
    image: "",
  };

  const [formData, setFormData] = useState(emptyForm);

  /* =====================================================
     FILTER
  ===================================================== */

  const filteredFaculty = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    return faculty.filter((member) => {
      const categoryMatch =
        activeCategory === "all" ||
        member.category === activeCategory;

      const searchMatch =
        !search ||
        member.name?.toLowerCase().includes(search) ||
        member.role?.toLowerCase().includes(search) ||
        member.section?.toLowerCase().includes(search);

      return categoryMatch && searchMatch;
    });
  }, [faculty, activeCategory, searchTerm]);

  const hod = filteredFaculty.filter(
    (member) => member.category === "hod"
  );

  const teachingFaculty = filteredFaculty.filter(
    (member) => member.category === "faculty"
  );

  const nonTeachingStaff = filteredFaculty.filter(
    (member) => member.category === "non-teaching"
  );

  /* =====================================================
     FORM
  ===================================================== */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingMember(null);
  };

  /* =====================================================
     ADD
  ===================================================== */

  const handleAddFaculty = (event) => {
    event.preventDefault();

    const newMember = {
      ...formData,
      id: `faculty-${Date.now()}`,
    };

    setFaculty((previous) => [
      ...previous,
      newMember,
    ]);

    setShowForm(false);
    resetForm();
  };

  /* =====================================================
     EDIT
  ===================================================== */

  const handleEdit = (member) => {
    setEditingMember(member);

    setFormData({
      name: member.name || "",
      role: member.role || "",
      section: member.section || "English Department",
      category: member.category || "faculty",
      image: member.image || "",
    });

    setShowForm(true);
  };

  /* =====================================================
     UPDATE
  ===================================================== */

  const handleUpdate = (event) => {
    event.preventDefault();

    setFaculty((previous) =>
      previous.map((member) =>
        member.id === editingMember.id
          ? {
              ...member,
              ...formData,
            }
          : member
      )
    );

    setShowForm(false);
    resetForm();
  };

  /* =====================================================
     DELETE
  ===================================================== */

  const handleDelete = (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this faculty member?"
    );

    if (!confirmed) return;

    setFaculty((previous) =>
      previous.filter(
        (member) => member.id !== id
      )
    );
  };

  /* =====================================================
     FACULTY CARD
  ===================================================== */

  const FacultyCard = ({ member }) => {
    return (
      <article
        className={`faculty-card ${
          member.category === "hod"
            ? "faculty-card--hod"
            : ""
        }`}
      >
        {/* IMAGE */}

        <div className="faculty-card__image-wrapper">
          {member.image ? (
            <img
              src={member.image}
              alt={member.name}
              className="faculty-card__image"
              onError={(event) => {
                event.currentTarget.style.display =
                  "none";

                const fallback =
                  event.currentTarget
                    .nextElementSibling;

                if (fallback) {
                  fallback.style.display = "flex";
                }
              }}
            />
          ) : null}

          <div
            className="faculty-card__fallback"
            style={{
              display: member.image
                ? "none"
                : "flex",
            }}
          >
            <UserRound size={42} />
          </div>

          {member.category === "hod" && (
            <span className="faculty-hod-badge">
              HOD
            </span>
          )}
        </div>

        {/* INFORMATION */}

        <div className="faculty-card__content">

          <div className="faculty-info-row">
            <span className="faculty-info-label">
              Name:
            </span>

            <span className="faculty-info-value faculty-info-value--name">
              {member.name}
            </span>
          </div>

          <div className="faculty-info-row">
            <span className="faculty-info-label">
              Role:
            </span>

            <span className="faculty-info-value">
              {member.role}
            </span>
          </div>

          <div className="faculty-info-row">
            <span className="faculty-info-label">
              Section:
            </span>

            <span className="faculty-info-value faculty-section-value">
              <Building2 size={14} />
              {member.section}
            </span>
          </div>

          {/* ADMIN ACTIONS */}

          {isAdmin && (
            <div className="faculty-card__actions">

              <button
                className="faculty-details-btn"
                onClick={() =>
                  setSelectedMember(member)
                }
              >
                <Eye size={15} />
                Details
              </button>

              <button
                className="faculty-edit-btn"
                title="Edit"
                onClick={() =>
                  handleEdit(member)
                }
              >
                <Pencil size={15} />
              </button>

              <button
                className="faculty-delete-btn"
                title="Delete"
                onClick={() =>
                  handleDelete(member.id)
                }
              >
                <Trash2 size={15} />
              </button>

            </div>
          )}
        </div>
      </article>
    );
  };

  /* =====================================================
     SECTION
  ===================================================== */

  const FacultySection = ({
    title,
    subtitle,
    members,
    className = "",
  }) => {
    if (!members.length) return null;

    return (
      <section
        className={`faculty-list-section ${className}`}
      >
        <div className="faculty-section-title">

          <div>
            <span className="faculty-section-line" />

            <h2>{title}</h2>

            <p>{subtitle}</p>
          </div>

          <span className="faculty-member-count">
            {members.length}{" "}
            {members.length === 1
              ? "Member"
              : "Members"}
          </span>
        </div>

        <div className="faculty-grid">
          {members.map((member) => (
            <FacultyCard
              key={member.id}
              member={member}
            />
          ))}
        </div>
      </section>
    );
  };

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <main className="faculty-page">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <header className="faculty-page-header">

        <div className="faculty-page-header__accent" />

        <div className="faculty-page-header__content">

          <span className="faculty-page-header__small">
            VELAMMAL ENGINEERING COLLEGE
          </span>

          <h1>
            English Department
          </h1>

          <p>
            Faculty &amp; Staff Directory
          </p>

        </div>

        {isAdmin && (
          <button
            className="faculty-add-btn"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            <Plus size={18} />
            Add Faculty
          </button>
        )}

      </header>

      {/* =================================================
          SEARCH + FILTER
      ================================================= */}

      <div className="faculty-toolbar">

        <div className="faculty-search-box">

          <Search size={18} />

          <input
            type="text"
            value={searchTerm}
            placeholder="Search faculty..."
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
          />

          {searchTerm && (
            <button
              className="faculty-search-clear"
              onClick={() =>
                setSearchTerm("")
              }
            >
              <X size={15} />
            </button>
          )}

        </div>

        <div className="faculty-filter-buttons">

          <button
            className={
              activeCategory === "all"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveCategory("all")
            }
          >
            All
          </button>

          <button
            className={
              activeCategory === "hod"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveCategory("hod")
            }
          >
            HOD
          </button>

          <button
            className={
              activeCategory === "faculty"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveCategory("faculty")
            }
          >
            Faculty
          </button>

          <button
            className={
              activeCategory === "non-teaching"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveCategory("non-teaching")
            }
          >
            Non-Teaching
          </button>

        </div>
      </div>

      {/* =================================================
          HOD
      ================================================= */}

      <FacultySection
        title="Head of the Department"
        subtitle="Academic leadership of the English Department"
        members={hod}
        className="faculty-section--hod"
      />

      {/* =================================================
          FACULTY
      ================================================= */}

      <FacultySection
        title="Faculty Members"
        subtitle="Dedicated faculty committed to academic excellence and student development"
        members={teachingFaculty}
        className="faculty-section--faculty"
      />

      {/* =================================================
          NON TEACHING
      ================================================= */}

      <FacultySection
        title="Non-Teaching Staff"
        subtitle="Administrative and technical support staff of the department"
        members={nonTeachingStaff}
        className="faculty-section--staff"
      />

      {/* =================================================
          EMPTY
      ================================================= */}

      {!filteredFaculty.length && (
        <div className="faculty-empty">
          <Users size={42} />

          <h3>
            No Faculty Members Found
          </h3>

          <p>
            Try changing your search or filter.
          </p>
        </div>
      )}

      {/* =================================================
          ADMIN DETAILS MODAL
      ================================================= */}

      {selectedMember && isAdmin && (
        <div
          className="faculty-modal-overlay"
          onClick={() =>
            setSelectedMember(null)
          }
        >
          <div
            className="faculty-details-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              className="faculty-modal-close"
              onClick={() =>
                setSelectedMember(null)
              }
            >
              <X size={20} />
            </button>

            <div className="faculty-details-top">

              <div className="faculty-details-photo">

                {selectedMember.image ? (
                  <img
                    src={selectedMember.image}
                    alt={selectedMember.name}
                  />
                ) : (
                  <UserRound size={45} />
                )}

              </div>

              <div>
                <span>
                  {selectedMember.category === "hod"
                    ? "HEAD OF THE DEPARTMENT"
                    : selectedMember.category ===
                      "faculty"
                    ? "TEACHING FACULTY"
                    : "NON-TEACHING STAFF"}
                </span>

                <h2>
                  {selectedMember.name}
                </h2>

                <p>
                  {selectedMember.role}
                </p>
              </div>

            </div>

            <div className="faculty-details-list">

              <div>
                <span>Name</span>
                <strong>
                  {selectedMember.name}
                </strong>
              </div>

              <div>
                <span>Role</span>
                <strong>
                  {selectedMember.role}
                </strong>
              </div>

              <div>
                <span>Section</span>
                <strong>
                  {selectedMember.section}
                </strong>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* =================================================
          ADD / EDIT MODAL
      ================================================= */}

      {showForm && isAdmin && (
        <div className="faculty-modal-overlay">

          <div className="faculty-form-modal">

            <div className="faculty-form-header">

              <div>
                <span>
                  ENGLISH DEPARTMENT
                </span>

                <h2>
                  {editingMember
                    ? "Edit Faculty Member"
                    : "Add Faculty Member"}
                </h2>
              </div>

              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                <X size={20} />
              </button>

            </div>

            <form
              onSubmit={
                editingMember
                  ? handleUpdate
                  : handleAddFaculty
              }
            >

              <div className="faculty-form-grid">

                <div className="faculty-form-group">

                  <label>
                    Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter faculty name"
                    required
                  />

                </div>

                <div className="faculty-form-group">

                  <label>
                    Role
                  </label>

                  <input
                    type="text"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    placeholder="Assistant Professor"
                    required
                  />

                </div>

                <div className="faculty-form-group">

                  <label>
                    Section
                  </label>

                  <input
                    type="text"
                    name="section"
                    value={formData.section}
                    onChange={handleChange}
                    placeholder="English Department"
                    required
                  />

                </div>

                <div className="faculty-form-group">

                  <label>
                    Category
                  </label>

                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                  >
                    <option value="hod">
                      Head of the Department
                    </option>

                    <option value="faculty">
                      Teaching Faculty
                    </option>

                    <option value="non-teaching">
                      Non-Teaching Staff
                    </option>
                  </select>

                </div>

                <div className="faculty-form-group faculty-form-group--full">

                  <label>
                    Image URL
                  </label>

                  <input
                    type="text"
                    name="image"
                    value={formData.image}
                    onChange={handleChange}
                    placeholder="/images/faculty/member.jpg"
                  />

                </div>

              </div>

              <div className="faculty-form-actions">

                <button
                  type="button"
                  className="faculty-cancel-btn"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="faculty-save-btn"
                >
                  {editingMember
                    ? "Update Faculty"
                    : "Add Faculty"}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

    </main>
  );
};

export default FacultyList;