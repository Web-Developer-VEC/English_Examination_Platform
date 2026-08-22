import { React, useState, useEffect } from "react";
import { BookOpenCheck } from "lucide-react";
import "./Header.css";
import collegeLogo from "../../assets/logo/college-logo.png";
import { getStudentSession } from "../../utils/helpers";

const Header = ({ portalTitle = "English Examination Portal" }) => {

    const [user, setUser] = useState(null);

    useEffect(() => {

        const loadSession = () => {

            const session = getStudentSession();

            console.log("HEADER SESSION:", session);

            if (session?.user) {
                setUser(session.user);
            } else {
                setUser(null);
            }
        };

        // Load session when Header opens
        loadSession();

        // Listen for login/session changes
        window.addEventListener(
            "studentSessionChanged",
            loadSession
        );

        return () => {
            window.removeEventListener(
                "studentSessionChanged",
                loadSession
            );
        };

    }, []);

    return (
        <header className="vec-header">

            {/* COLLEGE BRAND */}
            <div className="vec-header__brand">

                <div className="vec-header__logo">

                    <img
                        src={collegeLogo}
                        alt="Velammal Engineering College Logo"
                        className="vec-logo-image"
                    />

                </div>

                <div className="vec-header__text">

                    <h1 className="vec-header__college">
                        VELAMMAL
                    </h1>

                    <p className="vec-header__department">
                        ENGINEERING COLLEGE
                    </p>

                    <p className="vec-header__tagline">
                        The Wheel of Knowledge rolls on!
                    </p>

                    <p className="vec-header__autonomy">
                        (An Autonomous Institution)
                    </p>

                </div>

            </div>


            {/* PORTAL TITLE */}
            <div className="vec-header__portal">

                <BookOpenCheck
                    className="vec-header__portal-icon"
                    size={30}
                    strokeWidth={2}
                />

                <h2 className="vec-header__portal-title">
                    {portalTitle}
                </h2>

            </div>


            {/* USER DETAILS */}
            {user && (
                <>
                    {/* STUDENT */}
                    {user.role === "student" &&
                        (user.name || user.department || user.section) && (
                            <div className="vec-header__user">

                                {user.name && (
                                    <div className="vec-header__user-name">
                                        {user.name}
                                    </div>
                                )}

                                {(user.department || user.section) && (
                                    <div className="vec-header__user-details">
                                        {user.department && user.department}
                                        {user.department && user.section && " | "}
                                        {user.section && user.section}
                                    </div>
                                )}

                            </div>
                        )}

                    {/* STAFF / ADMIN */}
                    {user.role === "staff" &&
                        user.name && (
                            <div className="vec-header__user">

                                <div className="vec-header__user-name">
                                    {user.name}
                                </div>

                            </div>
                        )}
                </>
            )}
            {/* HEADER LINE */}
            <span
                className="vec-header__underline"
                aria-hidden="true"
            />

        </header>
    );
};

export default Header;