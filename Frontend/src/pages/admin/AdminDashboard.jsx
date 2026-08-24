import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ClipboardList, CalendarDays, Activity, CircleCheck
} from "lucide-react";
export default function AdminDashboard() {

    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [department, setDepartment] = useState("All");
    const [category, setCategory] = useState("All");
    const [status, setStatus] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 5;
    const [selectedDate, setSelectedDate] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        setCurrentPage(1);
    }, [search, department, category, status, selectedDate]);

    useEffect(() => {
        const fetchTests = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await fetch("http://localhost:5000/api/staff/schedule/getscheduleexams");
                if (!response.ok) {
                    throw new Error(`HTTP error: ${response.status}`);
                }

                const result = await response.json();

                if (!result.success) {
                    throw new Error("Failed to fetch exam data");
                }

                const formattedTests = result.data.map((exam) => ({
                    id: exam.examId,

                    department: exam.department || "N/A",

                    category: exam.category || "N/A",

                    section: exam.section || "N/A",

                    date: exam.startTime
                        ? new Date(exam.startTime).toLocaleDateString("en-CA")
                        : "N/A",

                    time: exam.startTime
                        ? new Date(exam.startTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        })
                        : "N/A",

                    duration: exam.duration || 0,

                    testCode: exam.testcode || "N/A",

                    status: exam.status || "N/A",

                    questionSetId: exam.questionSetId,

                    startTime: exam.startTime,

                    endTime: exam.endTime,

                    admissionNo: exam.admissionNo || [],
                }));

                setTests(formattedTests);

            } catch (err) {
                console.error("Error fetching tests:", err);
                setError("Unable to load tests.");
            } finally {
                setLoading(false);
            }
        };

        fetchTests();
    }, []);

    // ==========================================================
    // SUMMARY
    // ==========================================================

    const totalExams = tests.length;

    const todaysTests = tests.filter(
        (t) => t.date === new Date().toLocaleDateString("en-CA")
    ).length;

    const activeTests = tests.filter(
        (t) => t.status === "Ongoing"
    ).length;

    const completedTests = tests.filter(
        (t) => t.status === "Completed"
    ).length;

    // ==========================================================
    // FILTERED DATA
    // ==========================================================

    const filteredTests = useMemo(() => {
        return tests.filter((test) => {

            const matchSearch = (test.testCode || "")
                .toLowerCase()
                .includes(search.toLowerCase());

            const matchDepartment =
                department === "All" ||
                test.department === department;

            const matchCategory =
                category === "All" ||
                test.category === category;

            const matchStatus =
                status === "All" ||
                test.status === status;

            const matchDate =
                selectedDate === "" ||
                test.date === selectedDate;

            return (
                matchSearch &&
                matchDepartment &&
                matchCategory &&
                matchStatus &&
                matchDate
            );
        });
    }, [tests, search, department, category, status, selectedDate]);

    const totalPages = Math.ceil(
        filteredTests.length / recordsPerPage
    );

    const startIndex = (currentPage - 1) * recordsPerPage;

    const paginatedTests = filteredTests.slice(
        startIndex,
        startIndex + recordsPerPage
    );



    return (
        <div className="w-full min-h-screen bg-gray-100">

            <main className="flex-1 px-6 py-8">

                {loading && (
                    <div className="mt-8 bg-white rounded-xl border border-gray-200 p-12 text-center">
                        <p className="text-gray-500">
                            Loading tests...
                        </p>
                    </div>
                )}

                {error && (
                    <div className="mt-8 bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                        <p className="text-red-600 font-semibold">
                            {error}
                        </p>
                    </div>
                )}

                {/* HEADER */}

                <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-5">

                    <div>

                        <h1 className="text-3xl font-bold text-[#7a1f2b]">
                            Admin Dashboard
                        </h1>

                        <p className="mt-2 text-gray-500">
                            Manage English Audio Listening Tests
                        </p>

                    </div>

                    <button
                        type="button"
                        onClick={() => navigate("/admin/schedule")}
                        className="px-6 py-3 rounded-lg bg-[#FDCC03] hover:bg-[#7a1f2b] hover:text-white font-semibold transition"
                    >
                        + Schedule Test
                    </button>

                </div>

                {/* SUMMARY CARDS */}

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-8">

                    <SummaryCard
                        title="Total Exams"
                        value={totalExams}
                        type="total"
                    />

                    <SummaryCard
                        title="Today's Tests"
                        value={todaysTests}
                        type="today"
                    />

                    <SummaryCard
                        title="Active Tests"
                        value={activeTests}
                        type="active"
                    />

                    <SummaryCard
                        title="Completed Tests"
                        value={completedTests}
                        type="completed"
                    />

                </div>

                {/* ==========================================================
            FILTER BAR
        ========================================================== */}

                <div className="mt-8 bg-white border border-gray-200 rounded-xl p-6">

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">

                        {/* SEARCH */}

                        <div>



                            <input
                                type="text"
                                placeholder="Search Question Code"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="
                w-full
                h-11
                px-4
                rounded-lg
                border
                border-gray-300
                focus:outline-none
                focus:ring-2
                focus:ring-yellow-300
                focus:border-[#FDCC03]
                "
                            />

                        </div>

                        {/* DEPARTMENT */}

                        <div>



                            <select
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                                className="
            w-full
            h-11
            px-3
            rounded-lg
            border
            border-gray-300
            focus:outline-none
            focus:ring-2
            focus:ring-yellow-300
            focus:border-[#FDCC03]
        "
                            >

                                <option value="All">
                                    All Departments
                                </option>

                                {[...new Set(tests.map((item) => item.department))]
                                    .filter(Boolean)
                                    .map((item) => (
                                        <option
                                            key={item}
                                            value={item}
                                        >
                                            {item}
                                        </option>
                                    ))}

                            </select>

                        </div>

                        {/* CATEGORY */}

                        <div>

                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="
        w-full
        h-11
        px-3
        rounded-lg
        border
        border-gray-300
        focus:outline-none
        focus:ring-2
        focus:ring-yellow-300
        focus:border-[#FDCC03]
    "
                            >
                                <option value="All">
                                    All Categories
                                </option>

                                <option value="All">
                                    Re-Test
                                </option>

                                {[...new Set(tests.map((item) => item.category))]
                                    .filter(Boolean)
                                    .map((item) => (
                                        <option
                                            key={item}
                                            value={item}
                                        >
                                            {item}
                                        </option>
                                    ))}
                            </select>

                        </div>

                        {/* DATE */}

                        <div>


                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) =>
                                    setSelectedDate(e.target.value)
                                }
                                className="
                w-full
                h-11
                px-3
                rounded-lg
                border
                border-gray-300
                focus:outline-none
                focus:ring-2
                focus:ring-yellow-300
                focus:border-[#FDCC03]
                "
                            />

                        </div>

                        {/* STATUS */}

                        <div>

                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="
                w-full
                h-11
                px-3
                rounded-lg
                border
                border-gray-300
                focus:outline-none
                focus:ring-2
                focus:ring-yellow-300
                focus:border-[#FDCC03]
                "
                            >

                                <option value="All">
                                    All Status
                                </option>

                                <option value="Completed">
                                    Completed
                                </option>

                                <option value="Ongoing">
                                    Ongoing
                                </option>

                                <option value="Upcoming">
                                    Upcoming
                                </option>

                            </select>

                        </div>

                    </div>

                </div>

                {/* ==========================================================
            TABLE
        ========================================================== */}

                <div className="mt-8 bg-white rounded-xl border border-gray-200 overflow-hidden">

                    {/* TABLE HEADER */}

                    <div className="hidden lg:grid grid-cols-[1.2fr_1.2fr_0.7fr_1fr_1fr_0.8fr_1fr_1fr] items-center gap-4 bg-gray-50 border-b border-gray-200 px-6">

                        <TableHeading>
                            Department
                        </TableHeading>

                        <TableHeading>
                            Category
                        </TableHeading>

                        <TableHeading>
                            Section
                        </TableHeading>

                        <TableHeading>
                            Date
                        </TableHeading>

                        <TableHeading>
                            Time
                        </TableHeading>

                        <TableHeading>
                            Duration
                        </TableHeading>

                        <TableHeading>
                            Test Code
                        </TableHeading>

                        <TableHeading>
                            Status
                        </TableHeading>

                    </div>

                    {/* TABLE BODY */}

                    {filteredTests.length === 0 ? (

                        <div className="py-24 text-center">

                            <h2 className="text-2xl font-bold">
                                No Tests Found
                            </h2>

                            <p className="mt-2 text-gray-500">
                                No matching records available.
                            </p>

                        </div>

                    ) : (

                        paginatedTests.map((test) => (

                            <div
                                key={test.id}
                                className="
                grid
                lg:grid-cols-[1.2fr_1.2fr_0.7fr_1fr_1fr_0.8fr_1fr_1fr]
                items-center
                px-6
                gap-4
                py-5
                border-b
                border-gray-100
                hover:bg-yellow-50/40
                transition
            "
                            >

                                {/* DEPARTMENT */}

                                <div className="flex items-center justify-center">
                                    <span className="font-semibold text-gray-900">
                                        {test.department}
                                    </span>
                                </div>

                                {/* CATEGORY */}

                                <div className="flex items-center justify-center">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            {test.category}
                                        </h3>


                                    </div>
                                </div>


                                {/* SECTION */}

                                <div className="flex items-center justify-center">

                                    <span className="font-semibold">
                                        {test.section}
                                    </span>

                                </div>



                                {/* DATE */}

                                <div className="flex items-center justify-center text-gray-600">
                                    {test.date}
                                </div>


                                {/* TIME */}

                                <div className="flex items-center justify-center text-gray-600">
                                    {test.time}
                                </div>

                                <div className="flex items-center justify-center text-gray-600">
                                    {test.duration} min
                                </div>


                                {/* TEST CODE */}

                                <div className="flex items-center justify-center">

                                    <span
                                        className="
                        px-3
                        py-1
                        rounded-full
                        bg-gray-100
                        text-sm
                        font-semibold
                    "
                                    >
                                        {test.testCode}
                                    </span>

                                </div>


                                {/* STATUS */}

                                <div className="flex items-center justify-center">

                                    <StatusBadge
                                        status={test.status}
                                    />

                                </div>

                            </div>

                        ))

                    )}

                </div>

                {/* ==========================================================
            PAGINATION
        ========================================================== */}

                <div className="mt-6 flex items-center justify-between">

                    <p className="text-sm text-gray-500">
                        {filteredTests.length === 0
                            ? "Showing 0 Records"
                            : `Showing ${startIndex + 1}-${Math.min(
                                startIndex + recordsPerPage,
                                filteredTests.length
                            )} of ${filteredTests.length} Records`
                        }
                    </p>

                    <div className="flex items-center gap-3">

                        {currentPage > 1 && (
                            <button
                                onClick={() => setCurrentPage(currentPage - 1)}
                                className="
                    px-4
                    py-2
                    rounded-lg
                    border
                    border-gray-300
                    hover:bg-gray-100
                    transition
                "
                            >
                                Previous
                            </button>
                        )}

                        {totalPages > 0 && (
                            <span
                                className="
                    px-4
                    py-2
                    rounded-lg
                    bg-[#FDCC03]
                    font-semibold
                "
                            >
                                {currentPage}
                            </span>
                        )}

                        {currentPage < totalPages && (
                            <button
                                onClick={() => setCurrentPage(currentPage + 1)}
                                className="
                    px-4
                    py-2
                    rounded-lg
                    border
                    border-gray-300
                    hover:bg-gray-100
                    transition
                "
                            >
                                Next
                            </button>
                        )}

                    </div>

                </div>

            </main>

        </div>
    );
}

/* ==========================================================
   SUMMARY CARD
========================================================== */
function SummaryCard({ title, value, type }) {

    const descriptions = {
        total: "All scheduled exams",
        today: "Scheduled for today",
        active: "Currently in progress",
        completed: "Successfully completed",
    };

    return (
        <div
            className="
                relative
                bg-white
                border
                border-gray-200
                rounded-xl
                px-5
                py-4
                overflow-hidden
                transition-all
                duration-200
                hover:shadow-md
                hover:border-gray-300
            "
        >

            {/* TOP ACCENT */}

            <div className="flex items-center gap-2">

                <div className="w-1.5 h-1.5 rounded-full bg-[#FDCC03]" />

                <p className="
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wider
                    text-gray-500
                ">
                    {title}
                </p>

            </div>

            {/* MAIN CONTENT */}

            <div className="mt-3 flex items-end justify-between">

                <div className="flex items-baseline gap-2">

                    <span className="
                        text-4xl
                        leading-none
                        font-semibold
                        tracking-tight
                        text-[#7a1f2b]
                    ">
                        {String(value).padStart(2, "0")}
                    </span>

                    <span className="
                        text-xs
                        text-gray-400
                    ">
                        exams
                    </span>

                </div>

                <p className="
                    max-w-[120px]
                    text-right
                    text-[11px]
                    leading-4
                    text-gray-400
                ">
                    {descriptions[type]}
                </p>

            </div>

            {/* DIVIDER */}

            <div className="
                mt-4
                border-t
                border-gray-100
            " />

            {/* BOTTOM */}

            <div className="
                mt-2
                flex
                items-center
                justify-between
            ">

                <span className="
                    text-[10px]
                    uppercase
                    tracking-wide
                    text-gray-300
                ">
                    Dashboard
                </span>

                <span className="
                    text-[10px]
                    font-medium
                    text-gray-400
                ">
                    2026
                </span>

            </div>

        </div>
    );
}

/* ==========================================================
   TABLE HEADER
========================================================== */

function TableHeading({ children }) {
    return (
        <div className="py-4 flex items-center justify-center">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 text-center w-full">
                {children}
            </p>
        </div>
    );
}

/* ==========================================================
   STATUS BADGE
========================================================== */

function StatusBadge({ status }) {

    if (status === "Completed") {

        return (
            <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">

                <span className="w-2 h-2 rounded-full bg-green-500"></span>

                Completed

            </span>
        );

    }

    if (status === "Ongoing") {

        return (
            <span className="inline-flex items-center gap-2 rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">

                <span className="relative flex h-2 w-2">

                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FDCC03] opacity-60"></span>

                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FDCC03]"></span>

                </span>

                Ongoing

            </span>
        );

    }

    return (
        <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">

            <span className="w-2 h-2 rounded-full bg-gray-400"></span>

            Upcoming

        </span>
    );

}