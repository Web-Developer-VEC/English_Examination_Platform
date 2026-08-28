import { Navigate, Outlet } from "react-router-dom";
import { getAdminSession } from "../../utils/helpers";

const AdminProtectedRoute = () => {

    const session = getAdminSession();

    if (!session?.user) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default AdminProtectedRoute;