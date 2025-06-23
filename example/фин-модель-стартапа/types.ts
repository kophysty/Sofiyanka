export interface FinancialInputs {
  founderSalaryMonthly: number; // Used for MVP cost calculation
  founderCount: number;         // Used for MVP cost calculation
  mvpDevelopmentMonths: number; // Used for MVP cost calculation
  specialistRatePerHour: number;
  specialistHoursMVP: number;
  mvpTgVersionCost: number; 
  mvpSoftwareContingencyCost: number; 
  mvpInitialServerCost: number; 
  
  initialClientCount: number;
  baseDirectNewUsersMonthly: number; // Base for randomized inflow
  newUserInflowVariationPercentage: number; // e.g., 0.2 for +/- 20%
  monthlyChurnAbsolute: number; 

  baseMarketingSpendMonthly: number;
  marketingSpendAsProfitPercentage: number;

  ongoingFounderSalaryMonthlyTotal: number; 
  serverCostsMonthly: number; 
  supportHoursMonthly: number; 
  accountingCostsMonthly: number; // New accounting cost
  
  subscriptionPricePerUser: number; // Standard package price
  taxRate: number; 

  // New Monetization Inputs
  extendedPackagePrice: number;
  extendedPackageStartMonth: number; // Month number (1-24)
  percentageUsersConvertingToExtended: number; // e.g., 0.05 for 5% per month

  corporatePackageSetupFee: number;
  corporatePackageMonthlyFee: number;
  corporatePackageStartMonth: number; // Month number (1-24)
  newCorporateDealsPerMonth: number; // Can be fractional
}

export interface CalculatedMetrics {
  mvpCost: number;
  founderMvpCostTotal: number; 
  specialistMvpCost: number;
  finalMonthRevenue: number;
  finalMonthExpenses: number; 
  finalMonthProfit: number;
  finalMonthActiveUsers: number; // Total individual users (standard + extended)
  totalRevenueTwoYears: number;
  totalProfitTwoYears: number;
  totalNewUsersLastMonth: number; // Direct new individual users (can be average or last month's random value)
  finalMonthActiveCorporateContracts: number;
}

export interface KpiMetrics {
  operationalBreakevenMonth: number | string; // Changed from breakEvenClientsOperational
  paybackPeriodMonths: number | string;
}

export interface KpiSectionProps {
  kpis: KpiMetrics;
}

export interface NumberInputProps {
  label: string;
  id: keyof FinancialInputs;
  value: number;
  unit?: string;
  onChange: (id: keyof FinancialInputs, value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  fullWidth?: boolean;
  tooltip?: string;
}

export interface InputSectionProps {
  inputs: FinancialInputs;
  onInputChange: (id: keyof FinancialInputs, value: number) => void;
}

export interface SummaryCardProps {
    title: string;
    value: string;
    details?: { label: string; value: string }[];
    positive?: boolean;
    negative?: boolean;
}

export interface SummaryResultsProps {
  metrics: CalculatedMetrics;
  projectionYears: number;
}


export interface PieChartData {
  name: string;
  value: number;
}

export interface MonthlyFinancialDataPoint {
  month: number;
  revenue: number; // Total revenue
  revenueStandard: number;
  revenueExtended: number;
  revenueCorporateSetup: number;
  revenueCorporateMonthly: number;
  marketingExpenses: number;
  personnelExpenses: number; 
  serverExpenses: number;
  accountingExpenses: number; // Added for charting
  totalExpensesBeforeTax: number; 
  profitBeforeTax: number; 
  taxes: number;
  netProfit: number;
  accumulatedProfit: number;
}

export interface MonthlyUserGrowthDataPoint {
  month: number;
  activeUsers: number; // Total standard + extended
  standardUsersCount: number;
  extendedUsersCount: number;
  newDirectUsers: number; 
  churnedUsers: number; 
  activeCorporateContracts: number;
}

export interface ChartsSectionProps {
  mvpCostPieData: PieChartData[];
  financialHistory: MonthlyFinancialDataPoint[];
  userGrowthHistory: MonthlyUserGrowthDataPoint[];
  projectionMonths: number;
}

export interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}