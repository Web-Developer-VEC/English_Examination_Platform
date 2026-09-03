import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/admin/Sidebar";
import Footer from "../components/common/footer";

export default function AdminLayout() {
   
    return (
        <div className="bg-gray-100">

            <div className="flex">

                <Sidebar />

                <main className="flex-1 relative bg-gray-100">
                    <Outlet />
                </main>

            </div>

            <Footer />

        </div>
    );
}