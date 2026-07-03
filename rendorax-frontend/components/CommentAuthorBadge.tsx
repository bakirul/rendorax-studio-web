"use client";

import React, { useState } from "react";
import { getAuthorInitials } from "@/utils/commentAuthor";

interface CommentAuthorBadgeProps {
  displayName: string;
  avatarUrl?: string | null;
  className?: string;
}

export default function CommentAuthorBadge({
  displayName,
  avatarUrl,
  className = "",
}: CommentAuthorBadgeProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const initials = getAuthorInitials(displayName);
  const showImage = Boolean(avatarUrl?.trim()) && !imageFailed;

  return (
    <div
      className={`flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[#1c1c24] text-[9px] font-bold uppercase tracking-wide text-[#d4af37] ${className}`}
      title={displayName}
      aria-hidden={!showImage}
    >
      {showImage ? (
        <img
          src={avatarUrl!.trim()}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span aria-label={displayName}>{initials}</span>
      )}
    </div>
  );
}
