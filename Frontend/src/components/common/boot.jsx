import { useState, useEffect } from "react";

const Boot = (props) => {
  const isLoaded = props.isLoaded;

  const [forceHide, setForceHide] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setForceHide(true);
    }, 4000); // 4s max boot screen

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div
      className={`flex flex-col justify-center items-center absolute w-full h-full z-[1000] top-0 bg-white
      ${
        isLoaded || forceHide
          ? "animate-[fadOut_0.5s_ease_forwards]"
          : ""
      }`}
    >
      <div className="w-10 h-10 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin" />
    </div>
  );
};

export default Boot;