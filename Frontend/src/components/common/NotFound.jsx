import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, SearchX } from "lucide-react";

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white flex items-center justify-center px-6">
            <div className="w-full max-w-2xl text-center">

                {/* 404 */}
                <div className="relative mb-6">
                    <h1 className="text-[120px] md:text-[180px] font-extrabold leading-none text-[#800000] tracking-tight">
                        404
                    </h1>

                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-[#ffcc00]/20 blur-2xl" />
                    </div>
                </div>

                {/* Icon */}
                <div className="flex justify-center mb-5">
                    <div className="w-14 h-14 rounded-2xl bg-[#fff8dc] border border-[#f5b301] flex items-center justify-center">
                        <SearchX
                            size={28}
                            className="text-[#800000]"
                        />
                    </div>
                </div>

                {/* Heading */}
                <h2 className="text-2xl md:text-3xl font-bold text-slate-800">
                    Page Not Found
                </h2>

                {/* Description */}
                <p className="mt-3 text-slate-500 text-sm md:text-base max-w-md mx-auto leading-relaxed">
                    The page you are looking for doesn't exist,
                    may have been moved, or the URL you entered is incorrect.
                </p>

                {/* Buttons */}
                <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">

                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50 transition"
                    >
                        <ArrowLeft size={18} />
                        Go Back
                    </button>

                </div>

                {/* Footer text */}
                <p className="mt-10 text-xs text-slate-400">
                    English Examination Portal
                </p>

            </div>
        </div>
    );
}