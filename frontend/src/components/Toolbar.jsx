export default function Toolbar({ onAddSquare, onAddCircle, onClear, activeTool, setActiveTool, onOpenLibrary }) {
  // Helper for styling the active button
  const getToolStyle = (toolName) => {
    const baseStyle = "w-full py-2 rounded shadow transition font-medium text-sm text-white ";
    return activeTool === toolName 
      ? baseStyle + "bg-indigo-600 ring-2 ring-indigo-300" // Highlighted
      : baseStyle + "bg-slate-700 hover:bg-slate-600";     // Default
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">
        Spawn Objects
      </h2>
      <button onClick={onAddSquare} className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded shadow transition text-sm">
        + Add Mass
      </button>
      <button onClick={onAddCircle} className="w-full bg-emerald-600 hover:bg-emerald-500 py-2 rounded shadow transition text-sm">
        + Add Wheel
      </button>

      <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mt-4 mb-1">
        Interaction Mode
      </h2>
      <button onClick={() => setActiveTool('cursor')} className={getToolStyle('cursor')}>
        👆 Drag & Drop
      </button>
      <button onClick={() => setActiveTool('spring')} className={getToolStyle('spring')}>
        〰️ Spring
      </button>
      <button onClick={() => setActiveTool('rope')} className={getToolStyle('rope')}>
        🔗 Rope
      </button>
      <div className="mt-auto pt-8 flex flex-col gap-3">
        {/* NEW BUTTON */}
        <button 
          onClick={onOpenLibrary} 
          className="w-full bg-slate-700 text-white hover:bg-slate-600 py-2 rounded shadow transition text-sm font-bold border border-slate-500"
        >
          📂 Experiment Library
        </button>

        <button onClick={onClear} className="w-full bg-red-600 text-white hover:bg-red-500 py-2 rounded shadow transition text-sm font-bold">
          Clear Workspace
        </button>
      </div>
    </div>
  );
}