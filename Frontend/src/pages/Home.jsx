import { useState } from "react";
import Footer from "../components/common/Footer";
import { useNavigate } from "react-router-dom";

import RoleSelector from "../components/auth/RoleSelector";
import LoginForm from "../components/auth/LoginForm";

export default function Home() {
    const navigate = useNavigate();
    const [role, setRole] = useState("student");

    return (
        <div className="flex flex-col flex-1">

            {/* Login Area */}
            <div className="flex-1 flex items-center justify-center px-4 py-6">

                <div className="w-full max-w-md">

                    <div className="rounded-2xl bg-white/90 backdrop-blur-md shadow-2xl p-8">

                        <RoleSelector
                            role={role}
                            setRole={setRole}
                        />

                        <div className="mt-6">
                            <LoginForm role={role} />
                        </div>
                        <div>
                        {role === "student" && (
                            <button
                                onClick={() => navigate("/register")}
                                className="mt-4 w-full border-2 border-[#800000] text-[#800000] py-3 rounded-lg font-semibold hover:bg-[#800000] hover:text-white transition"
                            >
                                New Student? Sign Up
                            </button>
                        )}
                        </div>

                    </div>

                </div>

            </div>

            <Footer />

        </div>
    );
}