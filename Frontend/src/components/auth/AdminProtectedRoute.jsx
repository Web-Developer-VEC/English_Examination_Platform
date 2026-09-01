import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getAdminSession } from "../../utils/helpers";

const AdminProtectedRoute = () => {

    const session = getAdminSession();
    const location = useLocation();

    // Login session 
    if (!session?.user) {
        return <Navigate to="/" replace />;
    }

    const role = session.user.role;

    // Staff allowed pages
    const staffAllowedPages = [
        "/admin/dashboard",
        "/admin/student-result"
    ];

    if (
        role === "staff" &&
        !staffAllowedPages.includes(location.pathname)
    ) {
        return <Navigate to="/admin/dashboard" replace />;
    }

    return <Outlet />;
};

export default AdminProtectedRoute;