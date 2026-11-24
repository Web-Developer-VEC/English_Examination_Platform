import { useEffect, useRef, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

const ThemeDropdown = ({
  icon: Icon,
  value,
  options = [],
  onChange,
  placeholder = "Select",
  loading = false,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find(
    (option) => option === value
  );

  const getOptionLabel = (option) => {
    if (option === "Computer Science and Engineering") {
      return "CSE — Computer Science and Engineering";
    }

    if (option === "Computer Science and Engineering (Cyber Security)") {
      return "CSE-CS — Computer Science and Engineering (Cyber Security)";
    }

    return option;
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
  };

  const handleToggle = () => {
    if (disabled || loading) return;

    setIsOpen((prev) => !prev);
  };

  return (
    <div
      ref={dropdownRef}
      className="relative w-full"
    >
      {/* Main Button */}
      <button
        type="button"
        disabled={disabled || loading}
        onClick={handleToggle}
        className={`
          group
          flex
          w-full
          items-center
          gap-3
          rounded-xl
          border
          bg-white
          px-4
          py-3
          text-left
          transition-all
          duration-200
          focus:outline-none

          ${
            isOpen
              ? "border-[#fdcc03] shadow-[0_0_0_3px_rgba(253,204,3,0.15)]"
              : "border-black/15 hover:border-black/30"
          }

          ${
            disabled || loading
              ? "cursor-not-allowed opacity-60"
              : "cursor-pointer"
          }
        `}
      >
        {/* Left Icon */}
        {Icon && (
          <Icon
            size={18}
            strokeWidth={2}
            className={`
              shrink-0
              transition-colors
              duration-200
              ${
                isOpen
                  ? "text-black"
                  : "text-black/60 group-hover:text-black"
              }
            `}
          />
        )}

        {/* Selected Text */}
        <span
          title={selectedOption || placeholder}
          className={`
            flex-1
            min-w-0
            whitespace-normal
            break-words
            text-[15px]
            font-medium
            ${
              selectedOption
                ? "text-black"
                : "text-black/45"
            }
          `}
        >
          {loading
            ? "Loading..."
            : selectedOption || placeholder}
        </span>

        {/* Arrow */}
        <span
          className={`
            flex
            shrink-0
            items-center
            justify-center
            transition-all
            duration-200
            ${
              isOpen
                ? "rotate-0 text-black"
                : "text-black/50 group-hover:text-black"
            }
          `}
        >
          {isOpen ? (
            <ChevronUp
              size={18}
              strokeWidth={2}
            />
          ) : (
            <ChevronDown
              size={18}
              strokeWidth={2}
            />
          )}
        </span>
      </button>

      {/* Dropdown Options */}
      {isOpen && !disabled && !loading && (
        <div
          className="
            absolute
            left-0
            min-w-full
            w-max
            max-w-[calc(100vw-2rem)]
            z-50
            mt-2
            overflow-hidden
            rounded-xl
            border
            border-black/10
            bg-white
            p-1.5
            shadow-[0_10px_30px_rgba(0,0,0,0.12)]
            animate-[dropdownIn_0.15s_ease-out]
          "
        >
          {options.length === 0 ? (
            <div
              className="
                px-4
                py-3
                text-sm
                font-medium
                text-black/40
              "
            >
              No options available
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto">
              {options.map((option) => {
                const isSelected = option === value;

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() =>
                      handleSelect(option)
                    }
                    className={`
                      mb-0.5
                      w-full
                      items-center
                      rounded-lg
                      px-4
                      py-3
                      text-left
                      text-[15px]
                      whitespace-normal
                      break-words
                      transition-all
                      duration-150
                      last:mb-0

                      ${
                        isSelected
                          ? `
                            bg-[#fdcc03]
                            font-semibold
                            text-black
                          `
                          : `
                            bg-white
                            font-medium
                            text-black
                            hover:bg-[#fff8d6]
                          `
                      }
                    `}
                  >
                    {getOptionLabel(option)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ThemeDropdown;
