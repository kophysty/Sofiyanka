
import React, { useState, useMemo, useCallback } from 'react';
import { FinancialInputs, CalculatedMetrics, KpiMetrics, PieChartData, MonthlyFinancialDataPoint, MonthlyUserGrowthDataPoint } from './types';
import InputSection from './components/InputSection';
import SummaryResults from './components/SummaryResults';
import KpiSection from './components/KpiSection';
import ChartsSection from './components/ChartsSection';

const PROJECTION_MONTHS = 24;

const initialInputs: FinancialInputs = {
  founderSalaryMonthly: 150000, 
  founderCount: 2,             
  mvpDevelopmentMonths: 3,     
  specialistRatePerHour: 3500,
  specialistHoursMVP: 60,
  mvpTgVersionCost: 250000,
  mvpSoftwareContingencyCost: 100000,
  mvpInitialServerCost: 50000,
  
  initialClientCount: 0,
  baseDirectNewUsersMonthly: 8, // Updated
  newUserInflowVariationPercentage: 0.2, 
  monthlyChurnAbsolute: 2, 

  baseMarketingSpendMonthly: 20000,
  marketingSpendAsProfitPercentage: 0.02, // Updated

  ongoingFounderSalaryMonthlyTotal: 100000, 
  serverCostsMonthly: 50000, // Updated
  supportHoursMonthly: 20, 
  accountingCostsMonthly: 15000, 
  
  subscriptionPricePerUser: 7000, 
  taxRate: 0.20,

  extendedPackagePrice: 14000, // Updated
  extendedPackageStartMonth: 10, // Updated
  percentageUsersConvertingToExtended: 0.05, 

  corporatePackageSetupFee: 500000,
  corporatePackageMonthlyFee: 50000,
  corporatePackageStartMonth: 14, // Updated
  newCorporateDealsPerMonth: 0.25, 
};

