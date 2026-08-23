import { Outlet } from "react-router-dom";

export default function ExamLayout() {
    return (
        <main className="min-h-screen">
            <Outlet />
        </main>
    );
}