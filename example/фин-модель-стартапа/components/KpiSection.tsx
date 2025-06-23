import React from 'react';
import { KpiSectionProps } from '../types';

const KpiItem: React.FC<{ label: string; value: string | number; unit?: string }> = ({ label, value, unit }) => (
 <div className="flex flex-col sm:flex-row justify-between sm:items-center py-3 border-b border-slate-200 last:border-b-0">
    <span className="text-slate-600 text-sm mb-1 sm:mb-0">{label}:</span>
    <span className="font-semibold text-slate-800 text-lg">
      {value} {unit && <span className="text-xs font-normal text-slate-500 ml-1">{unit}</span>}
    </span>
  </div>
);


const KpiSection: React.FC<KpiSectionProps> = ({ kpis }) => {
  return (
    <div className="space-y-1">
      <KpiItem 
        label="Месяц выхода на опер. безубыточность" 
        value={kpis.operationalBreakevenMonth} 
        unit={typeof kpis.operationalBreakevenMonth === 'number' && kpis.operationalBreakevenMonth >= 0 ? "мес." : ""} 
      />
      <KpiItem 
        label="Срок окупаемости MVP" 
        value={kpis.paybackPeriodMonths} 
        unit={typeof kpis.paybackPeriodMonths === 'number' && kpis.paybackPeriodMonths >= 0 ? "мес." : ""} 
      />
    </div>
  );
};

export default KpiSection;