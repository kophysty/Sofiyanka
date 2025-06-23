
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, AreaChart, Area, ComposedChart } from 'recharts';
import { ChartsSectionProps, MonthlyFinancialDataPoint } from '../types';

const COLORS_PIE = ['#0ea5e9', '#64748b', '#10b981', '#f59e0b', '#ef4444']; 

// Main chart colors
const COLOR_REVENUE_TOTAL = '#3b82f6'; // Blue for total revenue line
const COLOR_MARKETING = '#82ca9d'; 
const COLOR_PERSONNEL = '#ffc658'; 
const COLOR_SERVER = '#d1d5db'; 
const COLOR_ACCOUNTING = '#7e57c2'; // Purple for accounting
const COLOR_TAXES = '#ff7300'; 
const COLOR_DIRECT_USERS = '#60a5fa'; 
const COLOR_ACTIVE_USERS = '#1d4ed8'; 

// Revenue Structure Colors
const COLOR_REVENUE_STANDARD = '#8884d8';
const COLOR_REVENUE_EXTENDED = '#82ca9d'; 
const COLOR_REVENUE_CORP_SETUP = '#ffc658'; 
const COLOR_REVENUE_CORP_MONTHLY = '#a4de6c'; 


const SHARED_CHART_PROPS = {
  margin: { top: 5, right: 20, left: 30, bottom: 20 },
};

const formatCurrency = (value: number) => value.toLocaleString('ru-RU', { maximumFractionDigits: 0 });
const formatNumber = (value: number) => value.toLocaleString('ru-RU', {maximumFractionDigits: 0 });

const CustomTooltipGeneral: React.FC<any> = ({ active, payload, label, yFormatter = formatCurrency, yLabel = "Сумма", isRevenueStructure = false, isPie = false }) => {
  if (active && payload && payload.length) {
    let totalForMonth = 0;
    if (isRevenueStructure) {
        payload.forEach((entry: any) => {
            totalForMonth += entry.value || 0;
        });
    }

    return (
      <div className="bg-white p-3 border border-slate-300 rounded shadow-lg text-sm z-50">
        {!isPie && <p className="font-semibold mb-1">{`Месяц: ${label}`}</p>}
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} style={{ color: entry.color || entry.stroke || entry.payload?.fill }} className="capitalize">
            {entry.name}: {yFormatter(entry.value)}
          </p>
        ))}
        {isRevenueStructure && payload.length > 1 && (
            <p className="font-semibold mt-1 pt-1 border-t border-slate-200">
                Всего выручка: {yFormatter(totalForMonth)}
            </p>
        )}
      </div>
    );
  }
  return null;
};

const ChartContainer: React.FC<{ title: string; children: React.ReactNode; height?: number; className?: string }> = ({ title, children, height = 350, className = "" }) => (
  <div className={`p-4 border border-slate-200 rounded-lg bg-slate-50/30 ${className}`}>
    <h3 className="text-lg font-semibold text-slate-700 mb-4 text-center">{title}</h3>
    <ResponsiveContainer width="100%" height={height}>
      {children}
    </ResponsiveContainer>
  </div>
);

