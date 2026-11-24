import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/admin/Sidebar";
import Footer from "../components/common/footer";

export default function AdminLayout() {
   
    return (
        <div className="flex flex-1 flex-col bg-gray-100">

            <div className="flex flex-1">

                <Sidebar />

                <main className="relative flex min-w-0 flex-1 flex-col bg-gray-100">
                    <Outlet />
                </main>

            </div>

            <Footer />

        </div>
    );
}
