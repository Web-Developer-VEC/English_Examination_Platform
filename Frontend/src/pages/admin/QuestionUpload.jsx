import { useState, useEffect, useRef } from "react";
import {
  FileText,
  Headphones,
  FileSpreadsheet,
  Upload,
  Send,
  Info,
  ClipboardCheck,
  AlertTriangle,
} from "lucide-react";

export default function CreateTest() {
  const [showInstructions, setShowInstructions] = useState(false);
  const [showMp3Popup, setShowMp3Popup] = useState(false);
  const [questionCode, setQuestionCode] = useState("");
  const [cie, setCie] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const [questionFile, setQuestionFile] = useState(null);

  // Measure exactly how much vertical space is left below this component in
  // the real viewport, live. This — not a fixed height — is what makes the
  // card actually shrink to match each screen; clamp() below then compresses
  // the internal spacing to fit inside whatever this comes out to.
  const wrapperRef = useRef(null);
  const [availableHeight, setAvailableHeight] = useState(null);

  useEffect(() => {
    function recalc() {
      if (!wrapperRef.current) return;
      const top = wrapperRef.current.getBoundingClientRect().top;
      const bottomBreathingRoom = 8;
      const height = Math.max(
        280,
        window.innerHeight - top - bottomBreathingRoom,
      );
      setAvailableHeight(height);
    }

    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, []);

  // Document-level scroll stays locked — the measured height + clamp()
  // sizing below keep the card inside the visible area on their own.
  useEffect(() => {
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, []);

  const handleAudioChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isMp3 =
      file.name.toLowerCase().endsWith(".mp3") && file.type === "audio/mpeg";

    if (!isMp3) {
      setShowMp3Popup(true);
      e.target.value = "";
      setAudioFile(null);
      return;
    }

    setAudioFile(file);
  };

  const handleSubmit = async () => {
    if (!questionCode.trim()) {
      alert("Please enter a Question Code.");
      return;
    }
    if (!cie) {
      alert("Please select a CIE.");
      return;
    }
    if (!audioFile) {
      alert("Please upload an MP3 audio file.");
      return;
    }
    if (!questionFile) {
      alert("Please upload the questions Excel file.");
      return;
    }

    try {
      const formData = new FormData();

      formData.append("questionCode", questionCode.trim());
      formData.append("cie", cie);
      formData.append("audio", audioFile);
      formData.append("questions", questionFile);

      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/staff/questionsupload",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create test.");
      }

      alert("Questions uploaded successfully.");

      setQuestionCode("");
      setCie("");
      setAudioFile(null);
      setQuestionFile(null);

      document.getElementById("audio-upload").value = "";
      document.getElementById("excel-upload").value = "";
    } catch (error) {
      console.error("Create Test Error:", error);
      alert(error.message || "Something went wrong while creating the test.");
    }
  };

  // All vertical rhythm below is driven by clamp(min, vh-based, max) instead of
  // fixed px/rem — so as the viewport gets shorter, padding/margins/font sizes
  // shrink together and the whole card compresses to fit without ever needing
  // to scroll. On a tall screen everything sits at its max (comfortable) size;
  // on a short one it scales down smoothly instead of overflowing.
  const fieldLabel =
    "flex items-center gap-2 font-semibold text-[clamp(0.85rem,1.9vh,1.125rem)] text-[#800000] mb-[clamp(2px,0.6vh,8px)]";
  const fieldGap = "mb-[clamp(6px,1.4vh,16px)]";
  const dropzone =
    "border-2 border-dashed border-[#D4AF37] rounded-xl py-[clamp(6px,1.4vh,12px)] min-h-[clamp(44px,7vh,80px)] flex flex-col justify-center items-center cursor-pointer hover:bg-[#FFF9E8] transition px-2 text-center";

  return (
    <div
      ref={wrapperRef}
      style={availableHeight ? { height: `${availableHeight}px` } : undefined}
      className="w-full min-h-[300px] flex items-center justify-center p-[clamp(8px,2vh,16px)] overflow-hidden"
    >
      <div className="w-full max-w-[640px] bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.12)] p-[clamp(12px,2.5vh,20px)]">
        {/* Header */}
        <div className="relative flex items-center justify-center mb-[clamp(8px,1.8vh,20px)] pb-[clamp(6px,1.4vh,16px)] border-b">
          <div className="flex items-center gap-2 sm:gap-3">
            <Upload size={22} className="text-[#800000] shrink-0" />
            <h1 className="text-[clamp(1.1rem,2.6vh,1.875rem)] font-sans font-bold text-[#800000] text-center">
              Question Upload
            </h1>
          </div>

        <button
  onClick={() => setShowInstructions(true)}
  className="absolute cursor-pointer right-0 w-7 h-7 rounded-full border-2 border-black bg-transparent text-black flex items-center justify-center text-sm font-bold hover:bg-gray-100 transition shadow-sm shrink-0"
  title="Instructions"
>
  !
</button>
        </div>

        {/* Question Code */}
        <label className={fieldLabel}>
          <FileText size={18} className="shrink-0" />
          Question Code
        </label>

        <input
          type="text"
          placeholder="Enter question code"
          value={questionCode}
          onChange={(e) => setQuestionCode(e.target.value)}
          className={`w-full border border-gray-400 rounded-lg px-3 py-[clamp(5px,1.1vh,10px)] outline-none focus:border-[#D4AF37] ${fieldGap}`}
        />

        {/* CIE */}
        <label className={fieldLabel}>
          <ClipboardCheck size={18} className="shrink-0" />
          CIE
        </label>

        <select
          value={cie}
          onChange={(e) => setCie(e.target.value)}
          className={`w-full border border-gray-400 rounded-lg px-3 py-[clamp(5px,1.1vh,10px)] outline-none focus:border-[#D4AF37] bg-white ${fieldGap}`}
        >
          <option value="">Select CIE</option>
          <option value="cie1">CIE1</option>
          <option value="cie2">CIE2</option>
          <option value="cie3">CIE3</option>
        </select>

        {/* Audio */}
        <label className={fieldLabel}>
          <Headphones size={18} className="shrink-0" />
          Audio File
        </label>

        <input
          type="file"
          id="audio-upload"
          className="hidden"
          accept=".mp3"
          onChange={handleAudioChange}
        />

        <label htmlFor="audio-upload" className={`${dropzone} ${fieldGap}`}>
          <Upload size={20} className="text-[#D4AF37]" />
          <p className="font-semibold text-[clamp(0.75rem,1.7vh,1rem)] mt-1 break-all">
            {audioFile ? audioFile.name : "Upload Audio"}
          </p>
          <span className="text-gray-500 text-[clamp(0.65rem,1.4vh,0.875rem)]">
            MP3
          </span>
        </label>

        {/* Excel */}
        <label className={fieldLabel}>
          <FileSpreadsheet size={18} className="shrink-0" />
          Questions (Excel)
        </label>

        <input
          type="file"
          id="excel-upload"
          className="hidden"
          accept=".xlsx,.xls"
          onChange={(e) => setQuestionFile(e.target.files[0])}
        />

        <label htmlFor="excel-upload" className={dropzone}>
          <Upload size={20} className="text-[#D4AF37]" />
          <p className="font-semibold text-[clamp(0.75rem,1.7vh,1rem)] mt-1 break-all">
            {questionFile ? questionFile.name : "Upload Questions"}
          </p>
          <span className="text-gray-500 text-[clamp(0.65rem,1.4vh,0.875rem)]">
            Excel (.xlsx)
          </span>
        </label>

        {/* Submit */}
        <div className="flex justify-center mt-[clamp(8px,1.8vh,16px)]">
          <button
            type="button"
            onClick={handleSubmit}
            className="flex items-center gap-2 bg-[#FDCC03] hover:bg-[#5e0000] text-white px-6 sm:px-7 py-[clamp(6px,1.3vh,10px)] rounded-full text-sm shadow-md transition"
          >
            <Send size={18} />
            Create Test
          </button>
        </div>

        {/* Footer */}
        <div className="mt-[clamp(8px,1.8vh,16px)] border rounded-lg px-3 py-[clamp(5px,1.1vh,10px)] flex items-center text-[clamp(0.7rem,1.5vh,0.875rem)] text-gray-600">
          <Info size={16} className="text-[#D4AF37] mr-2 shrink-0" />
          Please ensure your audio file is clear and questions file follows the
          correct format.
        </div>
      </div>

      {/* MP3 Popup */}
      {showMp3Popup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-9 w-full max-w-[440px] text-center">
            <AlertTriangle size={48} className="text-[#D4AF37] mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-[#800000] mb-3">
              Invalid Audio File
            </h2>
            <p className="text-gray-600 text-sm sm:text-base mb-6">
              Only MP3 files are allowed.
            </p>
            <button
              onClick={() => setShowMp3Popup(false)}
              className="bg-[#FDCC03] hover:bg-[#800000] text-white px-8 py-2.5 rounded-full transition"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Instructions Popup */}
      {showInstructions && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center overflow-hidden p-4"
          onWheel={(e) => e.stopPropagation()}
        >
          <div className="bg-white w-full max-w-[650px] max-h-[85dvh] rounded-2xl shadow-2xl flex flex-col">
            <div className="flex items-center gap-3 sm:gap-4 px-5 sm:px-8 py-4 sm:py-5 border-b shrink-0">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#800000] text-white flex items-center justify-center text-base sm:text-lg font-bold shrink-0">
                !
              </div>
              <h2 className="text-lg sm:text-2xl font-bold text-[#800000]">
                Instructions to Create Test
              </h2>
            </div>

            <div className="px-5 sm:px-8 py-5 sm:py-6 overflow-y-auto overscroll-contain">
              <p className="text-gray-600 text-sm sm:text-base mb-5">
                Please follow the instructions below before creating the test:
              </p>

              <ol className="space-y-5 sm:space-y-6 text-gray-700 text-sm sm:text-base">
                <li className="flex gap-3 sm:gap-4">
                  <span className="font-bold text-[#800000] text-base sm:text-lg shrink-0">1.</span>
                  <span>
                    Enter a clear and meaningful <b>Test Code</b> for the
                    English test.
                  </span>
                </li>
                <li className="flex gap-3 sm:gap-4">
                  <span className="font-bold text-[#800000] text-base sm:text-lg shrink-0">2.</span>
                  <span>
                    Upload the <b>audio file in MP3 format only</b>.
                  </span>
                </li>
                <li className="flex gap-3 sm:gap-4">
                  <span className="font-bold text-[#800000] text-base sm:text-lg shrink-0">3.</span>
                  <span>
                    Upload the questions file in the required
                    <b> Excel (.xlsx) format</b>.
                  </span>
                </li>
                <li className="flex gap-3 sm:gap-4">
                  <span className="font-bold text-[#800000] text-base sm:text-lg shrink-0">4.</span>
                  <span>
                    Make sure the audio is clear and the questions file follows
                    the correct format.
                  </span>
                </li>
                <li className="flex gap-3 sm:gap-4">
                  <span className="font-bold text-[#800000] text-base sm:text-lg shrink-0">5.</span>
                  <span>
                    Check all test details and uploaded files before clicking
                    <b> Create Test</b>.
                  </span>
                </li>
              </ol>
            </div>

            <div className="px-5 sm:px-8 py-4 sm:py-5 border-t flex justify-end shrink-0">
              <button
                onClick={() => setShowInstructions(false)}
                className="bg-[#FDCC03] hover:bg-[#800000] text-white px-7 sm:px-9 py-2.5 sm:py-3 rounded-full font-semibold text-sm sm:text-base transition"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}