const ChartsSection: React.FC<ChartsSectionProps> = ({ mvpCostPieData, financialHistory, userGrowthHistory }) => {
  const validPieData = mvpCostPieData.filter(d => d.value > 0);

  const profitColor = (value: number | undefined) => (value !== undefined && value >= 0) ? '#16a34a' : '#dc2626'; 

  const lastMonthProfit = financialHistory.length > 0 ? financialHistory[financialHistory.length -1].netProfit : 0;

  return (
    <div className="space-y-6"> 
      <ChartContainer title="Выручка, расходы и прибыль">
        <ComposedChart data={financialHistory} {...SHARED_CHART_PROPS}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="month" tick={{fontSize: '0.75rem', fill: '#64748b'}} label={{ value: "Месяц", position: "insideBottom", offset: -10, fontSize: '0.875rem', fill: '#64748b' }}/>
          <YAxis tickFormatter={(val) => `${formatCurrency(val / 1000)}k`} tick={{fontSize: '0.75rem', fill: '#64748b'}} label={{ value: "Сумма (₽)", angle: -90, position: "insideLeft", offset: -25, fontSize: '0.875rem', fill: '#64748b' }}/>
          <Tooltip content={<CustomTooltipGeneral />} />
          <Legend wrapperStyle={{fontSize: '0.875rem', paddingTop: '10px'}}/>
          <Line type="monotone" dataKey="revenue" name="Общая выручка" stroke={COLOR_REVENUE_TOTAL} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="marketingExpenses" name="Маркетинг" stroke={COLOR_MARKETING} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="personnelExpenses" name="ФОТ (всего)" stroke={COLOR_PERSONNEL} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="serverExpenses" name="Серверы" stroke={COLOR_SERVER} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="accountingExpenses" name="Бухгалтерия" stroke={COLOR_ACCOUNTING} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="taxes" name="Налоги" stroke={COLOR_TAXES} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="netProfit" name="Чистая прибыль" stroke={profitColor(lastMonthProfit)} strokeWidth={2.5} dot={false} />
        </ComposedChart>
      </ChartContainer>

      <ChartContainer title="Структура выручки" height={300}>
          <AreaChart data={financialHistory} {...SHARED_CHART_PROPS} margin={{...SHARED_CHART_PROPS.margin, left: 40}}>
               <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
               <XAxis dataKey="month" tick={{fontSize: '0.75rem', fill: '#64748b'}} label={{ value: "Месяц", position: "insideBottom", offset: -10, fontSize: '0.875rem', fill: '#64748b' }}/>
               <YAxis tickFormatter={(val) => `${formatCurrency(val / 1000)}k`} tick={{fontSize: '0.75rem', fill: '#64748b'}} label={{ value: "Сумма (₽)", angle: -90, position: "insideLeft", offset: -35, fontSize: '0.875rem', fill: '#64748b' }}/>
               <Tooltip content={<CustomTooltipGeneral isRevenueStructure={true} />} />
               <Legend wrapperStyle={{fontSize: '0.875rem', paddingTop: '10px'}}/>
               <Area type="monotone" dataKey="revenueStandard" name="Стандартные подписки" stroke={COLOR_REVENUE_STANDARD} fillOpacity={0.7} fill={COLOR_REVENUE_STANDARD} stackId="1" />
               <Area type="monotone" dataKey="revenueExtended" name="Расширенные подписки" stroke={COLOR_REVENUE_EXTENDED} fillOpacity={0.7} fill={COLOR_REVENUE_EXTENDED} stackId="1" />
               <Area type="monotone" dataKey="revenueCorporateSetup" name="Корпоративные (разово)" stroke={COLOR_REVENUE_CORP_SETUP} fillOpacity={0.7} fill={COLOR_REVENUE_CORP_SETUP} stackId="1" />
               <Area type="monotone" dataKey="revenueCorporateMonthly" name="Корпоративные (ежемес.)" stroke={COLOR_REVENUE_CORP_MONTHLY} fillOpacity={0.7} fill={COLOR_REVENUE_CORP_MONTHLY} stackId="1" />
          </AreaChart>
      </ChartContainer>
      
      <ChartContainer title="Структура затрат на MVP" height={300}>
        {validPieData.length > 0 ? (
          <PieChart>
            <Pie
              data={validPieData}
              cx="50%"
              cy="38%" // Adjusted: Shifted pie upwards
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name" 
              label={({ name, percent, x, y, midAngle, outerRadius: or }) => { // use destructured outerRadius
                const RADIAN = Math.PI / 180;
                const radius = or + 15; // Adjusted: Labels closer to pie
                const xPos = x + radius * Math.cos(-midAngle * RADIAN);
                const yPos = y + radius * Math.sin(-midAngle * RADIAN);
                return (
                  <text
                    x={xPos}
                    y={yPos}
                    fill="#334155" 
                    textAnchor={xPos > x ? "start" : "end"}
                    dominantBaseline="central"
                    fontSize="0.75rem"
                  >
                    {`${name} (${(percent * 100).toFixed(0)}%)`}
                  </text>
                );
              }}
            >
              {validPieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltipGeneral yFormatter={(val) => `${formatCurrency(val)} ₽`} isPie={true} />} /> 
            <Legend 
              itemGap={15} // Adjusted: Increased gap between legend items
              wrapperStyle={{fontSize: '0.75rem', paddingTop: '20px'}} 
              layout="horizontal" 
              align="center" 
              verticalAlign="bottom"
            />
          </PieChart>
        ) : (
          <div className="flex justify-center items-center h-full">
            <p className="text-center text-slate-500">Нет данных для MVP (стоимость MVP = 0).</p>
          </div>
        )}
      </ChartContainer>

      <ChartContainer title="Рост пользователей (индивидуальные)" height={300}>
        <LineChart data={userGrowthHistory} {...SHARED_CHART_PROPS} margin={{...SHARED_CHART_PROPS.margin, left: 20}}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="month" tick={{fontSize: '0.75rem', fill: '#64748b'}} label={{ value: "Месяц", position: "insideBottom", offset: -10, fontSize: '0.875rem', fill: '#64748b' }}/>
          <YAxis tickFormatter={formatNumber} tick={{fontSize: '0.75rem', fill: '#64748b'}} label={{ value: "Кол-во", angle: -90, position: "insideLeft", offset: -10, fontSize: '0.875rem', fill: '#64748b' }}/>
          <Tooltip content={<CustomTooltipGeneral yFormatter={formatNumber} yLabel="Пользователи"/>} />
          <Legend wrapperStyle={{fontSize: '0.875rem', paddingTop: '10px'}}/>
          <Line type="monotone" dataKey="activeUsers" name="Активные пользователи" stroke={COLOR_ACTIVE_USERS} strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="newDirectUsers" name="Прямой приток" stroke={COLOR_DIRECT_USERS} strokeWidth={1.5} dot={{ r: 2 }} />
          <Line type="monotone" dataKey="churnedUsers" name="Отток" stroke="#f87171" strokeWidth={1.5} dot={{ r: 2 }} />
        </LineChart>
      </ChartContainer>

    </div>
  );
};

export default ChartsSection;
