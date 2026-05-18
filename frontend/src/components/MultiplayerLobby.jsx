import { useState } from 'react';

export default function MultiplayerLobby({ isOpen, onClose, onJoinRoom, currentRoom, userName, triggerToast }) {
  const [nameInput, setNameInput] = useState(userName || '');
  const [joinCodeInput, setJoinCodeInput] = useState('');

  if (!isOpen) return null;

  const handleCreate = () => {
    if (!nameInput.trim()) {
      triggerToast("Please enter your name before creating a lab session!", "warning");
      return;
    }
    const newRoomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    onJoinRoom(nameInput, newRoomCode);
    onClose();
  };

  const handleJoin = () => {
    if (!nameInput.trim()) {
      triggerToast("Please enter your name before joining a group!", "warning");
      return;
    }
    if (!joinCodeInput.trim()) {
      triggerToast("Please enter a valid 6-character room code!", "warning");
      return;
    }
    onJoinRoom(nameInput, joinCodeInput.toUpperCase());
    onClose();
  };

  const handleDisconnect = () => {
    onJoinRoom('', null); 
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md border border-slate-600 overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-900">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            🌐 Multiplayer Network
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>
        
        <div className="p-6 flex flex-col gap-6">
          <div className="bg-slate-900 rounded p-3 border border-slate-700 text-center">
            <p className="text-sm text-slate-400 mb-1">Current Status</p>
            {currentRoom ? (
              <div>
                <p className="text-emerald-400 font-bold text-lg">Connected as {userName}</p>
                <p className="text-white text-xl tracking-widest font-mono mt-1">ROOM: {currentRoom}</p>
              </div>
            ) : (
              <p className="text-slate-300 font-medium">Local Offline Mode</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Your Identity</label>
            <input 
              type="text" 
              placeholder="Enter your display name"
              className="w-full bg-slate-950 border border-slate-600 rounded px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              disabled={!!currentRoom} 
            />
          </div>

          {!currentRoom ? (
            <>
              <div className="border-t border-slate-700 my-2"></div>
              
              <div className="flex flex-col gap-4">
                <button 
                  onClick={handleCreate}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded shadow transition"
                >
                  Create New Shared Lab
                </button>
                
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <div className="flex-1 h-px bg-slate-700"></div>
                  <span>OR</span>
                  <div className="flex-1 h-px bg-slate-700"></div>
                </div>

                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Room Code"
                    className="flex-1 bg-slate-950 border border-slate-600 rounded px-4 py-2 text-white font-mono uppercase focus:outline-none focus:border-emerald-500"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value)}
                    maxLength={6}
                  />
                  <button 
                    onClick={handleJoin}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-6 rounded shadow transition"
                  >
                    Join
                  </button>
                </div>
              </div>
            </>
          ) : (
            <button 
              onClick={handleDisconnect}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded shadow transition mt-4"
            >
              Disconnect & Return to Local
            </button>
          )}
        </div>
      </div>
    </div>
  );
}