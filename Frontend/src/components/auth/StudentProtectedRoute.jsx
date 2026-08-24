import { Navigate, Outlet } from "react-router-dom";
import { getStudentSession } from "../../utils/helpers";

const StudentProtectedRoute = () => {

    const session = getStudentSession();

    if (!session?.user?.admissionNo) {
        return <Navigate to="/studentlogin" replace />;
    }

    return <Outlet />;
};

export default StudentProtectedRoute;