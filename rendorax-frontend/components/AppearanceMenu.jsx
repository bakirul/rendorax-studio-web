// --- UPDATED: Appearance Menu Component (Slider & Aspect Ratio) ---
const AppearanceMenu = ({ settings, onSettingsChange }: { settings: any, onSettingsChange: (k: string, v: any) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="text-[10px] uppercase tracking-widest border border-white/10 px-3 py-1.5 hover:border-gold-primary transition-colors text-white flex items-center gap-2 bg-[#050505]"
      >
        <span>⚙️</span> Appearance
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-bg-panel border border-white/10 p-4 z-50 shadow-2xl rounded-md">
          <h4 className="text-[10px] text-gray-500 uppercase tracking-widest mb-4 border-b border-white/10 pb-2">View Settings</h4>
          
          {/* Thumbnail Scale Slider */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-300">Thumbnail Scale</span>
              <span className="text-[10px] text-gold-primary font-mono">{settings.thumbSize}px</span>
            </div>
            <input 
              type="range" 
              min="80" 
              max="300" 
              value={settings.thumbSize} 
              onChange={(e) => onSettingsChange('thumbSize', Number(e.target.value))}
              className="w-full accent-gold-primary cursor-ew-resize"
            />
          </div>

          {/* Aspect Ratio Buttons */}
          <div className="mb-2">
            <span className="text-xs text-gray-300 block mb-2">Aspect Ratio</span>
            <div className="flex bg-[#050505] rounded border border-white/10 p-1 gap-1">
              <button 
                onClick={() => onSettingsChange('aspectRatio', 'video')} 
                className={`flex-1 py-1.5 text-xs rounded transition-all ${settings.aspectRatio === 'video' ? 'bg-gold-primary text-black font-bold' : 'text-gray-400 hover:text-white'}`}
              >
                16:9
              </button>
              <button 
                onClick={() => onSettingsChange('aspectRatio', 'square')} 
                className={`flex-1 py-1.5 text-xs rounded transition-all ${settings.aspectRatio === 'square' ? 'bg-gold-primary text-black font-bold' : 'text-gray-400 hover:text-white'}`}
              >
                1:1
              </button>
              <button 
                onClick={() => onSettingsChange('aspectRatio', 'portrait')} 
                className={`flex-1 py-1.5 text-xs rounded transition-all ${settings.aspectRatio === 'portrait' ? 'bg-gold-primary text-black font-bold' : 'text-gray-400 hover:text-white'}`}
              >
                9:16
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
// ------------------------------------
