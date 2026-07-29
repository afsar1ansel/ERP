import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface ItemAvatarProps {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  className?: string;
  alt?: string;
}

// Map characters to consistent aesthetic background color pairs
const getAvatarColors = (name: string) => {
  const char = (name || "?").trim().charAt(0).toUpperCase();
  const charCode = char.charCodeAt(0) || 0;

  const colorPalettes = [
    "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25",
    "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/25",
    "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/25",
    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25",
    "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25",
    "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/25",
    "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/25",
  ];

  return colorPalettes[charCode % colorPalettes.length];
};

export const ItemAvatar: React.FC<ItemAvatarProps> = ({
  src,
  name,
  size = "md",
  onClick,
  className,
  alt,
}) => {
  const [imageError, setImageError] = useState(false);

  const cleanSrc =
    src &&
    typeof src === "string" &&
    src.trim() !== "" &&
    src !== "null" &&
    src !== "undefined" &&
    src !== "none"
      ? src.trim()
      : null;

  const firstLetter = (name || "?").trim().charAt(0).toUpperCase();
  const colorStyle = getAvatarColors(name);

  const sizeClasses = {
    sm: "w-8 h-8 text-xs rounded-md",
    md: "w-11 h-11 text-base rounded-lg",
    lg: "w-16 h-16 text-xl rounded-xl",
  };

  const showImage = cleanSrc && !imageError;

  return (
    <div
      onClick={showImage && onClick ? onClick : undefined}
      className={cn(
        "relative flex items-center justify-center shrink-0 overflow-hidden font-bold select-none transition-all duration-200 border",
        sizeClasses[size],
        showImage
          ? "bg-card border-border cursor-pointer hover:opacity-90 shadow-sm"
          : colorStyle,
        className
      )}
    >
      {showImage ? (
        <img
          src={cleanSrc}
          alt={alt || name}
          className="w-full h-full object-cover rounded-inherit"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className="leading-none drop-shadow-xs">{firstLetter}</span>
      )}
    </div>
  );
};
