import { useState, useEffect } from 'react';

export default function ExperimentLibrary({ isOpen, onClose, onSave, onLoad }) {
  const [experiments, setExperiments] = useState([]);
  const [newSaveName, setNewSaveName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch from MongoDB when the modal opens
  useEffect(() => {
    if (isOpen) {
      fetch('http://localhost:5000/api/experiments')
        .then(res => res.json())
        .then(data => setExperiments(data))
        .catch(err => console.error("Error loading experiments:", err));
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!newSaveName.trim()) return;
    const experimentData = onSave(); 
    if (!experimentData) return;

    setIsProcessing(true);
    try {
      const response = await fetch('http://localhost:5000/api/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSaveName, data: experimentData })
      });
      const savedExp = await response.json();
      // Add the new save to the top of the list
      setExperiments([savedExp, ...experiments]);
      setNewSaveName("");
    } catch (err) {
      console.error("Error saving experiment:", err);
    }
    setIsProcessing(false);
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/experiments/${id}`, { method: 'DELETE' });
      // Remove it from the UI after successful deletion
      setExperiments(experiments.filter(exp => exp._id !== id));
    } catch (err) {
      console.error("Error deleting experiment:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl border border-slate-600 overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900">
          <h2 className="text-xl font-bold text-white">Experiment Library (Cloud)</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">&times;</button>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto">
          {/* Save New Form */}
          <div className="flex gap-4 mb-8 bg-slate-900/50 p-4 rounded-lg border border-slate-700">
            <input 
              type="text" 
              placeholder="Name your experiment (e.g., 'Double Pendulum')"
              className="flex-1 bg-slate-950 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
              value={newSaveName}
              onChange={(e) => setNewSaveName(e.target.value)}
              disabled={isProcessing}
            />
            <button 
              onClick={handleSave}
              disabled={isProcessing}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold py-2 px-6 rounded transition"
            >
              {isProcessing ? 'Saving...' : 'Save to Cloud'}
            </button>
          </div>

          {/* Gallery View */}
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Cloud Templates</h3>
          {experiments.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No experiments saved in the database yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {experiments.map(exp => (
                // Note: MongoDB uses _id instead of id
                <div key={exp._id} className="bg-slate-700 rounded-lg p-4 border border-slate-600 flex flex-col">
                  <h4 className="font-bold text-white truncate">{exp.name}</h4>
                  <p className="text-xs text-slate-400 mb-4">{new Date(exp.createdAt).toLocaleDateString()}</p>
                  <div className="mt-auto flex gap-2">
                    <button 
                      onClick={() => { onLoad(exp.data); onClose(); }}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-sm py-1.5 rounded transition"
                    >
                      Load
                    </button>
                    <button 
                      onClick={() => handleDelete(exp._id)}
                      className="bg-slate-600 hover:bg-red-500 text-white text-sm py-1.5 px-3 rounded transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}