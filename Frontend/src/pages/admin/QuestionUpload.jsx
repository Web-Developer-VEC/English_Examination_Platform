import { useState } from "react";
import {
  FileText,
  Headphones,
  FileSpreadsheet,
  Upload,
  Send,
  Info,
  AlertTriangle,
  Download,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function QuestionUpload() {
  const [showInstructions, setShowInstructions] = useState(false);
  const [showMp3Popup, setShowMp3Popup] = useState(false);
  const [questionCode, setQuestionCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [questionFile, setQuestionFile] = useState(null);

  const testInstructions = [
    {
      id: 1,
      text: (
        <>
          Enter a clear and meaningful <b>Question Code</b> for the English
          test.
        </>
      ),
    },
    {
      id: 2,
      text: (
        <>
          Upload the <b>audio file in MP3 format only</b>.
        </>
      ),
    },
    {
      id: 3,
      text: (
        <>
          Upload the questions file in the required <b>Excel (.xlsx) format</b>.
          Please reference and use the <b>template.xlsx</b> file to ensure
          correct formatting.
        </>
      ),
    },
    {
      id: 4,
      text: (
        <>
          Make sure the audio is clear and the questions file follows the
          correct format.
        </>
      ),
    },
    {
      id: 5,
      text: (
        <>
          Check all question details and uploaded files before clicking{" "}
          <b>Upload Question</b>.
        </>
      ),
    },
  ];

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

  const handleTemplateDownload = () => {
    const link = document.createElement("a");
    link.href =
      "https://adminvec.s3.ap-south-1.amazonaws.com/english_exam_platform/templates/QUESTION_BANK_TEMPLATE.xlsx";
    link.download = "QUESTION_BANK_TEMPLATE.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async () => {
    if (!questionCode.trim()) {
      toast.error("Please enter a Question Code.");
      return;
    }

    if (!audioFile) {
      toast.error("Please upload an MP3 audio file.");
      return;
    }

    if (!questionFile) {
      toast.error("Please upload the questions Excel file.");
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("questionCode", questionCode.trim());
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
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to upload question.");
      }

      toast.success("Question uploaded successfully.");

      setQuestionCode("");
      setAudioFile(null);
      setQuestionFile(null);

      document.getElementById("audio-upload").value = "";
      document.getElementById("excel-upload").value = "";
    } catch (error) {
      console.error("Upload Question Error:", error);
      toast.error(
        error.message || "Something went wrong while creating the question."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    /* Changed min-h-screen to h-screen and added overflow-hidden to lock the full page */
    <div className="w-full h-[100dvh] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gray-50/50 overflow-hidden">
      
      {/* Changed to flex-col and max-h-full so it naturally fills available height but doesn't break out */}
      <div className="w-full max-w-[650px] max-h-full bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex flex-col">
        
        {/* Fixed Header */}
        <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 pb-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#800000]/10 flex items-center justify-center shrink-0">
              <Upload size={20} className="text-[#800000]" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#800000]">
              Question Upload
            </h1>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleTemplateDownload}
              className="flex items-center gap-2 border border-gray-300 bg-white text-gray-700 hover:bg-[#800000] hover:text-white hover:border-[#800000] px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
              title="Download Template"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Template</span>
            </button>
            <button
              type="button"
              onClick={() => setShowInstructions(true)}
              className="w-9 h-9 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-[#800000] hover:text-white hover:border-[#800000] flex items-center justify-center font-bold transition-colors shadow-sm shrink-0"
              title="Instructions"
            >
              !
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Question Code */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-[#800000] mb-2">
              <FileText size={16} />
              Question Code
            </label>
            <input
              type="text"
              placeholder="Enter question code"
              value={questionCode}
              onChange={(e) => setQuestionCode(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all placeholder:text-gray-400"
            />
          </div>

          {/* Audio Upload Dropzone */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-[#800000] mb-2">
              <Headphones size={16} />
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
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#D4AF37] rounded-xl cursor-pointer bg-gray-50/50 hover:bg-[#FFF9E8] transition-colors"
            >
              <Upload size={24} className="text-[#D4AF37] mb-2" />
              <p className="font-semibold text-gray-700 text-center px-4 line-clamp-1 break-all">
                {audioFile ? audioFile.name : "Click to upload Audio"}
              </p>
              <span className="text-sm text-gray-500 mt-1">MP3 only</span>
            </label>
          </div>

          {/* Excel Upload Dropzone */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-[#800000] mb-2">
              <FileSpreadsheet size={16} />
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
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#D4AF37] rounded-xl cursor-pointer bg-gray-50/50 hover:bg-[#FFF9E8] transition-colors"
            >
              <Upload size={24} className="text-[#D4AF37] mb-2" />
              <p className="font-semibold text-gray-700 text-center px-4 line-clamp-1 break-all">
                {questionFile ? questionFile.name : "Click to upload Questions"}
              </p>
              <span className="text-sm text-gray-500 mt-1">Excel (.xlsx)</span>
            </label>
          </div>
        </div>

        {/* Fixed Submit Area */}
        <div className="shrink-0 p-6 sm:p-8 pt-5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg w-full sm:w-auto">
            <Info size={16} className="text-[#D4AF37] mr-2 shrink-0" />
            <span className="line-clamp-1">Ensure files match the template format.</span>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`w-full sm:w-auto min-w-[180px] h-[46px] flex items-center justify-center gap-2 rounded-xl font-semibold shadow-md transition-all ${
              isSubmitting
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-[#FDCC03] hover:bg-[#800000] hover:text-white text-gray-900 cursor-pointer"
            }`}
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Send size={18} />
                <span>Upload Question</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* MP3 Popup */}
      {showMp3Popup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-[400px] text-center transform transition-all">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-amber-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Invalid Audio File
            </h2>
            <p className="text-gray-600 mb-6">
              Only MP3 files are allowed for audio uploads.
            </p>
            <button
              onClick={() => setShowMp3Popup(false)}
              className="w-full bg-[#800000] hover:bg-[#5e0000] text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* Instructions Popup */}
      {showInstructions && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowInstructions(false)}
        >
          <div 
            className="bg-white w-full max-w-[600px] max-h-[85vh] rounded-2xl shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4 px-6 py-5 border-b shrink-0">
              <div className="w-10 h-10 rounded-full bg-[#800000] text-white flex items-center justify-center text-lg font-bold shrink-0 shadow-sm">
                !
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Instructions to Upload Question
              </h2>
            </div>

            <div className="px-6 py-6 overflow-y-auto">
              <p className="text-gray-600 mb-6">
                Please follow the instructions below before uploading the
                question:
              </p>

              <ol className="space-y-5 text-gray-700 text-sm sm:text-base">
                {testInstructions.map((item) => (
                  <li key={item.id} className="flex gap-4">
                    <span className="font-bold text-[#D4AF37] text-lg shrink-0">
                      {item.id}.
                    </span>
                    <span className="pt-0.5">{item.text}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="px-6 py-5 border-t bg-gray-50 flex justify-end shrink-0 rounded-b-2xl">
              <button
                onClick={() => setShowInstructions(false)}
                className="bg-[#800000] hover:bg-[#5e0000] text-white px-8 py-2.5 rounded-xl font-semibold transition-colors shadow-sm"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
      />
    </div>
  );
}