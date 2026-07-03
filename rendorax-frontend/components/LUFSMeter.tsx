"use client";
import React from "react";

interface LUFSMeterProps {
  lufs: number;
}

const LUFSMeter = React.memo(({ lufs }: LUFSMeterProps) => {
  const boundedLufs = Math.max(-60, Math.min(0, lufs));
  const heightPercentage = ((boundedLufs + 60) / 60) * 100;

  let barColor = "bg-green-500";
  if (boundedLufs > -14 && boundedLufs <= -9) barColor = "bg-yellow-400";
  else if (boundedLufs > -9) barColor = "bg-red-500";

  return (
    <div
      className="flex flex-col items-center gap-2 h-full justify-center w-12 shrink-0 bg-[#121217] rounded-xl border border-white/5 p-2 shadow-xl z-10"
      title={`Momentary LUFS: ${boundedLufs.toFixed(1)} dBFS`}
    >
      <div className="text-[9px] text-gray-500 font-mono font-bold">0</div>
      <div className="w-3.5 flex-1 min-h-[150px] bg-[#050505] rounded-full border border-white/10 overflow-hidden relative flex flex-col-reverse shadow-inner">
        <div
          className={`w-full transition-all duration-75 ease-linear ${barColor}`}
          style={{ height: `${heightPercentage}%` }}
        />
        <div
          className="absolute top-[23%] left-0 w-full border-b-2 border-yellow-500/50"
          title="-14 dBFS Target"
        />
        <div
          className="absolute top-[50%] left-0 w-full border-b border-white/20"
          title="-30 dBFS"
        />
      </div>
      <div className="text-[9px] text-gray-500 font-mono font-bold">-60</div>
      <div className="mt-1 text-[9px] text-[#d4af37] font-bold text-center w-full bg-[#1c1c24] py-1 rounded shadow border border-white/5 truncate">
        {boundedLufs === -60 ? "-∞" : boundedLufs.toFixed(0)}
      </div>
    </div>
  );
});

LUFSMeter.displayName = "LUFSMeter";

export default LUFSMeter;
