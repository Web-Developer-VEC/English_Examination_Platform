import React from "react";
import { BookOpenCheck } from "lucide-react";
import "./Header.css";
import collegeLogo from "../../assets/logo/college-logo.png";

const Header = ({ portalTitle = "English Examination Portal" }) => {
    return (
        <header className="vec-header">
            <div className="vec-header__brand">
                <div className="vec-header__logo">
                    <div className="vec-header__logo">
                        <img
                            src={collegeLogo}
                            alt="Velammal Engineering College Logo"
                            className="vec-logo-image"
                        />
                    </div>
                </div>
                <div className="vec-header__text">
                    <h1 className="vec-header__college">VELAMMAL</h1>
                    <p className="vec-header__department">ENGINEERING COLLEGE</p>
                    <p className="vec-header__tagline">The Wheel of Knowledge rolls on!</p>
                    <p className="vec-header__autonomy">(An Autonomous Institution)</p>
                </div>
            </div>

            <div className="vec-header__portal">
                <BookOpenCheck className="vec-header__portal-icon" size={30} strokeWidth={2} />
                <h2 className="vec-header__portal-title">{portalTitle}</h2>
            </div>

            <span className="vec-header__underline" aria-hidden="true" />
        </header>
    );
};

export default Header;