import { useState, useEffect } from "react";
import {
  FileText,
  Headphones,
  FileSpreadsheet,
  Upload,
  Send,
  Info,
  ClipboardCheck,
  X,
  AlertTriangle,
} from "lucide-react";

export default function CreateTest() {
  const [showInstructions, setShowInstructions] = useState(false);
  const [showMp3Popup, setShowMp3Popup] = useState(false);
  const [questionCode, setQuestionCode] = useState("");
  const [cie, setCie] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const [questionFile, setQuestionFile] = useState(null);
  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (showInstructions) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [showInstructions]);
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
    // Check Question Code
    if (!questionCode.trim()) {
      alert("Please enter a Question Code.");
      return;
    }
    if (!cie) {
      alert("Please select a CIE.");
      return;
    }
    // Check Audio
    if (!audioFile) {
      alert("Please upload an MP3 audio file.");
      return;
    }

    // Check Excel
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
      console.log("========== CREATE TEST PAYLOAD ==========");
      console.log("Question Code:", questionCode.trim());
      console.log("CIE:", cie);

      console.log("Audio File:", {
        name: audioFile?.name,
        type: audioFile?.type,
        size: audioFile?.size,
      });

      console.log("Question File:", {
        name: questionFile?.name,
        type: questionFile?.type,
        size: questionFile?.size,
      });

      console.log("FormData:");

      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(key, {
            name: value.name,
            type: value.type,
            size: value.size,
          });
        } else {
          console.log(key, value);
        }
      }

      console.log("========================================");

      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/staff/questions/questionsupload",
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

      console.log("Success:", data);

      alert("Questions uploaded successfully.");

      // Clear form
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

  return (
    <div className="w-full h-[calc(100dvh-140px)] bg-white px-6 flex items-center justify-center overflow-hidden">
      {/* Main Card */}
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-5">
        {/* Create English Test - INSIDE THE SAME BOX */}

        <div className="relative flex items-center justify-center mb-5 pb-4 border-b">
          {/* Centered Icon + Title */}
          <div className="flex items-center gap-3">
            <Upload size={28} className="text-[#800000]" />

            <h1 className="text-3xl font-sans font-bold text-[#800000]">
              Upload English Test
            </h1>
          </div>

          {/* Instructions Button - Far Right */}
          <button
            onClick={() => setShowInstructions(true)}
            className="absolute right-0 w-8 h-8 rounded-full border-2 border-black bg-transparent text-black flex items-center justify-center text-sm font-bold hover:bg-gray-100 transition shadow-sm"
            title="Instructions"
            title="Instructions"
          >
            !
          </button>
        </div>

        {/* Title */}
        <label className="flex items-center gap-2 font-semibold text-lg text-[#800000] mb-2">
          <FileText size={20} />
          Question Code
        </label>

        <input
          type="text"
          placeholder="Enter question code"
          value={questionCode}
          onChange={(e) => setQuestionCode(e.target.value)}
          className="w-full border border-gray-400 rounded-lg px-3 py-2.5 mb-4 outline-none focus:border-[#D4AF37]"
        />
        {/* CIE */}
        <label className="flex items-center gap-2 font-semibold text-lg text-[#800000] mb-2">
          <ClipboardCheck size={20} />                                                                                                                                                                                                                                               
          CIE
        </label>

        <select
          value={cie}
          onChange={(e) => setCie(e.target.value)}
          className="w-full border border-gray-400 rounded-lg px-3 py-2.5 mb-4 outline-none focus:border-[#D4AF37] bg-white"
        >
          <option value="">Select CIE</option>
          <option value="cie1">CIE1</option>
          <option value="cie2">CIE2</option>
          <option value="cie3">CIE3</option>
        </select>

        {/* Audio */}
        <label className="flex items-center gap-2 font-semibold text-lg text-[#800000] mb-2">
          <Headphones size={20} />
          Audio File
        </label>

        <input
          type="file"
          id="audio-upload"
          className="hidden"
          accept=".mp3"
          onChange={handleAudioChange}
        />

        <label
          htmlFor="audio-upload"
          className="border-2 border-dashed border-[#D4AF37] rounded-xl h-20 flex flex-col justify-center items-center cursor-pointer hover:bg-[#FFF9E8] transition mb-4"
        >
          <Upload size={24} className="text-[#D4AF37]" />

          <p className="font-semibold text-base mt-1">
            {audioFile ? audioFile.name : "Upload Audio"}
          </p>

          <span className="text-gray-500 text-sm">MP3</span>
        </label>

        {/* Excel */}
        <label className="flex items-center gap-2 font-semibold text-lg text-[#800000] mb-2">
          <FileSpreadsheet size={20} />
          Questions (Excel)
        </label>

        <input
          type="file"
          id="excel-upload"
          className="hidden"
          accept=".xlsx,.xls"
          onChange={(e) => setQuestionFile(e.target.files[0])}
        />

        <label
          htmlFor="excel-upload"
          className="border-2 border-dashed border-[#D4AF37] rounded-xl h-20 flex flex-col justify-center items-center cursor-pointer hover:bg-[#FFF9E8] transition"
        >
          <Upload size={24} className="text-[#D4AF37]" />

          <p className="font-semibold text-base mt-1">
            {questionFile ? questionFile.name : "Upload Questions"}
          </p>

          <span className="text-gray-500 text-sm">Excel (.xlsx)</span>
        </label>

        {/* Button */}
        <div className="flex justify-center mt-4">
          <button
            type="button"
            onClick={handleSubmit}
            className="flex items-center gap-2 bg-[#FDCC03] hover:bg-[#5e0000] text-white px-7 py-2.5 rounded-full text-sm shadow-md transition"
          >
            <Send size={18} />
            Create Test
          </button>
        </div>

        {/* Footer */}
        <div className="mt-4 border rounded-lg px-3 py-2.5 flex items-center text-sm text-gray-600">
          <Info size={17} className="text-[#D4AF37] mr-2 flex-shrink-0" />
          Please ensure your audio file is clear and questions file follows the
          correct format.
        </div>
      </div>

      {/* MP3 Popup */}
      {showMp3Popup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-9 w-[440px] text-center">
            <AlertTriangle size={48} className="text-[#D4AF37] mx-auto mb-4" />

            <h2 className="text-2xl font-bold text-[#800000] mb-3">
              Invalid Audio File
            </h2>

            <p className="text-gray-600 text-base mb-6">
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
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center overflow-hidden"
          onWheel={(e) => e.stopPropagation()}
        >
          <div className="bg-white w-[650px] max-h-[85vh] rounded-2xl shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-4 px-8 py-5 border-b flex-shrink-0">
              <div className="w-11 h-11 rounded-full bg-[#800000] text-white flex items-center justify-center text-lg font-bold">
                !
              </div>

              <h2 className="text-2xl font-bold text-[#800000]">
                Instructions to Create Test
              </h2>
            </div>

            {/* Scrollable Instructions */}
            <div className="px-8 py-6 overflow-y-auto overscroll-contain">
              <p className="text-gray-600 text-base mb-5">
                Please follow the instructions below before creating the test:
              </p>

              <ol className="space-y-6 text-gray-700 text-base">
                <li className="flex gap-4">
                  <span className="font-bold text-[#800000] text-lg">1.</span>
                  <span>
                    Enter a clear and meaningful <b>Test Code</b> for the
                    English test.
                  </span>
                </li>

                <li className="flex gap-4">
                  <span className="font-bold text-[#800000] text-lg">2.</span>
                  <span>
                    Upload the <b>audio file in MP3 format only</b>.
                  </span>
                </li>

                <li className="flex gap-4">
                  <span className="font-bold text-[#800000] text-lg">3.</span>
                  <span>
                    Upload the questions file in the required
                    <b> Excel (.xlsx) format</b>.
                  </span>
                </li>

                <li className="flex gap-4">
                  <span className="font-bold text-[#800000] text-lg">4.</span>
                  <span>
                    Make sure the audio is clear and the questions file follows
                    the correct format.
                  </span>
                </li>

                <li className="flex gap-4">
                  <span className="font-bold text-[#800000] text-lg">5.</span>
                  <span>
                    Check all test details and uploaded files before clicking
                    <b> Create Test</b>.
                  </span>
                </li>
              </ol>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t flex justify-end flex-shrink-0">
              <button
                onClick={() => setShowInstructions(false)}
                className="bg-[#FDCC03] hover:bg-[#800000] text-white px-9 py-3 rounded-full font-semibold text-base transition"
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
