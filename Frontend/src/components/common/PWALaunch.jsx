import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const PWALaunch = () => {
    const navigate = useNavigate();

    useEffect(() => {
        navigate("/studentlogin", { replace: true });
    }, [navigate]);

    return null;
};

export default PWALaunch;