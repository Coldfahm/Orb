import React from 'react';
import { motion } from 'motion/react';
import { SystemStats } from '../lib/types';
import { Cpu, HardDrive, Wifi } from 'lucide-react';

interface SystemTelemetryViewProps {
  stats: SystemStats;
  orbitRadius?: number;
}

export const SystemTelemetryView: React.FC<SystemTelemetryViewProps> = ({
  stats,
  orbitRadius = 58,
}) => {
  const gauges = [
    {
      id: 'cpu',
      label: 'CPU',
      value: `${stats.cpuPercent.toFixed(0)}%`,
      percent: stats.cpuPercent,
      color: '#38bdf8',
      icon: Cpu,
    },
    {
      id: 'ram',
      label: 'RAM',
      value: `${stats.ramPercent.toFixed(0)}%`,
      percent: stats.ramPercent,
      color: '#a855f7',
      icon: HardDrive,
    },
    {
      id: 'net',
      label: 'NET',
      value: `${stats.netRxKbps > 500 ? (stats.netRxKbps / 1024).toFixed(1) + 'M' : stats.netRxKbps.toFixed(0) + 'K'}`,
      percent: Math.min(100, (stats.netRxKbps / 800) * 100),
      color: '#10b981',
      icon: Wifi,
    },
  ];

  const total = gauges.length;

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center outline-none border-0">
      {gauges.map((gauge, index) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * index) / total;
        const x = orbitRadius * Math.cos(angle);
        const y = orbitRadius * Math.sin(angle);

        const radius = 11;
        const circumference = 2 * Math.PI * radius;
        const strokeDashoffset = circumference - (gauge.percent / 100) * circumference;
        const Icon = gauge.icon;

        return (
          <motion.div
            key={gauge.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, x, y }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 25 }}
            style={{ position: 'absolute' }}
            className="pointer-events-auto flex flex-col items-center group cursor-default outline-none"
          >
            <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-slate-900/90 backdrop-blur-md border border-white/20 shadow-md">
              <svg className="w-7 h-7 -rotate-90" viewBox="0 0 28 28">
                <circle
                  cx="14"
                  cy="14"
                  r={radius}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.12)"
                  strokeWidth="2"
                />
                <motion.circle
                  cx="14"
                  cy="14"
                  r={radius}
                  fill="none"
                  stroke={gauge.color}
                  strokeWidth="2"
                  strokeDasharray={circumference}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  strokeLinecap="round"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <Icon className="w-2.5 h-2.5 text-white/80" />
              </div>
            </div>

            <div className="mt-0.5 px-1 py-0.2 rounded bg-slate-900/80 border border-white/10 text-[8px] font-mono text-white/80">
              {gauge.value}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
