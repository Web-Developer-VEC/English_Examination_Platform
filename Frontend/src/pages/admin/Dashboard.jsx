import React, { useMemo, useState } from "react";

export default function AdminDashboard() {

    // ==========================================================
    // DUMMY BACKEND DATA
    // ==========================================================

    const [tests] = useState([
        {
            id: 1,
            department: "Artificial Intelligence & Data Science",
            section: "A",
            students: 62,
            date: "2026-08-07",
            time: "09:00 AM",
            testCode: "ENG001",
            status: "Completed",
        },
        {
            id: 2,
            department: "Computer Science Engineering",
            section: "B",
            students: 58,
            date: "2026-08-07",
            time: "10:00 AM",
            testCode: "ENG002",
            status: "Ongoing",
        },
        {
            id: 3,
            department: "Information Technology",
            section: "A",
            students: 54,
            date: "2026-08-08",
            time: "09:30 AM",
            testCode: "ENG003",
            status: "Upcoming",
        },
        {
            id: 4,
            department: "Electronics & Communication Engineering",
            section: "C",
            students: 60,
            date: "2026-08-08",
            time: "11:00 AM",
            testCode: "ENG004",
            status: "Upcoming",
        },
        {
            id: 5,
            department: "Electrical & Electronics Engineering",
            section: "A",
            students: 57,
            date: "2026-08-09",
            time: "09:00 AM",
            testCode: "ENG005",
            status: "Completed",
        },
        {
            id: 6,
            department: "Mechanical Engineering",
            section: "B",
            students: 59,
            date: "2026-08-09",
            time: "11:00 AM",
            testCode: "ENG006",
            status: "Completed",
        },
        {
            id: 7,
            department: "Civil Engineering",
            section: "A",
            students: 61,
            date: "2026-08-10",
            time: "09:30 AM",
            testCode: "ENG007",
            status: "Upcoming",
        },
        {
            id: 8,
            department: "Biomedical Engineering",
            section: "A",
            students: 48,
            date: "2026-08-10",
            time: "02:00 PM",
            testCode: "ENG008",
            status: "Upcoming",
        },
    ]);

    // ==========================================================
    // STATES
    // ==========================================================

    const [search, setSearch] = useState("");
    const [department, setDepartment] = useState("All");
    const [status, setStatus] = useState("All");
    const [selectedDate, setSelectedDate] = useState("");

    // ==========================================================
    // SUMMARY
    // ==========================================================

    const totalDepartments = new Set(
        tests.map((t) => t.department)
    ).size;

    const totalStudents = tests.reduce(
        (sum, t) => sum + t.students,
        0
    );

    const todaysTests = tests.filter(
        (t) => t.date === "2026-08-07"
    ).length;

    const activeTests = tests.filter(
        (t) => t.status === "Ongoing"
    ).length;

    // ==========================================================
    // FILTERED DATA
    // ==========================================================

    const filteredTests = useMemo(() => {
        return tests.filter((test) => {
            const matchSearch = test.testCode
                .toLowerCase()
                .includes(search.toLowerCase());

            const matchDepartment =
                department === "All" ||
                test.department === department;

            const matchStatus =
                status === "All" ||
                test.status === status;

            const matchDate =
                selectedDate === "" ||
                test.date === selectedDate;

            return (
                matchSearch &&
                matchDepartment &&
                matchStatus &&
                matchDate
            );
        });
    }, [tests, search, department, status, selectedDate]);

    const handleDownload = (test) => {
        const content = `
Test Code: ${test.testCode}
Department: ${test.department}
Section: ${test.section}
Students: ${test.students}
Date: ${test.date}
Time: ${test.time}
Status: ${test.status}
`;

        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `${test.testCode}.txt`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    };

    return (
        <div className="w-full min-h-screen bg-gray-100">

            <main className="flex-1 px-6 py-8">

                {/* HEADER */}

                <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-5">

                    <div>

                        <h1 className="text-3xl font-bold text-black">
                            Admin Dashboard
                        </h1>

                        <p className="mt-2 text-gray-500">
                            Manage English Audio Listening Tests
                        </p>

                    </div>

                    <button className="px-6 py-3 rounded-lg bg-[#FDCC03] hover:bg-yellow-400 font-semibold transition">

                        + Schedule Test

                    </button>

                </div>

                {/* SUMMARY CARDS */}

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-8">

                    <SummaryCard
                        title="Total Departments"
                        value={totalDepartments}
                    />

                    <SummaryCard
                        title="Total Students"
                        value={totalStudents}
                    />

                    <SummaryCard
                        title="Today's Tests"
                        value={todaysTests}
                    />

                    <SummaryCard
                        title="Active Tests"
                        value={activeTests}
                    />

                </div>

                {/* ==========================================================
            FILTER BAR
        ========================================================== */}

                <div className="mt-8 bg-white border border-gray-200 rounded-xl p-6">

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

                        {/* SEARCH */}

                        <div>

                            <label className="block mb-2 text-sm font-semibold text-gray-600">
                                Search Test Code
                            </label>

                            <input
                                type="text"
                                placeholder="Search..."
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

                            <label className="block mb-2 text-sm font-semibold text-gray-600">
                                Department
                            </label>

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

                                {[
                                    ...new Set(
                                        tests.map((item) => item.department)
                                    ),
                                ].map((dept) => (

                                    <option
                                        key={dept}
                                        value={dept}
                                    >
                                        {dept}
                                    </option>

                                ))}

                            </select>

                        </div>

                        {/* DATE */}

                        <div>

                            <label className="block mb-2 text-sm font-semibold text-gray-600">
                                Date
                            </label>

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

                            <label className="block mb-2 text-sm font-semibold text-gray-600">
                                Status
                            </label>

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

                    <div className="hidden lg:grid grid-cols-[3fr_0.7fr_0.8fr_1.1fr_1.1fr_1fr_1.2fr_0.9fr_0.9fr] items-center gap-4 bg-gray-50 border-b border-gray-200 px-6">

                        <TableHeading>
                            Department
                        </TableHeading>

                        <TableHeading>
                            Section
                        </TableHeading>

                        <TableHeading>
                            Students
                        </TableHeading>

                        <TableHeading>
                            Date
                        </TableHeading>

                        <TableHeading>
                            Time
                        </TableHeading>

                        <TableHeading>
                            Test Code
                        </TableHeading>

                        <TableHeading>
                            Status
                        </TableHeading>

                        <TableHeading>
                            Actions
                        </TableHeading>

                        <TableHeading>
                            Download
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

                        filteredTests.map((test) => (

                            <div
                                key={test.id}
                                className="
                grid
                lg:grid-cols-[3fr_0.7fr_0.8fr_1.1fr_1.1fr_1fr_1.2fr_0.9fr_0.9fr]
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

                                <div className="flex items-center gap-4">

                                    <div
                                        className="
                        w-12
                        h-12
                        rounded-xl
                        bg-yellow-50
                        text-black
                        font-bold
                        flex
                        items-center
                        justify-center
                    "
                                    >
                                        {test.department
                                            .split(" ")
                                            .map((word) => word[0])
                                            .join("")
                                            .substring(0, 3)}
                                    </div>

                                    <div>

                                        <h3 className="font-semibold text-gray-900">
                                            {test.department}
                                        </h3>

                                        <p className="text-sm text-gray-400">
                                            Department
                                        </p>

                                    </div>

                                </div>


                                {/* SECTION */}

                                <div className="flex items-center justify-center">

                                    <span className="font-semibold">
                                        {test.section}
                                    </span>

                                </div>


                                {/* STUDENTS */}

                                <div className="flex items-center justify-center">
                                    {test.students}
                                </div>


                                {/* DATE */}

                                <div className="flex items-center justify-center text-gray-600">
                                    {test.date}
                                </div>


                                {/* TIME */}

                                <div className="flex items-center justify-center text-gray-600">
                                    {test.time}
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


                                {/* ACTIONS */}

                                <div className="flex items-center justify-center">

                                    {(test.status === "Upcoming" || test.status === "Ongoing") && (

                                        <button
                                            type="button"
                                            className="
                            px-4
                            py-2
                            text-xs
                            font-semibold
                            text-red-600
                            bg-red-50
                            border
                            border-red-100
                            rounded-lg
                            hover:bg-red-100
                            transition
                        "
                                        >
                                            Cancel
                                        </button>

                                    )}

                                </div>


                                {/* DOWNLOAD */}

                                <div className="flex items-center justify-center">

                                    {test.status === "Completed" && (
                                        <button
                                            type="button"
                                            onClick={() => handleDownload(test)}
                                            title="Download Test"
                                            className="
                flex
                items-center
                justify-center
                w-9
                h-9
                rounded-lg
                bg-[#FDCC03]
                border
                border-[#FDCC03]
                text-black
                hover:bg-red-700
                hover:border-red-500
                hover:text-white
                transition
            "
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="w-5 h-5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14"
                                                />
                                            </svg>
                                        </button>
                                    )}

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

                        Showing {filteredTests.length} Records

                    </p>

                    <div className="flex gap-3">

                        <button
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

                        <button
                            className="
              px-4
              py-2
              rounded-lg
              bg-[#FDCC03]
              font-semibold
              hover:bg-yellow-400
              transition
              "
                        >
                            1
                        </button>

                        <button
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

                    </div>

                </div>

            </main>

        </div>
    );
}

/* ==========================================================
   SUMMARY CARD
========================================================== */

function SummaryCard({ title, value }) {
    return (
        <div className="relative bg-white border border-gray-200 rounded-xl p-5 overflow-hidden hover:border-[#FDCC03] hover:shadow-sm transition">

            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FDCC03]" />

            <p className="text-sm font-medium text-gray-500">
                {title}
            </p>

            <h2 className="mt-3 text-3xl font-bold text-black">
                {value}
            </h2>

        </div>
    );
}

/* ==========================================================
   TABLE HEADER
========================================================== */

function TableHeading({ children, align = "center" }) {
    return (
        <div className="py-4 flex items-center">
            <p
                className={`text-xs font-bold uppercase tracking-wider text-gray-400 ${align === "left"
                    ? "text-left"
                    : "text-center w-full"
                    }`}
            >
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