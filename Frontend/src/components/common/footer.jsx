import { FaRegCopyright } from "react-icons/fa";

export default function Footer() {
    return (
        <footer className="text-center text-gray-200 py-4">
            <FaRegCopyright className="inline mr-1" />

            <a
                href="https://velammal.edu.in/webteam"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-yellow-400 transition-colors"
            >
                {new Date().getFullYear()}<b> WebOps VEC</b> | Velammal Engineering College, Chennai
            </a>
        </footer>
    );
}