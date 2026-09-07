import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 770;

const DesktopOnly = ({ children }) => {
    const [isBlocked, setIsBlocked] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => {
            setIsBlocked(window.innerWidth < MOBILE_BREAKPOINT);
        };

        checkScreenSize();

        window.addEventListener("resize", checkScreenSize);

        return () => {
            window.removeEventListener("resize", checkScreenSize);
        };
    }, []);

    if (isBlocked) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center px-6">
                <div className="w-full max-w-md text-center">

                    <div className="text-6xl mb-6">
                        💻
                    </div>

                    <h1 className="text-2xl font-bold text-[#800000] mb-4">
                        Laptop or Desktop Required
                    </h1>

                    <p className="text-gray-600 leading-relaxed">
                        This application is not available on mobile devices.
                        Please use a laptop or desktop computer to access
                        the English Examination Portal.
                    </p>

                    <div className="mt-6 px-4 py-3 rounded-lg bg-yellow-50 border border-yellow-300 text-sm text-gray-700">
                        Please switch to a laptop or desktop and try again.
                    </div>

                </div>
            </div>
        );
    }

    return children;
};

export default DesktopOnly;