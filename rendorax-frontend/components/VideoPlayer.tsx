import React from "react";
import { useFrameAccurateVideo } from "@/hooks/useFrameAccurateVideo";

interface VideoPlayerProps {
  url: string;
  videoRef: React.RefObject<HTMLVideoElement>;
  smpteTimecode: string;
  stepForward: () => void;
  stepBackward: () => void;
  aspectClass: string;
  objectFitClass: string;
}

export default function VideoPlayer({
  url, videoRef, smpteTimecode, stepForward, stepBackward, aspectClass, objectFitClass
}: VideoPlayerProps) {
  return (
    <div className="flex flex-col items-center gap-4 max-w-full max-h-full">
      <video
        ref={videoRef}
        src={url}
        controls
        className={`max-w-full max-h-[60vh] lg:max-h-[68vh] object-contain bg-black shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded border border-white/5 transition-all duration-500 ease-in-out ${aspectClass} ${objectFitClass}`}
      />
      
      {/* Controller UI */}
      <div className="flex items-center gap-4 bg-[#121217] border border-white/10 px-4 py-2 rounded-full shadow-xl text-xs select-none">
        <div className="flex items-center gap-2">
          <button onClick={stepBackward} className="p-2 hover:bg-[#d4af37]/20 border border-white/5 rounded text-gray-400 hover:text-[#d4af37]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>

          <div className="font-mono text-[11px] text-[#d4af37] px-3 py-1 bg-[#050505] rounded border border-white/10">
            {smpteTimecode}
          </div>

          <button onClick={stepForward} className="p-2 hover:bg-[#d4af37]/20 border border-white/5 rounded text-gray-400 hover:text-[#d4af37]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}