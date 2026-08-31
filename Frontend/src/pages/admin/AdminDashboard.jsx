import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteScheduledExam, getScheduleExams } from "../../services/adminService";
import ThemeDropdown from "../../components/common/ThemeDropDown";
export default function AdminDashboard() {

    const navigate = useNavigate();

    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [department, setDepartment] = useState("All");
    const [category, setCategory] = useState("All");
    const [status, setStatus] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedDate, setSelectedDate] = useState("");

    const recordsPerPage = 5;
    const getDynamicStatus = (startTime, endTime) => {
        if (!startTime || !endTime) {
            return "Upcoming";
        }
        const now = new Date();
        const start = new Date(startTime);
        const end = new Date(endTime);
        if (now < start) {
            return "Upcoming";
        }
        if (now >= start && now <= end) {
            return "Ongoing";
        }
        return "Completed";
    };
    useEffect(() => {
        let interval;
        let isMounted = true;
        const fetchTests = async () => {
            try {
                setError("");

                const result = await getScheduleExams();

                if (!result.success) {
                    throw new Error(
                        result.message || "Failed to fetch exam data"
                    );
                }

                const formattedTests = (result.data || []).map((exam) => ({
                    id: exam.examId,

                    department: exam.department || "N/A",

                    category: exam.category || "N/A",

                    section: exam.section || "N/A",

                    date: exam.startTime
                        ? new Date(exam.startTime).toLocaleDateString("en-CA")
                        : "N/A",

                    testCode: exam.testcode || "N/A",

                    status: getDynamicStatus(
                        exam.startTime,
                        exam.endTime
                    ),

                    questionSetId: exam.questionSetId,

                    startTime: exam.startTime,

                    endTime: exam.endTime,

                    admissionNo: exam.admissionNo || [],
                }));

                // Prevent state updates after component unmount
                if (isMounted) {
                    setTests(formattedTests);
                }

            } catch (err) {

                console.error(
                    "Error fetching scheduled exams:",
                    err
                );

                if (isMounted) {
                    setError(
                        "Unable to load tests."
                    );
                }

            } finally {

                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        // Initial fetch
        fetchTests();

        // Refresh every 10 seconds
        interval = setInterval(fetchTests, 10000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };

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
        const filtered = tests.filter((test) => {

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
                matchDepartment &&
                matchCategory &&
                matchStatus &&
                matchDate
            );
        });

        // Ongoing → Upcoming → Completed
        const statusPriority = {
            Ongoing: 1,
            Upcoming: 2,
            Completed: 3,
        };

        filtered.sort((a, b) => {

            // First sort by status
            const statusDifference =
                statusPriority[a.status] - statusPriority[b.status];

            if (statusDifference !== 0) {
                return statusDifference;
            }

            // Ongoing → earliest end time first
            if (a.status === "Ongoing") {
                return new Date(a.endTime) - new Date(b.endTime);
            }

            // Upcoming → earliest start time first
            if (a.status === "Upcoming") {
                return new Date(a.startTime) - new Date(b.startTime);
            }

            // Completed → latest completed test first
            if (a.status === "Completed") {
                return new Date(b.endTime) - new Date(a.endTime);
            }

            return 0;
        });

        return filtered;

    }, [tests, department, category, status, selectedDate]);

    // ==========================================================
    // PAGINATION
    // ==========================================================

    const totalPages = Math.ceil(
        filteredTests.length / recordsPerPage
    );

    const startIndex = (currentPage - 1) * recordsPerPage;

    const paginatedTests = filteredTests.slice(
        startIndex,
        startIndex + recordsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [department, category, status, selectedDate]);

    const handleCancel = async (test) => {

        const confirmed = window.confirm(
            `Are you sure you want to cancel test ?`
        );

        if (!confirmed) return;

        try {

            const result = await deleteScheduledExam(test.id);

            if (!result.success) {
                throw new Error(
                    result.message ||
                    "Failed to cancel the test."
                );
            }

            // Remove from dashboard
            setTests((prevTests) =>
                prevTests.filter(
                    (item) => item.id !== test.id
                )
            );

            toast.success("Test cancelled successfully.");

        } catch (error) {

            console.error(
                "Error cancelling the test:",
                error
            );

            toast.error(
                "Unable to cancel the test."
            );
        }
    };



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

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

                        {/* DEPARTMENT */}

                        <div>

                            <ThemeDropdown
                                value={department}
                                options={[
                                    "All",
                                    ...[...new Set(tests.map((item) => item.department))]
                                        .filter(Boolean),
                                ]}
                                onChange={setDepartment}
                                placeholder="Select Branch"
                            />

                        </div>

                        {/* CATEGORY */}

                        <div>

                            {/* CATEGORY */}
                            <div>
                                <ThemeDropdown
                                    value={category}
                                    options={[
                                        "All",
                                        "Re-Test",
                                        ...[...new Set(tests.map((item) => item.category))]
                                            .filter(Boolean)
                                            .filter((item) => item !== "Re-Test"),
                                    ]}
                                    onChange={setCategory}
                                    placeholder="Select Category"
                                />
                            </div>

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

                        {/* STATUS */}
                        <div>
                            <ThemeDropdown
                                value={status}
                                options={[
                                    "All",
                                    "Completed",
                                    "Ongoing",
                                    "Upcoming",
                                ]}
                                onChange={setStatus}
                                placeholder="Select Status"
                            />
                        </div>

                    </div>

                </div>

                {/* ==========================================================
            TABLE
        ========================================================== */}

                <div className="mt-8 bg-white rounded-xl border border-gray-200 overflow-x-auto">


                    {/* TABLE HEADER */}

                    <div
                        className="hidden lg:grid items-center gap-4 bg-gray-50 border-b border-gray-200 px-6"
                        style={{
                            gridTemplateColumns:
                                "1.2fr 0.9fr 1.2fr 1fr 1fr 1fr 1fr 1fr 0.8fr"
                        }}
                    >
                        <TableHeading>
                            Branch
                        </TableHeading>

                        <TableHeading>
                            Section
                        </TableHeading>

                        <TableHeading>
                            Category
                        </TableHeading>

                        <TableHeading>
                            Date
                        </TableHeading>

                        <TableHeading>
                            Start Time
                        </TableHeading>

                        <TableHeading>
                            End Time
                        </TableHeading>

                        <TableHeading>
                            Test Code
                        </TableHeading>

                        <TableHeading>
                            Status
                        </TableHeading>

                        <TableHeading>
                            Action
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
        items-center
        gap-4
        px-6
        py-5
        border-b
        border-gray-100
        hover:bg-yellow-50/40
        transition
    "
                                style={{
                                    gridTemplateColumns:
                                        "1.2fr 0.9fr 1.2fr 1fr 1fr 1fr 1fr 1fr 0.8fr"
                                }}
                            >

                                {/* DEPARTMENT */}

                                <div className="flex items-center justify-center">
                                    <span className="font-semibold text-gray-900">
                                        {test.department}
                                    </span>
                                </div>

                                {/* SECTION */}

                                <div className="flex items-center justify-center">
                                    <span className="font-semibold">
                                        {test.section}
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



                                {/* DATE */}

                                <div className="flex items-center justify-center text-gray-600">
                                    {test.date}
                                </div>


                                {/* START TIME */}
                                <div className="flex items-center justify-center text-gray-600">
                                    {test.startTime
                                        ? new Date(test.startTime).toLocaleTimeString("en-US", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            hour12: true,
                                        })
                                        : "N/A"}
                                </div>

                                {/* END TIME */}
                                <div className="flex items-center justify-center text-gray-600">
                                    {test.endTime
                                        ? new Date(test.endTime).toLocaleTimeString("en-US", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            hour12: true,
                                        })
                                        : "N/A"}
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




                                {/* ACTION */}

                                <div className="flex items-center justify-center">
                                    <button
                                        type="button"
                                        disabled={test.status !== "Upcoming"}
                                        onClick={() => handleCancel(test)}
                                        className={`
            px-3
            py-2
            rounded-lg
            text-xs
            font-semibold
            border
            transition-all
            duration-200

            ${test.status === "Upcoming"
                                                ? `
                        border-red-200
                        bg-red-50
                        text-red-600
                        hover:bg-red-600
                        hover:text-white
                        cursor-pointer
                    `
                                                : `
                        border-gray-200
                        bg-gray-100
                        text-gray-400
                        cursor-not-allowed
                        opacity-70
                    `
                                            }
        `}
                                    >
                                        Cancel
                                    </button>
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
                    {new Date().getFullYear()}
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