const App: React.FC = () => {
  const [inputs, setInputs] = useState<FinancialInputs>(initialInputs);

  const handleInputChange = useCallback((id: keyof FinancialInputs, value: number) => {
    setInputs(prevInputs => ({
      ...prevInputs,
      [id]: Math.max(id === 'percentageUsersConvertingToExtended' || id === 'taxRate' || id === 'marketingSpendAsProfitPercentage' || id === 'newUserInflowVariationPercentage' ? 0 : 0, value), 
    }));
  }, []);

  const mvpCosts = useMemo(() => {
    const founderMvpCostTotal = inputs.founderSalaryMonthly * inputs.founderCount * inputs.mvpDevelopmentMonths;
    const specialistMvpCost = inputs.specialistRatePerHour * inputs.specialistHoursMVP;
    const mvpCost = founderMvpCostTotal + 
                    specialistMvpCost + 
                    inputs.mvpTgVersionCost + 
                    inputs.mvpSoftwareContingencyCost + 
                    inputs.mvpInitialServerCost;
    return { mvpCost, founderMvpCostTotal, specialistMvpCost };
  }, [inputs.founderSalaryMonthly, inputs.founderCount, inputs.mvpDevelopmentMonths, 
      inputs.specialistRatePerHour, inputs.specialistHoursMVP,
      inputs.mvpTgVersionCost, inputs.mvpSoftwareContingencyCost, inputs.mvpInitialServerCost]);

  const projectionData = useMemo(() => {
    const financialHistory: MonthlyFinancialDataPoint[] = [];
    const userGrowthHistory: MonthlyUserGrowthDataPoint[] = [];
    let accumulatedProfit = -mvpCosts.mvpCost;
    
    let standardUsers = inputs.initialClientCount;
    let extendedUsers = 0;
    let activeCorporateClients = 0;

    let previousMonthNetProfit = 0;

    for (let month = 1; month <= PROJECTION_MONTHS; month++) {
      // User Growth & Churn with Randomness
      let newDirectIndividualUsers: number;
      if (month <= 3) {
        // First 3 months: Month 1: 2 users, Month 2: 3 users, Month 3: 2 users
        newDirectIndividualUsers = (month === 2) ? 3 : 2;
      } else {
        // After month 3, use the randomized calculation
        const variationAmount = inputs.baseDirectNewUsersMonthly * inputs.newUserInflowVariationPercentage;
        const randomFactor = (Math.random() * 2) - 1; 
        const randomOffset = randomFactor * variationAmount;
        newDirectIndividualUsers = Math.max(0, Math.round(inputs.baseDirectNewUsersMonthly + randomOffset));
      }
      
      let churnFromStandard = 0;
      let churnFromExtended = 0;
      const totalIndividualUsersBeforeChurn = standardUsers + extendedUsers;

      if (totalIndividualUsersBeforeChurn > 0) {
          const proportionStandard = standardUsers / totalIndividualUsersBeforeChurn;
          const proportionExtended = extendedUsers / totalIndividualUsersBeforeChurn;
          churnFromStandard = Math.min(standardUsers, Math.round(inputs.monthlyChurnAbsolute * proportionStandard));
          churnFromExtended = Math.min(extendedUsers, Math.round(inputs.monthlyChurnAbsolute * proportionExtended));
      }
      const totalChurnedUsers = churnFromStandard + churnFromExtended;

      standardUsers = Math.max(0, standardUsers - churnFromStandard);
      extendedUsers = Math.max(0, extendedUsers - churnFromExtended);
      standardUsers += newDirectIndividualUsers; // New users start as standard

      // Extended Package Conversion
      let newExtendedConversions = 0;
      if (month >= inputs.extendedPackageStartMonth && inputs.percentageUsersConvertingToExtended > 0) {
        newExtendedConversions = Math.min(standardUsers, Math.round(standardUsers * inputs.percentageUsersConvertingToExtended));
        standardUsers = Math.max(0, standardUsers - newExtendedConversions);
        extendedUsers += newExtendedConversions;
      }
      
      const currentActiveIndividualUsers = standardUsers + extendedUsers;

      // Corporate Package Adoption
      let newCorporateDealsThisMonth = 0;
      if (month >= inputs.corporatePackageStartMonth) {
        newCorporateDealsThisMonth = inputs.newCorporateDealsPerMonth; 
        activeCorporateClients += newCorporateDealsThisMonth;
      }

      userGrowthHistory.push({
        month,
        activeUsers: currentActiveIndividualUsers,
        standardUsersCount: standardUsers,
        extendedUsersCount: extendedUsers,
        newDirectUsers: newDirectIndividualUsers,
        churnedUsers: totalChurnedUsers,
        activeCorporateContracts: activeCorporateClients,
      });

      // Revenue Streams
      const revenueStandard = standardUsers * inputs.subscriptionPricePerUser;
      const revenueExtended = (month >= inputs.extendedPackageStartMonth) ? extendedUsers * inputs.extendedPackagePrice : 0;
      const revenueCorporateSetup = (month >= inputs.corporatePackageStartMonth) ? newCorporateDealsThisMonth * inputs.corporatePackageSetupFee : 0;
      const revenueCorporateMonthly = (month >= inputs.corporatePackageStartMonth) ? activeCorporateClients * inputs.corporatePackageMonthlyFee : 0;
      const totalRevenue = revenueStandard + revenueExtended + revenueCorporateSetup + revenueCorporateMonthly;
      
      // Expenses
      const supportExpenses = inputs.supportHoursMonthly * inputs.specialistRatePerHour;
      const personnelExpenses = inputs.ongoingFounderSalaryMonthlyTotal + supportExpenses;
      const serverExpenses = inputs.serverCostsMonthly;
      const accountingExpenses = inputs.accountingCostsMonthly; // New accounting expense
      const marketingSpendVariablePart = previousMonthNetProfit > 0 ? previousMonthNetProfit * inputs.marketingSpendAsProfitPercentage : 0;
      const marketingExpenses = inputs.baseMarketingSpendMonthly + marketingSpendVariablePart;
      
      const totalExpensesBeforeTax = personnelExpenses + serverExpenses + marketingExpenses + accountingExpenses;
      const profitBeforeTax = totalRevenue - totalExpensesBeforeTax;
      const taxes = profitBeforeTax > 0 ? profitBeforeTax * inputs.taxRate : 0;
      const netProfit = profitBeforeTax - taxes;
      accumulatedProfit += netProfit;

      financialHistory.push({
        month,
        revenue: totalRevenue,
        revenueStandard,
        revenueExtended,
        revenueCorporateSetup,
        revenueCorporateMonthly,
        marketingExpenses,
        personnelExpenses,
        serverExpenses,
        accountingExpenses, // Store for charting
        totalExpensesBeforeTax,
        profitBeforeTax,
        taxes,
        netProfit,
        accumulatedProfit,
      });

      previousMonthNetProfit = netProfit;
    }
    return { financialHistory, userGrowthHistory };
  }, [inputs, mvpCosts.mvpCost]);

  const calculatedMetrics = useMemo<CalculatedMetrics>(() => {
    const finalFinancials = projectionData.financialHistory[PROJECTION_MONTHS - 1];
    const finalUsersData = projectionData.userGrowthHistory[PROJECTION_MONTHS - 1];

    const totalRevenueTwoYears = projectionData.financialHistory.reduce((sum, data) => sum + data.revenue, 0);
    const totalProfitTwoYears = finalFinancials ? finalFinancials.accumulatedProfit : -mvpCosts.mvpCost;
    
    return {
      mvpCost: mvpCosts.mvpCost,
      founderMvpCostTotal: mvpCosts.founderMvpCostTotal,
      specialistMvpCost: mvpCosts.specialistMvpCost,
      finalMonthRevenue: finalFinancials?.revenue || 0,
      finalMonthExpenses: (finalFinancials?.totalExpensesBeforeTax || 0) + (finalFinancials?.taxes || 0),
      finalMonthProfit: finalFinancials?.netProfit || 0,
      finalMonthActiveUsers: finalUsersData?.activeUsers || 0,
      totalRevenueTwoYears,
      totalProfitTwoYears,
      totalNewUsersLastMonth: projectionData.userGrowthHistory[PROJECTION_MONTHS -1]?.newDirectUsers || 0,
      finalMonthActiveCorporateContracts: finalUsersData?.activeCorporateContracts || 0,
    };
  }, [projectionData, mvpCosts]);

  const kpiMetrics = useMemo<KpiMetrics>(() => {
    let operationalBreakevenMonth: number | string = "Не достигается";
    const firstProfitableMonth = projectionData.financialHistory.find(data => data.profitBeforeTax > 0);
    if (firstProfitableMonth) {
      operationalBreakevenMonth = firstProfitableMonth.month;
    } else if (mvpCosts.mvpCost === 0 && (projectionData.financialHistory[0]?.profitBeforeTax || -1) >= 0) {
      operationalBreakevenMonth = 0; 
    }
    
    let paybackPeriodMonths: number | string = "Не окупается";
    const paybackMonthData = projectionData.financialHistory.find(data => data.accumulatedProfit >= 0);
    if (paybackMonthData) {
      paybackPeriodMonths = paybackMonthData.month;
    } else if (mvpCosts.mvpCost === 0 && (projectionData.financialHistory[0]?.netProfit || -1) >=0) {
        paybackPeriodMonths = 0; 
    }

    return { operationalBreakevenMonth, paybackPeriodMonths };
  }, [projectionData.financialHistory, mvpCosts.mvpCost]);

  const mvpCostPieData = useMemo<PieChartData[]>(() => [
    { name: 'UI/Структура', value: mvpCosts.founderMvpCostTotal },
    { name: 'Специалист', value: mvpCosts.specialistMvpCost },    
    { name: 'TG Версия', value: inputs.mvpTgVersionCost },
    { name: 'Софт/Непредвид.', value: inputs.mvpSoftwareContingencyCost }, 
    { name: 'Сервера MVP', value: inputs.mvpInitialServerCost },
  ].filter(item => item.value > 0), [mvpCosts.founderMvpCostTotal, mvpCosts.specialistMvpCost, inputs.mvpTgVersionCost, inputs.mvpSoftwareContingencyCost, inputs.mvpInitialServerCost]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 md:p-8 font-[sans-serif]">
      <header className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-sky-700">Интерактивная финансовая модель стартапа v2.6</h1>
        <p className="text-slate-600 mt-2 text-sm sm:text-base">Детализированное моделирование финансов и роста SaaS-проекта с разными источниками дохода и вариативностью.</p>
      </header>

      <main className="container mx-auto max-w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <section className="lg:col-span-4 bg-white p-6 rounded-xl shadow-lg h-fit sticky top-8">
            <InputSection inputs={inputs} onInputChange={handleInputChange} />
          </section>

          <section className="lg:col-span-8 space-y-6 lg:space-y-8">
            <SummaryResults metrics={calculatedMetrics} projectionYears={PROJECTION_MONTHS / 12} />
            
            <div className="bg-white p-6 rounded-xl shadow-lg">
               <h2 className="text-xl font-semibold text-sky-600 mb-4">Ключевые показатели эффективности (KPI)</h2>
              <KpiSection kpis={kpiMetrics} />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
               <h2 className="text-xl font-semibold text-sky-600 mb-4">Визуализация финансов и роста</h2>
              <ChartsSection 
                mvpCostPieData={mvpCostPieData} 
                financialHistory={projectionData.financialHistory}
                userGrowthHistory={projectionData.userGrowthHistory}
                projectionMonths={PROJECTION_MONTHS}
              />
            </div>
          </section>
        </div>
      </main>

      <footer className="text-center mt-12 py-4 text-sm text-slate-500 border-t border-slate-200">
        <p>&copy; {new Date().getFullYear()} Финансовый Моделировщик v2.6. Все права защищены.</p>
      </footer>
    </div>
  );
};

export default App;
