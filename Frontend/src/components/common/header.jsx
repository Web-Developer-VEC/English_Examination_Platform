import { useState, useEffect } from "react";
import { BookOpenCheck } from "lucide-react";
import "./Header.css";
import collegeLogo from "../../assets/logo/college-logo.png";
import {
    getAdminSession,
    getStudentSession,
} from "../../utils/helpers";

const Header = ({ portalTitle = "English Examination Portal" }) => {

       const [user, setUser] = useState(null);

    useEffect(() => {

        const loadSession = () => {

            const studentSession = getStudentSession();
            const adminSession = getAdminSession();

            if (studentSession?.user) {

                setUser(studentSession.user);

            } else if (adminSession?.user) {

                setUser(adminSession.user);

            } else {

                setUser(null);

            }
        };

        loadSession();

        window.addEventListener(
            "studentSessionChanged",
            loadSession
        );

        window.addEventListener(
            "adminSessionChanged",
            loadSession
        );

        return () => {

            window.removeEventListener(
                "studentSessionChanged",
                loadSession
            );

            window.removeEventListener(
                "adminSessionChanged",
                loadSession
            );
        };

    }, []);

    // =========================
    // LOGOUT
    // =========================
   
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


            {/* USER DETAILS + LOGOUT */}
            {user && (
                <div className="vec-header__account">

                    <div className="vec-header__user">

                        {/* STUDENT */}
                        {user.role === "student" && (
                            <>
                                {user.name && (
                                    <div className="vec-header__user-name">
                                        {user.name.toUpperCase()}
                                    </div>
                                )}

                                {(user.department || user.section) && (
                                    <div className="vec-header__user-details">
                                        {user.department &&
                                            user.department.toUpperCase()}

                                        {user.department &&
                                            user.section &&
                                            " - "}

                                        {user.section &&
                                            user.section.toUpperCase()}
                                    </div>
                                )}
                            </>
                        )}

                        {/* STAFF / ADMIN */}
                        {(user.role === "staff" ||
                            user.role === "admin") &&
                            (user.name || user.username) && (
                                <div className="vec-header__user-name">
                                    {(user.name || user.username).toUpperCase()}
                                </div>
                            )}

                    </div>


                    {/* LOGOUT BUTTON
                    <button
                        type="button"
                        className="vec-header__logout"
                        onClick={handleLogout}
                        title="Logout"
                    >
                        <LogOut size={18} />
                    </button> */}

                </div>
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