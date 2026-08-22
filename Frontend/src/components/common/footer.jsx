import { FaRegCopyright } from "react-icons/fa";

export default function Footer() {
    return (
        <footer className="text-center text-black-400 bg-white">
            <FaRegCopyright className="inline mr-1" />

            <a
                href="https://velammal.edu.in/webteam"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors"
            >
                {new Date().getFullYear()}<span className="hover:text-yellow-400"><b> WebOps VEC</b></span> | Velammal Engineering College, Chennai
            </a>
        </footer>
    );
}