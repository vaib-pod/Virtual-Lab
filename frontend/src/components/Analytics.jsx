import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Analytics({ data }) {
  return (
    <div className="h-full flex flex-col text-slate-200">
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
        Real-Time Metrics
      </h2>
      
      <div className="flex-1 min-h-[250px] mb-6">
        <h3 className="text-xs text-slate-500 mb-2">Kinetic Energy (J)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" tick={false} stroke="#475569" />
            <YAxis stroke="#475569" width={40} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
              labelStyle={{ display: 'none' }}
            />
            <Line 
              type="monotone" 
              dataKey="kineticEnergy" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={false}
              isAnimationActive={false} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex-1 min-h-[250px]">
        <h3 className="text-xs text-slate-500 mb-2">Velocity (m/s)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" tick={false} stroke="#475569" />
            <YAxis stroke="#475569" width={40} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
              labelStyle={{ display: 'none' }}
            />
            <Line 
              type="monotone" 
              dataKey="speed" 
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}