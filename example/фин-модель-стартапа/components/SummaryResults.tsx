import React from 'react';
import { SummaryResultsProps, SummaryCardProps } from '../types';

const formatCurrency = (value: number, showSign = false) => {
  const sign = value > 0 && showSign ? '+' : '';
  return sign + value.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const formatNumber = (value: number, maximumFractionDigits = 0) => {
  return value.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: maximumFractionDigits });
};

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, details, positive, negative }) => (
  <div className="bg-white p-4 rounded-lg shadow flex flex-col justify-between">
    <div>
      <h3 className="text-sm text-slate-500 mb-1">{title}</h3>
      <p className={`text-2xl font-bold ${positive ? 'text-green-600' : negative ? 'text-red-600' : 'text-slate-800'}`}>
        {value}
      </p>
    </div>
    {details && details.length > 0 && (
      <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-500 space-y-1">
        {details.map((detail, index) => (
          <div key={index} className="flex justify-between">
            <span>{detail.label}</span>
            <span className="font-medium text-slate-600">{detail.value}</span>
          </div>
        ))}
      </div>
    )}
  </div>
);

const SummaryResults: React.FC<SummaryResultsProps> = ({ metrics, projectionYears }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      <SummaryCard 
        title="Месячная выручка" 
        value={formatCurrency(metrics.finalMonthRevenue)}
        details={[
            { label: `Общее за ${projectionYears} года:`, value: formatCurrency(metrics.totalRevenueTwoYears) },
        ]}
      />
      <SummaryCard 
        title="Месячные расходы" 
        value={formatCurrency(metrics.finalMonthExpenses)} 
        details={[
             { label: `MVP:`, value: formatCurrency(metrics.mvpCost) },
        ]}
      />
      <SummaryCard 
        title="Месячная прибыль" 
        value={formatCurrency(metrics.finalMonthProfit, true)}
        positive={metrics.finalMonthProfit > 0}
        negative={metrics.finalMonthProfit < 0}
        details={[
            { label: `Общая за ${projectionYears} года:`, value: formatCurrency(metrics.totalProfitTwoYears, true)},
        ]}
      />
      <SummaryCard 
        title="Актив. участники" 
        value={formatNumber(metrics.finalMonthActiveUsers)} 
        details={[
            { label: `Новых индивид. в месяц:`, value: formatNumber(metrics.totalNewUsersLastMonth) },
            { label: `Корп. контракты (всего):`, value: formatNumber(metrics.finalMonthActiveCorporateContracts, 2) }
        ]}
      />
    </div>
  );
};

export default SummaryResults;