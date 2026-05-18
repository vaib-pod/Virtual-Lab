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
  
  const [userName, setUserName] = useState('');
  const [roomCode, setRoomCode] = useState(null);
  const [isHost, setIsHost] = useState(true); 
  const socketRef = useRef(null);

  const [toasts, setToasts] = useState([]);

  const triggerToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  // Set up network connection listeners
  useEffect(() => {
    socketRef.current = io('http://localhost:5000');

    socketRef.current.on('room-joined', (data) => {
      setIsHost(data.isHost);
      triggerToast(
        data.isHost ? "🚀 Lab session created! You are the Host." : "🤝 Connected to shared lab as a Guest.", 
        "success"
      );
    });

    // NEW: Listen for the server shifting physics authority to your client
    socketRef.current.on('host-promoted', () => {
      setIsHost(true);
      triggerToast("The previous host left. You have been promoted to Host! 👑 Physics authority is now yours.", "success");
    });

    // NEW: Handle centralized formatting for room notification logs (joins, exits, host shifts)
    socketRef.current.on('room-notification', (data) => {
      triggerToast(data.message, data.type || "info");
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
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

  return (
    <div className="h-screen w-screen bg-slate-950 text-white flex flex-col font-sans">
      
      <nav className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shadow-sm">
        <h1 className="font-bold text-xl tracking-wider text-emerald-400">VIRTUAL-LAB</h1>
        
        <button 
          onClick={() => setIsLobbyOpen(true)}
          className={`px-4 py-1.5 rounded-full text-sm font-bold transition flex items-center gap-2 ${
            roomCode 
              ? 'bg-indigo-900 text-indigo-200 border border-indigo-500 hover:bg-indigo-800' 
              : 'bg-slate-800 text-slate-400 border border-slate-600 hover:bg-slate-700'
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${roomCode ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></div>
          {roomCode ? `ROOM: ${roomCode}` : 'Local Mode (Click to go Multiplayer)'}
        </button>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 border-r border-slate-800 bg-slate-900 p-4 flex flex-col">
          <Toolbar 
            onAddSquare={() => canvasRef.current?.addSquare()}
            onAddCircle={() => canvasRef.current?.addCircle()}
            onClear={() => {
              canvasRef.current?.clearWorkspace();
              setStatsData([]); 
              triggerToast("Workspace cleared cleanly.", "warning");
            }}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            onOpenLibrary={() => setIsLibraryOpen(true)} 
          />
        </div>

        <div className="flex-1 flex items-center justify-center bg-slate-950 p-6 relative">
          <PhysicsCanvas 
            ref={canvasRef} 
            onUpdateStats={handleUpdateStats} 
            activeTool={activeTool} 
            socket={socketRef.current}
            roomCode={roomCode}
            isHost={isHost}
          />
        </div>

        <div className="w-80 border-l border-slate-800 bg-slate-900 p-4">
          <Analytics data={statsData} />
        </div>
      </div>

      <ExperimentLibrary 
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSave={() => {
          triggerToast("Experiment saved to cloud database.", "success");
          return canvasRef.current?.saveWorkspace();
        }}
        onLoad={(data) => {
          canvasRef.current?.loadWorkspace(data);
          triggerToast("Loaded experiment layout from cloud.", "success");
        }}
      />

      <MultiplayerLobby 
        isOpen={isLobbyOpen}
        onClose={() => setIsLobbyOpen(false)}
        onJoinRoom={handleJoinRoom}
        currentRoom={roomCode}
        userName={userName}
        triggerToast={triggerToast}
      />
      
      <Toast toasts={toasts} />
    </div>
  );
}

export default App;