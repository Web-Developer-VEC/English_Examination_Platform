import { useState } from "react";
import {
  FileText,
  Headphones,
  FileSpreadsheet,
  Upload,
  Send,
  Info,
  ClipboardCheck,
} from "lucide-react";

export default function CreateTest() {
  const [title, setTitle] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const [questionFile, setQuestionFile] = useState(null);

  return (
    <div className="w-screen min-h-screen bg-[#faf8f5] flex flex-col items-center py-10 overflow-y-auto">

      {/* Heading */}

      <div className="flex flex-col items-center mb-10">

        <div className="w-24 h-24 rounded-full border-2 border-[#D4AF37]/30 bg-white flex items-center justify-center shadow-sm">
          <ClipboardCheck size={42} className="text-[#800000]" />
        </div>

        <h1 className="text-5xl font-bold text-[#800000] mt-6">
          Create English Test
        </h1>

        <div className="w-20 h-1 bg-[#D4AF37] rounded-full mt-3"></div>

      </div>

      {/* Card */}

      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl p-10">

        {/* Title */}

        <label className="flex items-center gap-2 font-semibold text-xl text-[#800000] mb-3">
          <FileText size={22} />
          Test Title
        </label>

        <input
          type="text"
          placeholder="Enter test title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border rounded-xl p-4 mb-8 outline-none focus:border-[#D4AF37]"
        />

        {/* Audio */}

        <label className="flex items-center gap-2 font-semibold text-xl text-[#800000] mb-3">
          <Headphones size={22} />
          Audio File
        </label>

        <input
          type="file"
          id="audio-upload"
          className="hidden"
          accept="audio/*"
          onChange={(e) => setAudioFile(e.target.files[0])}
        />

        <label
          htmlFor="audio-upload"
          className="border-2 border-dashed border-[#D4AF37] rounded-2xl h-40 flex flex-col justify-center items-center cursor-pointer hover:bg-[#FFF9E8] transition mb-8"
        >
          <Upload size={42} className="text-[#D4AF37]" />

          <p className="font-semibold text-2xl mt-3">
            {audioFile ? audioFile.name : "Upload Audio"}
          </p>

          <span className="text-gray-500">
            MP3, WAV
          </span>
        </label>

        {/* Excel */}

        <label className="flex items-center gap-2 font-semibold text-xl text-[#800000] mb-3">
          <FileSpreadsheet size={22} />
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
          className="border-2 border-dashed border-[#D4AF37] rounded-2xl h-40 flex flex-col justify-center items-center cursor-pointer hover:bg-[#FFF9E8] transition"
        >
          <Upload size={42} className="text-[#D4AF37]" />

          <p className="font-semibold text-2xl mt-3">
            {questionFile ? questionFile.name : "Upload Questions"}
          </p>

          <span className="text-gray-500">
            Excel (.xlsx)
          </span>
        </label>

        {/* Button */}

        <div className="flex justify-center mt-10">

          <button className="flex items-center gap-3 bg-[#FDCC03] hover:bg-[#5e0000] text-white px-10 py-4 rounded-full text-lg shadow-lg transition">
            <Send size={20} />
            Create Test
          </button>

        </div>

        {/* Footer */}

        <div className="mt-10 border rounded-xl p-4 flex justify-between items-center text-gray-600">

          <div className="flex items-center gap-3">
            <Info className="text-[#D4AF37]" />
            Please ensure your audio file is clear and questions file follows the correct format.
          </div>

          

        </div>

      </div>

    </div>
  );
}