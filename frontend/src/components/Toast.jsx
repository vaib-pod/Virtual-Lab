export default function Toast({ toasts }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div 
          key={toast.id}
          // Tailwind handles the styling and a smooth slide-in animation
          className="bg-slate-800 border border-slate-600 text-white px-5 py-3 rounded-lg shadow-2xl flex items-center gap-3 transform transition-all duration-300 translate-y-0 opacity-100"
        >
          {/* Change the icon based on the type of notification */}
          {toast.type === 'success' && <span className="text-emerald-400 text-lg">✨</span>}
          {toast.type === 'info' && <span className="text-blue-400 text-lg">ℹ️</span>}
          {toast.type === 'warning' && <span className="text-amber-400 text-lg">⚠️</span>}
          
          <p className="text-sm font-medium tracking-wide">{toast.message}</p>
        </div>
      ))}
    </div>
  );
}
