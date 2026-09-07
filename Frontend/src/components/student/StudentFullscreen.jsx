import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

const StudentFullscreen = () => {
  const [showFullscreenPopup, setShowFullscreenPopup] = useState(false);

  const enterFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        setShowFullscreenPopup(false);
        return true;
      }

      await document.documentElement.requestFullscreen();

      setShowFullscreenPopup(false);
      return true;
    } catch (error) {
      console.error("Fullscreen request failed:", error);
      return false;
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (document.fullscreenElement) {
        setShowFullscreenPopup(false);
      } else {
        setShowFullscreenPopup(true);
      }
    };

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );
    };
  }, []);

  return (
    <div className="min-h-screen w-full">
      {/* All Student Pages */}
      <Outlet />

      {/* Fullscreen Required Popup */}
      {showFullscreenPopup && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70">
          <div className="bg-white rounded-xl p-8 text-center shadow-2xl w-[400px]">

            <h2 className="text-xl font-bold text-red-600">
              Fullscreen Required
            </h2>

            <p className="mt-3 text-gray-600">
              You must enter fullscreen mode to continue.
            </p>

            <button
              type="button"
              onClick={enterFullscreen}
              className="mt-6 px-6 py-3 rounded-lg bg-[#800000] text-white font-semibold hover:bg-[#660000]"
            >
              Enter Fullscreen
            </button>

          </div>
        </div>
      )}
    </div>
  );
};

export default StudentFullscreen;