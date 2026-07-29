import logo from "../../assets/logo/college-logo.png";

export default function Header() {
    return (
        <header className="relative bg-[#ffffff] shadow-lg overflow-hidden">

            {/* Black Slanted Shape */}
            <div className="absolute left-0 top-0 h-full w-24 bg-[#FDCC03] clip-left"></div>
            <div className="absolute right-0 top-0 h-full w-20 bg-[#FDCC03] clip-right"></div>

            <div className="relative z-10 max-w-7xl mx-auto flex items-center justify-center gap-6 px-6 py-4">

                <img
                    src={logo}
                    alt="College Logo"
                    className="w-16 h-16 object-contain bg-white rounded-full p-1"
                />

                <div className="text-center">

                    <h1 className="text-3xl font-bold text-[#000000] uppercase">
                        Velammal Engineering College, Chennai
                    </h1>

                    <h2 className="text-lg font-semibold text-black">
                        Department of English
                    </h2>

                    <p className="text-gray-800">
                        English Audio Examination Platform
                    </p>

                </div>

            </div>

        </header>
    );
}