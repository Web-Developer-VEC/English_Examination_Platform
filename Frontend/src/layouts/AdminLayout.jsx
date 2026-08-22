import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/admin/Sidebar";
import Footer from "../components/common/footer";
import Boot from "../components/common/boot";

export default function AdminLayout() {
    const location = useLocation();

    const [showBoot, setShowBoot] = useState(true);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setShowBoot(true);
        setIsLoaded(false);

        const loadTimer = setTimeout(
            () => setIsLoaded(true),
            300
        );

        const removeTimer = setTimeout(
            () => setShowBoot(false),
            3000
        );

        return () => {
            clearTimeout(loadTimer);
            clearTimeout(removeTimer);
        };
    }, [location.pathname]);

    return (
        <div className="bg-gray-100">

            <div className="flex">

                <Sidebar />

                <main
                    className="flex-1 relative bg-gray-100"
                >
                    {showBoot && (
                        <Boot
                            isAuth={true}
                            isLoaded={isLoaded}
                        />
                    )}

                    <Outlet />
                </main>

            </div>

            <Footer />

        </div>
    );
}