// SupportBot.tsx

declare global {
  interface Window {
    Tawk_API?: any;
    Tawk_LoadStart?: Date;
  }
}

import { useEffect } from "react";
import { FaEnvelope } from "react-icons/fa";

const SupportBot = () => {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Prevent loading Tawk.to more than once
    if (document.getElementById("tawk-script")) return;

    // Initialize Tawk.to
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    // Create the Tawk.to script
    const script = document.createElement("script");

    script.id = "tawk-script";
    script.async = true;
    script.src = "https://embed.tawk.to/6ac8d6d1937f8634c7862729/1k4g8e9or";
    script.charset = "UTF-8";
    script.setAttribute("crossorigin", "*");

    // Load Tawk.to
    document.body.appendChild(script);

    // No script cleanup needed here: Tawk.to is a global widget
  }, []);

  return (
    <>
      {/* Email Support Button */}
      <div className="fixed bottom-[100px] left-5 z-[9999] flex flex-col items-center space-y-1">
        <button
          onClick={() => {
            window.location.href = "mailto:Oasisinvestments.company@yahoo.com";
          }}
          aria-label="Email Support"
          className="p-3 rounded-full shadow-lg bg-blue-800 hover:bg-blue-700 text-white transition"
        >
          <FaEnvelope size={18} />
        </button>

        <span className="text-sm text-black font-bold">Email Us</span>
      </div>
    </>
  );
};

export default SupportBot;
