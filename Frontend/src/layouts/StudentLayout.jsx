import { Outlet } from "react-router-dom";

export default function StudentLayout() {
    return (
        <main className="min-h-screen">
            <Outlet />
        </main>
    );
}