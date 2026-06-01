import { useRef, useState, useCallback, useEffect } from 'react';
import { io } from 'socket.io-client';

// Components
import PhysicsCanvas from './components/PhysicsCanvas';
import Toolbar from './components/Toolbar';
import Analytics from './components/Analytics';
import ExperimentLibrary from './components/ExperimentLibrary';
import MultiplayerLobby from './components/MultiplayerLobby';
import Toast from './components/Toast';

function App() {
  const canvasRef = useRef(null);
  const [statsData, setStatsData] = useState([]);
  const [activeTool, setActiveTool] = useState('cursor'); 
  
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isLobbyOpen, setIsLobbyOpen] = useState(false);
  
  // NEW: UI Theme State (Default to Light Mode as requested)
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const [userName, setUserName] = useState('');
  const [roomCode, setRoomCode] = useState(null);
  const [isHost, setIsHost] = useState(true); 
  const socketRef = useRef(null);
  const [toasts, setToasts] = useState([]);

  const triggerToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_BACKEND_URL);

    socketRef.current.on('room-joined', (data) => {
      setIsHost(data.isHost);
      triggerToast(data.isHost ? "🚀 Lab session created! You are the Host." : "🤝 Connected to shared lab as a Guest.", "success");
    });

    socketRef.current.on('host-promoted', () => {
      setIsHost(true);
      triggerToast("The previous host left. You have been promoted to Host! 👑", "success");
    });

    socketRef.current.on('room-notification', (data) => {
      triggerToast(data.message, data.type || "info");
    });

    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, [triggerToast]);

  const handleUpdateStats = useCallback((newStat) => {
    setStatsData(prevData => {
      const updatedData = [...prevData, newStat];
      if (updatedData.length > 50) return updatedData.slice(1);
      return updatedData;
    });
  }, []);

  const handleJoinRoom = (name, code) => {
    setUserName(name);
    setRoomCode(code);
    if (code && socketRef.current) {
      socketRef.current.emit('join-room', { name, code });
    } else {
      setIsHost(true);
      triggerToast("Returned to offline local mode.", "warning");
    }
  };

  // Dynamic Tailwind classes based on theme
  const bgClass = isDarkMode ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900";
  const navClass = isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
  const panelClass = isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";

  return (
    <div className={`h-screen w-screen flex flex-col font-sans transition-colors duration-300 ${bgClass}`}>
      
      {/* TOP NAVIGATION BAR */}
      <nav className={`h-14 border-b flex items-center justify-between px-6 shadow-sm z-10 transition-colors duration-300 ${navClass}`}>
        <h1 
          className={`text-2xl tracking-widest transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}
          style={{ fontFamily: "'Rostex', sans-serif" }}
        >
          VIRTUAL-LAB
        </h1>
        
        <div className="flex items-center gap-4">
          {/* NEW: Theme Toggle Button */}
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-full border transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-600 text-yellow-400' : 'bg-slate-100 border-slate-300 text-indigo-600'}`}
            title="Toggle Light/Dark Mode"
          >
            {isDarkMode ? '🌙' : '☀️'}
          </button>

          <button 
            onClick={() => setIsLobbyOpen(true)}
            className={`px-4 py-1.5 rounded-full text-sm font-bold transition flex items-center gap-2 ${
              roomCode 
                ? (isDarkMode ? 'bg-indigo-900 text-indigo-200 border-indigo-500' : 'bg-indigo-100 text-indigo-700 border-indigo-300') 
                : (isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-600' : 'bg-white text-slate-600 border-slate-300')
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${roomCode ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`}></div>
            {roomCode ? `ROOM: ${roomCode}` : 'Local Mode (Go Multiplayer)'}
          </button>
        </div>
      </nav>

      {/* MAIN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        
        <div className={`w-64 border-r p-4 flex flex-col transition-colors duration-300 ${panelClass}`}>
          <Toolbar 
            onAddSquare={() => canvasRef.current?.addSquare()}
            onAddCircle={() => canvasRef.current?.addCircle()}
            onClear={() => { canvasRef.current?.clearWorkspace(); setStatsData([]); }}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            onOpenLibrary={() => setIsLibraryOpen(true)} 
          />
        </div>

        <div className={`flex-1 flex items-center justify-center p-6 relative transition-colors duration-300 ${isDarkMode ? 'bg-slate-950' : 'bg-slate-100'}`}>
          <PhysicsCanvas 
            ref={canvasRef} 
            onUpdateStats={handleUpdateStats} 
            activeTool={activeTool} 
            socket={socketRef.current}
            roomCode={roomCode}
            isHost={isHost}
            isDarkMode={isDarkMode} /* Pass the theme state down */
          />
        </div>

        <div className={`w-80 border-l p-4 transition-colors duration-300 ${panelClass}`}>
          <Analytics data={statsData} isDarkMode={isDarkMode} />
        </div>
      </div>

      <ExperimentLibrary 
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSave={() => { triggerToast("Experiment saved.", "success"); return canvasRef.current?.saveWorkspace(); }}
        onLoad={(data) => { canvasRef.current?.loadWorkspace(data); triggerToast("Loaded experiment.", "success"); }}
      />

      <MultiplayerLobby 
        isOpen={isLobbyOpen} onClose={() => setIsLobbyOpen(false)}
        onJoinRoom={handleJoinRoom} currentRoom={roomCode} userName={userName} triggerToast={triggerToast}
      />
      
      <Toast toasts={toasts} />
    </div>
  );
}

export default App;