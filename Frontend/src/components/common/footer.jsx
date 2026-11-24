import { useEffect, useState } from "react";
import { FaRegCopyright } from "react-icons/fa";
import "./footer.css";

export default function Footer() {
    const [playCreditBling, setPlayCreditBling] = useState(false);

    useEffect(() => {
        const blingPlayed = sessionStorage.getItem("vec-footer-bling-played");
        if (!blingPlayed) {
            sessionStorage.setItem("vec-footer-bling-played", "true");
            setPlayCreditBling(true);
        }
    }, []);

    return (
        <footer className="vec-footer text-center text-gray-500">
            <FaRegCopyright className="inline mr-1" />

            {new Date().getFullYear()}{" "}
            <a
                href="https://velammal.edu.in/webteam"
                target="_blank"
                rel="noopener noreferrer"
                className="vec-footer__credit transition-colors"
            >
                <span
                    className={`vec-footer__name${playCreditBling ? " is-bling" : ""}`}
                    onAnimationEnd={(event) => {
                        if (event.target === event.currentTarget) {
                            setPlayCreditBling(false);
                        }
                    }}
                >
                    <b>WebOps VEC</b>
                </span>
            </a>{" "}
            | Velammal Engineering College, Chennai
        </footer>
    );
}
