import { Outlet } from "react-router-dom";

export default function ProfessorLayout() {
    return (
        <div className="min-h-screen flex">
            <Outlet />
        </div>
    );
}