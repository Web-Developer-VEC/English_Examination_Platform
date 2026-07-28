import { useState } from "react";

import RoleSelector from "../components/auth/RoleSelector";
import LoginForm from "../components/auth/LoginForm";

// Import your college logo if you have one
// import logo from "../assets/logo/vec-logo.png";

export default function Home() {
    const [role, setRole] = useState("student");

    return (
        <div className="min-h-screen flex items-center justify-center px-4">

            <div className="w-full max-w-md">

                {/* College Logo */}
                {/* <img
                    src={logo}
                    alt="College Logo"
                    className="w-24 h-24 mx-auto mb-4"
                /> */}

                {/* Title */}
                <div className="text-center mb-8">

                    <h1 className="text-4xl font-bold text-[#800000]">
                        Velammal Engineering College, Chennai
                    </h1>

                    <p className="text-gray-700 mt-2 text-sm">
                        English Audio Examination Platform
                    </p>

                    <p className="text-gray-600 text-sm">
                        Department of English
                    </p>

                </div>

                {/* Login Card */}
                <div className="rounded-2xl bg-white/90 backdrop-blur-md shadow-2xl p-8">

                    <RoleSelector
                        role={role}
                        setRole={setRole}
                    />

                    <div className="mt-8">

                        <LoginForm
                            role={role}
                        />

                    </div>

                </div>

            </div>

        </div>
    );
}