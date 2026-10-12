import React from "react";

export type AtmosIconName =
  | "mk" // Sacred Rosette Brand Mark
  | "bk" // Back Arrow
  | "ck" // Checkmark
  | "bl" // Bell
  | "ly" // Layers / Batches
  | "wl" // Wallet
  | "hm" // Home
  | "ls" // List
  | "us" // User
  | "cm" // Camera
  | "ar" // Arrow Top-Right
  | "cr" // Chevron Right
  | "x"  // Close X
  | "fd" // Feedstock / Folder
  | "ch" // Bar Chart
  | "cl" // Clock
  | "fl" // Flame (Pyrolysis)
  | "sp" // Sprout / Plant
  | "su" // Sun / Solar
  | "pn" // Pin / GPS
  | "cp" // Copy
  | "sr" // Search
  | "lk" // Lock
  | "gl" // Globe
  | "hp" // Help
  | "qu"; // Refresh / Quench

interface AtmosIconProps extends React.SVGProps<SVGSVGElement> {
  name: AtmosIconName;
  size?: number | string;
  className?: string;
}

export function AtmosIcon({
  name,
  size = 22,
  className = "",
  style,
  ...props
}: AtmosIconProps) {
  if (name === "mk") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        className={className}
        style={style}
        {...props}
      >
        <circle cx="50" cy="50" r="18" vectorEffect="non-scaling-stroke" />
        <circle cx="68" cy="50" r="18" vectorEffect="non-scaling-stroke" />
        <circle cx="59" cy="65.6" r="18" vectorEffect="non-scaling-stroke" />
        <circle cx="41" cy="65.6" r="18" vectorEffect="non-scaling-stroke" />
        <circle cx="32" cy="50" r="18" vectorEffect="non-scaling-stroke" />
        <circle cx="41" cy="34.4" r="18" vectorEffect="non-scaling-stroke" />
        <circle cx="59" cy="34.4" r="18" vectorEffect="non-scaling-stroke" />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      {...props}
    >
      {name === "bk" && <path d="M15 5l-7 7 7 7" />}
      {name === "ck" && <path d="M5 12l5 5 9-10" />}
      {name === "bl" && <path d="M6 17V11a6 6 0 0112 0v6l2 2H4zM10 21h4" />}
      {name === "ly" && <path d="M12 4l9 5-9 5-9-5zM3 14l9 5 9-5" />}
      {name === "wl" && <path d="M4 7h15a1 1 0 011 1v10H5a1 1 0 01-1-1zM4 7l12-3v3M15 13h3" />}
      {name === "hm" && <path d="M4 11l8-7 8 7v9H4z" />}
      {name === "ls" && <path d="M5 6h14M5 12h14M5 18h14" />}
      {name === "us" && (
        <>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
        </>
      )}
      {name === "cm" && (
        <>
          <path d="M4 8h3l2-2h6l2 2h3v11H4z" />
          <circle cx="12" cy="13" r="3.5" />
        </>
      )}
      {name === "ar" && <path d="M7 17L17 7M9 7h8v8" />}
      {name === "cr" && <path d="M9 5l7 7-7 7" />}
      {name === "x" && <path d="M6 6l12 12M18 6L6 18" />}
      {name === "fd" && <path d="M3 7h6l2 2h10v10H3z" />}
      {name === "ch" && <path d="M5 20V12M12 20V5M19 20v-9" />}
      {name === "cl" && (
        <>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4l3 2" />
        </>
      )}
      {name === "fl" && <path d="M12 3c3 4 6 6 6 10a6 6 0 01-12 0c0-2 1-4 3-5 0 2 1 3 2 3 0-3 0-5 1-8z" />}
      {name === "sp" && <path d="M12 21v-9M12 12c0-4 3-6 7-6 0 4-3 6-7 6zM12 14c0-3-2-5-6-5 0 3 2 5 6 5z" />}
      {name === "su" && (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
        </>
      )}
      {name === "pn" && (
        <>
          <path d="M12 21s7-6 7-11a7 7 0 00-14 0c0 5 7 11 7 11z" />
          <circle cx="12" cy="10" r="2.5" />
        </>
      )}
      {name === "cp" && (
        <>
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path d="M5 15V6a2 2 0 012-2h9" />
        </>
      )}
      {name === "sr" && (
        <>
          <circle cx="11" cy="11" r="6" />
          <path d="M16 16l4 4" />
        </>
      )}
      {name === "lk" && (
        <>
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V8a4 4 0 018 0v3" />
        </>
      )}
      {name === "gl" && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
        </>
      )}
      {name === "hp" && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9.5a2.5 2.5 0 114 2c-1 .6-1.5 1-1.5 2M12 17h.01" />
        </>
      )}
      {name === "qu" && <path d="M4 12a8 8 0 0114-5l2-2v6h-6l2-2a5 5 0 10-1 7" />}
    </svg>
  );
}
