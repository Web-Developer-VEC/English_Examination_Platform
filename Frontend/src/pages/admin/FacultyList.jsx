import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  getScheduleFormData,
  getStaff,
  updateStaff,
  deleteStaff,
} from "../../services/adminService";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Mail,
  Phone,
  UserRound,
  GraduationCap,
  Search,
  Users,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Eye
} from "lucide-react";

import ThemeDropdown from "../../components/common/ThemeDropDown";

import "./FacultyList.css";

const MAX_IMAGE_WIDTH = 800;
const MAX_IMAGE_HEIGHT = 800;
const MAX_ORIGINAL_IMAGE_SIZE = 1048576; // 1MB
const TARGET_BASE64_SIZE = 150000;

const EMPTY_FORM = {
  name: "",
  photo: "",
  allowdept: [], 
  semester: "",
  email: "",
  phoneNo: "",
  role: "staff",
};

const FacultyList = () => {
  const [faculty, setFaculty] = useState([]);
  const [batchDepartmentSections, setBatchDepartmentSections] = useState([]);
  const [loadingScheduleData, setLoadingScheduleData] = useState(true);
  const [search, setSearch] = useState("");
  
  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewDetailsModal, setViewDetailsModal] = useState(null); 

  const [saving, setSaving] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [facultyToDelete, setFacultyToDelete] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  
  // Custom Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [popup, setPopup] = useState({ show: false, type: "", message: "" });
  const popupTimerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showPopup = (type, message) => {
    if (popupTimerRef.current) window.clearTimeout(popupTimerRef.current);
    setPopup({ show: true, type, message });
    popupTimerRef.current = window.setTimeout(() => {
      setPopup({ show: false, type: "", message: "" });
    }, 3500);
  };

  const closePopup = () => {
    if (popupTimerRef.current) {
      window.clearTimeout(popupTimerRef.current);
      popupTimerRef.current = null;
    }
    setPopup({ show: false, type: "", message: "" });
  };

  useEffect(() => {
    return () => {
      if (popupTimerRef.current) window.clearTimeout(popupTimerRef.current);
    };
  }, []);

  const normalize = (value) => String(value || "").trim().toLowerCase();

  // ============================================================
  // FLATTEN NESTED ASSIGNMENTS WITH DUPLICATE PROTECTION
  // ============================================================
  const getFlattenedAllowdept = (allowdept) => {
    if (!allowdept || !Array.isArray(allowdept)) return [];
    const flat = [];
    const seen = new Set();

    allowdept.forEach((item) => {
      if (item?.batch && Array.isArray(item.classes)) {
        item.classes.forEach((cls) => {
          if (cls?.dept && cls?.sec) {
            const key = `${item.batch}-${cls.dept}-${cls.sec}`;
            if (!seen.has(key)) {
              seen.add(key);
              flat.push({
                batch: String(item.batch).trim(),
                dept: String(cls.dept).trim(),
                sec: String(cls.sec).trim(),
              });
            }
          }
        });
      } else if (item?.dept && item?.sec) {
        const batch = item.batch ? String(item.batch).trim() : "Unknown Batch";
        const key = `${batch}-${item.dept}-${item.sec}`;
        if (!seen.has(key)) {
          seen.add(key);
          flat.push({
            batch,
            dept: String(item.dept).trim(),
            sec: String(item.sec).trim(),
          });
        }
      }
    });

    return flat.sort((a, b) => a.batch.localeCompare(b.batch) || a.dept.localeCompare(b.dept) || a.sec.localeCompare(b.sec));
  };

  const getGroupedAllowdept = (member) => {
    const flatAssignments = getFlattenedAllowdept(member?.allowdept || member?.assignments);
    if (flatAssignments.length === 0) return [];
    const grouped = {};
    flatAssignments.forEach((item) => {
      if (!grouped[item.batch]) grouped[item.batch] = [];
      grouped[item.batch].push({ dept: item.dept, sec: item.sec });
    });
    return Object.keys(grouped).map((batch) => ({ batch, classes: grouped[batch] })).sort((a, b) => a.batch.localeCompare(b.batch));
  };

  // ============================================================
  // FETCH DATA
  // ============================================================
  const fetchScheduleData = async () => {
    try {
      setLoadingScheduleData(true);
      const result = await getScheduleFormData();
      if (result?.success === false) throw new Error(result?.message || "Unable to load data");
      const rows = result?.data?.batchDepartmentSections || result?.data?.departmentSections || result?.data?.sections || result?.data || [];
      setBatchDepartmentSections(Array.isArray(rows) ? rows : []);
    } catch (error) {
      showPopup("Error", "Unable to load department and section");
      setBatchDepartmentSections([]);
    } finally {
      setLoadingScheduleData(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const result = await getStaff();
      if (result?.success === false) throw new Error(result?.message || "Unable to load staff");
      const rows = result?.data?.staff || result?.data?.faculty || result?.data || [];
      setFaculty((Array.isArray(rows) ? rows : []).map((member, index) => ({ ...member, id: member?.id || member?._id || `staff-${index}-${Date.now()}`, phoneNo: member?.phoneNo || member?.phone || "", role: "staff" })));
    } catch (error) {
      showPopup("Error", "Unable to load staff");
      setFaculty([]);
    }
  };

  useEffect(() => { fetchScheduleData(); fetchStaff(); }, []);

  // ============================================================
  // OPTIONS BUILDER
  // ============================================================
  const flatFormSelections = getFlattenedAllowdept(form.allowdept);

  const allDepartmentSectionOptions = useMemo(() => {
    const unique = new Set();
    batchDepartmentSections.forEach((item) => {
      const batch = String(item?.batch || "").trim();
      const dept = String(item?.department || item?.dept || "").trim();
      const sec = String(item?.section || item?.sec || "").trim();
      if (batch && dept && sec) unique.add(`${normalize(batch)}|${normalize(dept)}|${normalize(sec)}`);
    });
    return Array.from(unique);
  }, [batchDepartmentSections]);

  const assignedDepartmentSectionsSize = useMemo(() => {
    const assigned = new Set();
    faculty.forEach((member) => {
      getFlattenedAllowdept(member.allowdept).forEach((item) => assigned.add(`${normalize(item.batch)}|${normalize(item.dept)}|${normalize(item.sec)}`));
    });
    return assigned.size;
  }, [faculty]);

  const globalAvailableClassesCount = Math.max(0, allDepartmentSectionOptions.length - assignedDepartmentSectionsSize);

  const availableGroupedOptions = useMemo(() => {
    const groups = {};
    batchDepartmentSections.forEach((item) => {
      const batch = String(item?.batch || "").trim();
      const dept = String(item?.department || item?.dept || "").trim();
      const sec = String(item?.section || item?.sec || "").trim();

      if (!batch || !dept || !sec) return;
      const isSelected = flatFormSelections.some(s => normalize(s.batch) === normalize(batch) && normalize(s.dept) === normalize(dept) && normalize(s.sec) === normalize(sec));
      
      if (!isSelected) {
        if (!groups[batch]) groups[batch] = [];
        const exists = groups[batch].some(c => c.dept === dept && c.sec === sec);
        if (!exists) groups[batch].push({ dept, sec });
      }
    });

    return Object.keys(groups).sort((a, b) => a.localeCompare(b)).map((batch) => ({ batch, classes: groups[batch].sort((a, b) => a.dept.localeCompare(b.dept) || a.sec.localeCompare(b.sec)) }));
  }, [batchDepartmentSections, flatFormSelections]);

  // ============================================================
  // FILTER FACULTY
  // ============================================================
  const filteredFaculty = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return faculty;

    return faculty.filter((member) => {
      const flatDepts = getFlattenedAllowdept(member.allowdept);
      return [member?.name, member?.email, member?.phoneNo, ...flatDepts.map((a) => `${a.batch} ${a.dept} ${a.sec}`)].filter(Boolean).some((field) => String(field).toLowerCase().includes(value));
    });
  }, [faculty, search]);

  const staff = filteredFaculty;

  // ============================================================
  // ADD & EDIT
  // ============================================================
  const handleAdd = () => {
    setEditingFaculty(null);
    setForm({ ...EMPTY_FORM, role: "staff", semester: "" });
    setModalOpen(true);
  };

  const handleEdit = (member) => {
    setEditingFaculty(member);
    setForm({
      name: member?.name || "",
      photo: member?.photo || "",
      allowdept: getGroupedAllowdept(member), // Full length grouped format for edit form
      semester: member?.semester || "",
      email: member?.email || "",
      phoneNo: member?.phoneNo || member?.phone || "",
      role: "staff",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingFaculty(null);
    setForm(EMPTY_FORM);
    setIsDropdownOpen(false);
  };

  const handleChange = (event) => setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  const handlePhoneChange = (event) => setForm((previous) => ({ ...previous, phoneNo: event.target.value.replace(/\D/g, "").slice(0, 10) }));

  // ============================================================
  // IMMUTABLE MULTI-SELECT HANDLERS
  // ============================================================
  const removeDepartmentSection = (batch, dept, sec) => {
    setForm((prev) => {
      const newAllowdept = prev.allowdept.map((batchGroup) => {
        if (normalize(batchGroup.batch) === normalize(batch)) {
          return { ...batchGroup, classes: batchGroup.classes.filter((c) => !(normalize(c.dept) === normalize(dept) && normalize(c.sec) === normalize(sec))) };
        }
        return batchGroup;
      }).filter((batchGroup) => batchGroup.classes.length > 0); 
      return { ...prev, allowdept: newAllowdept };
    });
  };

  const toggleDepartmentSection = (batch, dept, sec) => {
    setForm((prev) => {
      const newAllowdept = prev.allowdept.map(batchGroup => ({ ...batchGroup, classes: [...batchGroup.classes] }));
      const batchIndex = newAllowdept.findIndex((b) => normalize(b.batch) === normalize(batch));

      if (batchIndex >= 0) {
        const clsIndex = newAllowdept[batchIndex].classes.findIndex((c) => normalize(c.dept) === normalize(dept) && normalize(c.sec) === normalize(sec));
        if (clsIndex >= 0) {
          newAllowdept[batchIndex].classes.splice(clsIndex, 1);
          if (newAllowdept[batchIndex].classes.length === 0) newAllowdept.splice(batchIndex, 1);
        } else newAllowdept[batchIndex].classes.push({ dept, sec });
      } else newAllowdept.push({ batch, classes: [{ dept, sec }] });
      return { ...prev, allowdept: newAllowdept };
    });
  };

  // ============================================================
  // IMAGE PROCESSING
  // ============================================================
  const blobToDataURL = (blob) => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onloadend = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob); });
  const loadImage = (file) => new Promise((resolve, reject) => { const url = URL.createObjectURL(file); const image = new Image(); image.onload = () => { URL.revokeObjectURL(url); resolve(image); }; image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Unable to read image")); }; image.src = url; });

  const compressImage = async (file) => {
    const image = await loadImage(file);
    let width = image.naturalWidth || image.width; let height = image.naturalHeight || image.height;
    const scale = Math.min(MAX_IMAGE_WIDTH / width, MAX_IMAGE_HEIGHT / height, 1);
    width = Math.max(1, Math.round(width * scale)); height = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement("canvas"); const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is not supported");
    const qualities = [0.8, 0.7, 0.6, 0.5, 0.4, 0.3];
    let currentWidth = width, currentHeight = height;

    for (let sizeAttempt = 0; sizeAttempt < 6; sizeAttempt++) {
      canvas.width = currentWidth; canvas.height = currentHeight;
      context.clearRect(0, 0, currentWidth, currentHeight);
      context.fillStyle = "#ffffff"; context.fillRect(0, 0, currentWidth, currentHeight);
      context.drawImage(image, 0, 0, currentWidth, currentHeight);
      for (const quality of qualities) {
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
        if (!blob) continue;
        const dataURL = await blobToDataURL(blob);
        if (dataURL.length <= TARGET_BASE64_SIZE) return dataURL;
      }
      currentWidth = Math.max(120, Math.round(currentWidth * 0.75));
      currentHeight = Math.max(120, Math.round(currentHeight * 0.75));
    }
    throw new Error("Unable to compress photo enough.");
  };

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return showPopup("error", "Please select a valid image");
    if (file.size >= MAX_ORIGINAL_IMAGE_SIZE) return showPopup("error", "Photo must be less than 1MB");
    try {
      showPopup("success", "Compressing photo...");
      const compressed = await compressImage(file);
      setForm((prev) => ({ ...prev, photo: compressed }));
      showPopup("success", "Photo compressed successfully");
    } catch (error) { showPopup("error", "Unable to compress photo"); } 
    finally { event.target.value = ""; }
  };

  const validateForm = () => {
    if (!form.name.trim()) return showPopup("error", "Staff name is required") && false;
    if (!form.email.trim()) return showPopup("error", "Email is required") && false;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return showPopup("error", "Enter a valid email address") && false;
    if (!/^[0-9]{10}$/.test(form.phoneNo)) return showPopup("error", "Enter a valid 10 digit phone number") && false;
    if (flatFormSelections.length === 0) return showPopup("error", "Please select at least one class") && false;
    if (!form.semester.trim()) return showPopup("error", "Semester is required") && false;
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;
    try {
      setSaving(true);
      const isEditing = Boolean(editingFaculty);
      const id = editingFaculty?.id || editingFaculty?._id || null;

      const cleanAllowdept = form.allowdept.map((b) => ({ batch: String(b.batch).trim(), classes: b.classes.map((c) => ({ dept: String(c.dept).trim(), sec: String(c.sec).trim() })) }));
      const staffData = { name: form.name.trim(), allowdept: cleanAllowdept, semester: form.semester.trim(), email: form.email.trim(), phoneNo: form.phoneNo.trim(), role: "staff", photo: form.photo || editingFaculty?.photo || "" };
      const payload = { operation: isEditing ? "update" : "insert", data: { ...(isEditing && id ? { id, _id: id } : {}), ...staffData } };

      const result = await updateStaff(payload);
      if (result?.success === false) throw new Error(result?.message || "Unable to save staff");

      await fetchStaff();
      showPopup("success", isEditing ? "Staff updated successfully" : "Staff added successfully");
      closeModal();
    } catch (error) {
      showPopup("error", error?.response?.status === 413 ? "Photo is too large." : error?.response?.data?.message || "Unable to save staff");
    } finally { setSaving(false); }
  };

  const handleDeleteClick = (member) => { setFacultyToDelete(member); setDeleteModalOpen(true); };
  const handleDelete = async () => {
    if (!facultyToDelete) return;
    try {
      setSaving(true);
      const username = facultyToDelete?.username || facultyToDelete?.email;
      if (!username) throw new Error("Cannot delete: Username is missing.");
      const result = await deleteStaff({ username });
      if (result?.success === false) throw new Error(result?.message || "Unable to delete staff");
      await fetchStaff();
      setDeleteModalOpen(false); setFacultyToDelete(null);
      showPopup("success", "Staff deleted successfully");
    } catch (error) { showPopup("error", error?.response?.data?.message || error.message || "Unable to delete staff"); } 
    finally { setSaving(false); }
  };

  // ============================================================
  // TRUNCATED FACULTY CARD DISPLAY (COMPACT FOR GRID)
  // ============================================================
  const FacultyCard = ({ member }) => {
    const groupedAssignments = getGroupedAllowdept(member);
    const flatAssignments = getFlattenedAllowdept(member.allowdept);
    
    const firstBatch = groupedAssignments.length > 0 ? groupedAssignments[0] : null;
    const displayClasses = firstBatch ? firstBatch.classes.slice(0, 2) : [];
    const hiddenCount = flatAssignments.length - displayClasses.length;

    return (
      <article className="faculty-card">
        <div className="faculty-card-top">
          <div className="faculty-photo-wrapper">
            {member?.photo ? (
              <img src={member.photo} alt={member?.name || "Faculty"} className="faculty-photo" />
            ) : (
              <div className="faculty-photo-placeholder"><UserRound size={32} /></div>
            )}
          </div>
          <div className="faculty-card-actions">
            <button type="button" className="faculty-icon-btn edit" onClick={() => handleEdit(member)} title="Edit faculty"><Pencil size={16} /></button>
            <button type="button" className="faculty-icon-btn delete" onClick={() => handleDeleteClick(member)} title="Delete faculty"><Trash2 size={16} /></button>
          </div>
        </div>

        <div className="faculty-card-content">
          <span className="faculty-role">{"FACULTY"}</span>
          <h3>{member?.name || "Faculty"}</h3>

          <div className="faculty-card-assignments">
            {firstBatch ? (
              <div className="batch-assignment-group card-display-group">
                <div className="batch-assignment-header card-display-header">
                  <GraduationCap size={13} /> Batch: {firstBatch.batch}
                </div>
                <div className="batch-assignment-body card-display-body">
                  {displayClasses.map((cls, cIdx) => (
                    <div className="dept-sec-chip display-only" key={`card-${firstBatch.batch}-${cls.dept}-${cls.sec}-${cIdx}`}>
                      <div className="dept-sec-chip-text">{cls.dept} <span>• Sec {cls.sec}</span></div>
                    </div>
                  ))}
                  {hiddenCount > 0 && <div className="more-classes-indicator">+{hiddenCount} more</div>}
                </div>
              </div>
            ) : (
              <div className="faculty-section" style={{ justifyContent: "center", marginTop: "10px" }}>
                <GraduationCap size={16} /><span>Not Assigned</span>
              </div>
            )}
          </div>

          <button className="view-all-btn" onClick={() => setViewDetailsModal(member)}>
            <Eye size={15} /> View Full Profile
          </button>
        </div>
      </article>
    );
  };

  return (
    <div className="faculty-page">
      <header className="faculty-header">
        <div className="faculty-header-left">
          <div className="faculty-title-icon"><Users size={25} /></div>
          <div>
            <p className="faculty-eyebrow">ACADEMIC MANAGEMENT</p>
            <h1>Faculty Incharge</h1>
            <p className="faculty-subtitle">Manage faculty members and their assigned sections.</p>
          </div>
        </div>
        <button type="button" className="add-faculty-btn" onClick={handleAdd} disabled={loadingScheduleData}>
          <Plus size={20} /><span>Add Faculty</span>
        </button>
      </header>

      <section className="faculty-summary">
        <div className="summary-card">
          <div className="summary-icon"><Users size={21} /></div>
          <div><span>Total Faculty</span><strong>{faculty.length}</strong></div>
        </div>
        <div className="summary-card">
          <div className="summary-icon"><GraduationCap size={21} /></div>
          <div><span>Assigned Sections</span><strong>{assignedDepartmentSectionsSize}</strong></div>
        </div>
        <div className="summary-card">
          <div className="summary-icon"><UserRound size={21} /></div>
          <div><span>Staff</span><strong>{staff.length}</strong></div>
        </div>
        <div className="summary-card">
          <div className="summary-icon"><Plus size={21} /></div>
          <div><span>Available Classes</span><strong>{globalAvailableClassesCount}</strong></div>
        </div>
      </section>

      <div className="faculty-toolbar">
        <div className="faculty-search">
          <Search size={18} />
          <input type="text" placeholder="Search faculty, batch, branch or section..." value={search} onChange={(e) => setSearch(e.target.value)} />
          {search && (<button type="button" className="clear-search" onClick={() => setSearch("")}><X size={16} /></button>)}
        </div>
      </div>

      <section className="faculty-section-group">
        <div className="group-heading">
          <div><span className="group-label">ACADEMIC TEAM</span><h2>Staff Members</h2></div>
          <span className="group-count">{staff.length}</span>
        </div>

        {staff.length > 0 ? (
          <div className="faculty-grid">
            {staff.map((member) => <FacultyCard key={member.id} member={member} />)}
          </div>
        ) : (
          <div className="faculty-empty">
            <div className="empty-icon"><Users size={28} /></div>
            <h3>No faculty members found</h3>
            <p>{search ? "Try changing your search." : "Add your first faculty member to get started."}</p>
          </div>
        )}
      </section>

      {/* VIEW ALL DETAILS MODAL (FULL LENGTH) */}
      {viewDetailsModal && (
        <div className="faculty-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setViewDetailsModal(null); }}>
          <div className="faculty-modal view-details-modal">
            <div className="modal-header">
              <div>
                <span className="modal-eyebrow">FACULTY PROFILE</span>
                <h2>{viewDetailsModal.name}</h2>
                <p>Complete assigned classes and details.</p>
              </div>
              <button type="button" className="modal-close" onClick={() => setViewDetailsModal(null)}><X size={21} /></button>
            </div>
            
            <div className="modal-body">
              <div className="view-profile-info">
                <div className="view-profile-photo">
                  {viewDetailsModal.photo ? <img src={viewDetailsModal.photo} alt="Faculty" /> : <UserRound size={32} />}
                </div>
                <div className="view-profile-details">
                  <div className="vpd-item"><Mail size={14}/> {viewDetailsModal.email}</div>
                  <div className="vpd-item"><Phone size={14}/> {viewDetailsModal.phoneNo}</div>
                  <div className="vpd-item"><GraduationCap size={14}/> Semester {viewDetailsModal.semester}</div>
                </div>
              </div>

              <div className="view-assignments-container">
                <h4 className="static-field-label" style={{ marginLeft: 0, marginBottom: '12px' }}>All Assigned Classes</h4>
                <div className="selected-assignments form-selected-assignments-scroll">
                  {getGroupedAllowdept(viewDetailsModal).length > 0 ? (
                    getGroupedAllowdept(viewDetailsModal).map((group, idx) => (
                      <div className="batch-assignment-group" key={`modal-${group.batch}-${idx}`}>
                        <div className="batch-assignment-header">
                          <GraduationCap size={15} /> Batch: {group.batch}
                        </div>
                        <div className="batch-assignment-body">
                          {group.classes.map((cls, cIdx) => (
                            <div className="dept-sec-chip display-only" key={`modal-${group.batch}-${cls.dept}-${cls.sec}-${cIdx}`}>
                              <div className="dept-sec-chip-text">{cls.dept} <span>• Sec {cls.sec}</span></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="assignment-empty-state">
                      <div className="assignment-empty-icon"><AlertCircle size={16} /></div>
                      <div>
                        <strong>No classes assigned</strong>
                        <span>This staff member currently has no active assignments.</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button type="button" className="cancel-btn" onClick={() => setViewDetailsModal(null)} style={{ width: '100%' }}>Close Profile</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT MODAL (FULL LENGTH EDITABLE FORM) */}
      {modalOpen && (
        <div className="faculty-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="faculty-modal">
            <div className="modal-header">
              <div>
                <span className="modal-eyebrow">FACULTY MANAGEMENT</span>
                <h2>{editingFaculty ? "Edit Faculty" : "Add Faculty"}</h2>
                <p>Enter faculty details and assign classes.</p>
              </div>
              <button type="button" className="modal-close" onClick={closeModal} disabled={saving}><X size={21} /></button>
            </div>

            <form onSubmit={handleSubmit} className="form-con  form-selected-assignments-scroll">
              <div className="modal-body">
                <div className="input-wrapper">
                  <UserRound size={17} />
                  <input name="name" value={form.name} onChange={handleChange} placeholder="Faculty name" autoComplete="name" />
                </div>

                <div className="form-row">
                  <div className="input-wrapper">
                    <Mail size={17} />
                    <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Faculty email" autoComplete="email" />
                  </div>
                  <div className="input-wrapper">
                    <Phone size={17} />
                    <input name="phoneNo" value={form.phoneNo} onChange={handlePhoneChange} placeholder="10 digit phone number" maxLength={10} inputMode="numeric" />
                  </div>
                </div>

                <div className="form-row" style={{ marginTop: "16px" }}>
                  <div className="form-group">
                    <label className="static-field-label">Role</label>
                    <div className="static-role-field">
                      <div className="static-role-icon"><UserRound size={17} /></div>
                      <div className="static-role-content"><span className="static-role-value">Staff</span></div>
                    </div>
                  </div>

                  <div className="form-group academic-detail-group">
                    <label className="static-field-label">Semester</label>
                    <ThemeDropdown icon={GraduationCap} value={form.semester} options={["odd", "even"]} onChange={(value) => setForm((prev) => ({ ...prev, semester: value }))} placeholder="Select Semester" disabled={saving} />
                  </div>
                </div>

                <div className="form-group faculty-assignment-group" style={{ marginTop: "6px" }}>
                  <label className="static-field-label">Assigned Classes</label>
                  
                  <div className="custom-multi-select" ref={dropdownRef}>
                    <div className={`select-trigger ${isDropdownOpen ? 'open' : ''}`} onClick={() => !loadingScheduleData && setIsDropdownOpen(!isDropdownOpen)}>
                      <div className="trigger-text">
                        <GraduationCap size={16} />
                        {loadingScheduleData ? "Loading..." : `Select Classes (${flatFormSelections.length} Selected)`}
                      </div>
                      <ChevronDown size={18} className="trigger-icon" />
                    </div>

                    {isDropdownOpen && (
                      <div className="select-dropdown">
                        {availableGroupedOptions.length === 0 ? (
                          <div className="select-no-options">No classes available</div>
                        ) : (
                          availableGroupedOptions.map(group => (
                            <div key={group.batch} className="select-group">
                              <div className="select-group-title">{group.batch}</div>
                              {group.classes.map(cls => (
                                <div key={`${group.batch}-${cls.dept}-${cls.sec}`} className="select-option" onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleDepartmentSection(group.batch, cls.dept, cls.sec); }}>
                                  <span>{cls.dept} - Section {cls.sec}</span>
                                </div>
                              ))}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {form.allowdept.length > 0 ? (
                    <div className="selected-assignments">
                      {form.allowdept.map((batchGroup, bIdx) => (
                        <div className="batch-assignment-group" key={`form-${batchGroup.batch}-${bIdx}`}>
                          <div className="batch-assignment-header">
                            <GraduationCap size={15} /> Batch: {batchGroup.batch}
                          </div>
                          <div className="batch-assignment-body">
                            {batchGroup.classes.map((cls, cIdx) => (
                              <div className="dept-sec-chip" key={`form-${batchGroup.batch}-${cls.dept}-${cls.sec}-${cIdx}`}>
                                <div className="dept-sec-chip-text">
                                  {cls.dept} <span>• Sec {cls.sec}</span>
                                </div>
                                <button type="button" className="dept-sec-chip-remove" onClick={(e) => { e.stopPropagation(); removeDepartmentSection(batchGroup.batch, cls.dept, cls.sec); }} disabled={saving} title={`Remove ${cls.dept} Section ${cls.sec}`}>
                                  <X size={13} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="assignment-empty-state">
                      <div className="assignment-empty-icon"><Plus size={16} /></div>
                      <div>
                        <strong>No classes assigned</strong>
                        <span>Use the dropdown above to assign a branch & section.</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="cancel-btn" onClick={closeModal} disabled={saving}>Cancel</button>
                <button type="submit" className="save-btn" disabled={saving || loadingScheduleData || flatFormSelections.length === 0}>
                  {saving ? <><span className="button-spinner" /> Saving...</> : (editingFaculty ? "Update Faculty" : "Add Faculty")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteModalOpen && facultyToDelete && (
        <div className="faculty-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) { setDeleteModalOpen(false); setFacultyToDelete(null); } }}>
          <div className="delete-modal">
            <div className="delete-icon"><Trash2 size={25} /></div>
            <h2>Delete Faculty?</h2>
            <p>Are you sure you want to delete <strong>{facultyToDelete.name}</strong>?</p>
            <div className="delete-modal-actions">
              <button type="button" className="cancel-btn" onClick={() => { if (saving) return; setDeleteModalOpen(false); setFacultyToDelete(null); }} disabled={saving}>Cancel</button>
              <button type="button" className="confirm-delete-btn" onClick={handleDelete} disabled={saving}>
                {saving ? <><span className="button-spinner" /> Deleting...</> : <><Trash2 size={17} /> Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP */}
      {popup.show && (
        <div className="faculty-popup-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) closePopup(); }}>
          <div className={`faculty-popup-card ${popup.type}`} role="alert">
            <div className="faculty-popup-icon">{popup.type === "success" ? <CheckCircle2 size={28} /> : <AlertCircle size={28} />}</div>
            <div className="faculty-popup-content">
              <h3>{popup.type === "success" ? "Success" : "Something went wrong"}</h3>
              <p>{popup.message}</p>
            </div>
            <button type="button" className="faculty-popup-close" onClick={closePopup}><X size={18} /></button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyList;