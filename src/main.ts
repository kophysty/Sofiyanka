import { CalculationService } from './services/calcService';
import { StorageService } from './services/storageService';
import { HOUSE_TYPES, getHouseTypes, getTiersForType, getHouseCost } from './constants/houseTypes';
import { EXTRA_REVENUES } from './constants/extraRevenues';
import { SEASONALITY_FACTORS, MONTH_NAMES, MONTH_KEYS, MonthlyFactor } from './constants/seasonality';
import { Phase } from './models/Phase';
import { House, HouseType, HouseTier } from './models/House';
import { Scenario, TaxRegime, ScenarioParams } from './models/Scenario';

declare const Chart: any; // Говорим TypeScript, что Chart существует глобально
declare const bootstrap: any; // Говорим TypeScript, что bootstrap существует глобально
let cashFlowChart: any = null; // Переменная для хранения экземпляра графика

declare global {
  interface Window {
    calculate: () => void;
  }
}

// Helper: get value from input by id
function getInputNumber(id: string, fallback: number): number {
  const el = document.getElementById(id) as HTMLInputElement | null;
  if (!el) return fallback;
  const val = parseFloat(el.value);
  return isNaN(val) ? fallback : val;
}

// Helper: get string from select by id
function getInputString(id: string, fallback: string): string {
    const el = document.getElementById(id) as HTMLSelectElement | null;
    return el ? el.value : fallback;
}

// Helper: set value to an input/select
function setInputValue(id: string, value: string | number) {
    const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement;
    if (el) {
        el.value = String(value);
    }
}

// Helper: read all enabled extra revenue services from UI
function getExtraRevenuesFromUI(): string[] {
    const services: string[] = [];
    document.querySelectorAll('[data-extra-revenue]').forEach(el => {
        const checkbox = el as HTMLInputElement;
        if (checkbox.checked) {
            services.push(checkbox.dataset.extraRevenue as string);
        }
    });
    return services;
}

function setExtraRevenuesInUI(services: string[]) {
    document.querySelectorAll('[data-extra-revenue]').forEach(el => {
        const checkbox = el as HTMLInputElement;
        const serviceName = checkbox.dataset.extraRevenue as string;
        checkbox.checked = services.includes(serviceName);
    });
}

// Helper: read all configured houses from the UI
function getHousesFromUI(): House[] {
    const houseRows = document.querySelectorAll('#house-list .house-row');
    const houses: House[] = [];
    houseRows.forEach((row, index) => {
        const type = (row.querySelector('[data-type="house-type"]') as HTMLSelectElement).value as HouseType;
        const tier = (row.querySelector('[data-type="house-tier"]') as HTMLSelectElement).value as HouseTier;
        const qty = parseInt((row.querySelector('[data-type="house-qty"]') as HTMLInputElement).value, 10) || 0;
        if (qty > 0) {
            houses.push(new House(`h${index}`, type, tier, qty));
        }
    });
    return houses;
}

function setHousesInUI(houses: House[]) {
    const houseList = document.getElementById('house-list') as HTMLElement;
    const addHouseBtn = document.getElementById('add-house-btn') as HTMLElement;
    houseList.innerHTML = ''; // Clear existing rows

    if (houses.length === 0) return;

    houses.forEach(house => {
        const newRow = createHouseRowElement();
        (newRow.querySelector('[data-type="house-type"]') as HTMLSelectElement).value = house.type;
        // Need to trigger population of tiers before setting value
        populateTierOptions(newRow.querySelector('[data-type="house-tier"]') as HTMLSelectElement, house.type);
        (newRow.querySelector('[data-type="house-tier"]') as HTMLSelectElement).value = house.tier;
        (newRow.querySelector('[data-type="house-qty"]') as HTMLInputElement).value = String(house.qty);
        
        houseList.appendChild(newRow);
        initializeHouseRow(newRow); // Make sure new row is interactive
        updateHouseRowCost(newRow);
    });
    updateTotalCapexUI();
    updateTotalOpexUI();
}

function updateHouseRowCost(row: HTMLElement) {
    const type = (row.querySelector('[data-type="house-type"]') as HTMLSelectElement).value as HouseType;
    const tier = (row.querySelector('[data-type="house-tier"]') as HTMLSelectElement).value as HouseTier;
    const qty = parseInt((row.querySelector('[data-type="house-qty"]') as HTMLInputElement).value, 10) || 0;
    
    const costPerUnit = HOUSE_TYPES[type]?.[tier]?.cost || 0;
    const totalCost = costPerUnit * qty;

    const costEl = row.querySelector('.input-group-text') as HTMLElement;
    if (costEl) {
        costEl.textContent = `${totalCost.toFixed(2)} ₽`;
    }
}

function populateHouseTypeOptions(select: HTMLSelectElement) {
  const houseTypes = getHouseTypes();
  select.innerHTML = '';
  houseTypes.forEach(type => {
    const option = document.createElement('option');
    option.value = type;
    option.textContent = type;
    select.appendChild(option);
  });
}

function populateTierOptions(select: HTMLSelectElement, houseType: HouseType) {
  const tiers = getTiersForType(houseType);
  select.innerHTML = '';
  tiers.forEach(tier => {
    const cost = getHouseCost(houseType, tier);
    const option = document.createElement('option');
    option.value = tier;
    option.textContent = `${tier} (${cost} млн ₽)`;
    select.appendChild(option);
  });
}

function initializeHouseRow(row: HTMLElement) {
    const typeSelect = row.querySelector('[data-type="house-type"]') as HTMLSelectElement;
    const tierSelect = row.querySelector('[data-type="house-tier"]') as HTMLSelectElement;

    // Capture initial values from the pre-filled HTML
    const initialType = typeSelect.value as HouseType;
    const initialTier = tierSelect.value as HouseTier;

    // Populate the dropdowns with all options
    populateHouseTypeOptions(typeSelect);
    // Set the house type back to its initial value
    typeSelect.value = initialType;

    // Populate tiers based on the correct initial house type
    populateTierOptions(tierSelect, initialType);
    // Set the tier back to its initial value
    tierSelect.value = initialTier;

    // Attach event listeners to this row's inputs
    row.querySelectorAll('select, input').forEach(el => {
        el.addEventListener('change', () => {
            // If the house type is changed, we need to re-populate the tier options
            if (el === typeSelect) {
                populateTierOptions(tierSelect, typeSelect.value as HouseType);
            }
            updateHouseRowCost(row);
            updateTotalCapexUI();
            updateTotalOpexUI();
            window.calculate(); // Recalculate everything
        });
    });

    const removeBtn = row.querySelector('[data-action="remove-house"]');
    if(removeBtn) {
        removeBtn.addEventListener('click', () => {
            // Prevent removing the last row
            if (row.parentElement?.children.length && row.parentElement.children.length > 1) {
                row.remove();
                updateTotalCapexUI();
                updateTotalOpexUI();
                window.calculate(); // Recalculate after removing a row
            }
        });
    }
}

function updateTotalCapexUI() {
    const houses = getHousesFromUI();
    const phase1 = new Phase('phase1', 'Phase 1', new Date(), houses);

    const houseCapex = phase1.getTotalCapex(HOUSE_TYPES);
    (document.getElementById('residential-fund-total') as HTMLInputElement).value = houseCapex.toFixed(2);
    (document.getElementById('house-list-total') as HTMLInputElement).value = houseCapex.toFixed(2);

    updateExtraRevenueDetailsUI();

    const otherCapex = getInputNumber('public-buildings', 0) + getInputNumber('sport-spa', 0) +
                       getInputNumber('engineering', 0) + getInputNumber('it-smart', 0) +
                       getInputNumber('landscaping', 0) + getInputNumber('furniture', 0) +
                       getInputNumber('other', 0);

    const totalCapex = houseCapex + otherCapex;
    const reserve = totalCapex * 0.1;
    const totalInvestment = totalCapex + reserve;

    (document.getElementById('reserve') as HTMLInputElement).value = reserve.toFixed(2);
    (document.getElementById('total-capex') as HTMLInputElement).value = totalInvestment.toFixed(2);
    (document.getElementById('total-investment') as HTMLElement).textContent = totalInvestment.toFixed(1);
}

function updateExtraRevenueDetailsUI() {
    const totalUnits = getHousesFromUI().reduce((sum, house) => sum + house.qty, 0);
    const scalingFactor = totalUnits / 10;

    Object.keys(EXTRA_REVENUES).forEach(serviceId => {
        const detailsEl = document.getElementById(`extra-details-${serviceId}`);
        const config = EXTRA_REVENUES[serviceId];
        if (detailsEl && config) {
            const annualRevenue = config.annualRevenue * scalingFactor;
            const annualProfit = annualRevenue * config.margin;
            detailsEl.textContent = `(Выручка: ${(annualRevenue / 1_000_000).toFixed(1)} млн, Прибыль: ${(annualProfit / 1_000_000).toFixed(1)} млн)`;
        }
    });
}

function updateTotalOpexUI() {
    const totalUnits = getHousesFromUI().reduce((sum, house) => sum + house.qty, 0);
    const scalingFactor = totalUnits > 0 ? totalUnits / 10 : 1; // Base is 10 houses

    const payroll = getInputNumber('opex-payroll', 0);
    const marketing = getInputNumber('opex-marketing', 0);
    const utilities = getInputNumber('opex-utilities', 0) * 12; // monthly to annual

    // These are the "fixed" costs that scale with the project size
    const baseFixedOpex = payroll + marketing + utilities;
    const scaledFixedOpex = baseFixedOpex * scalingFactor;

    // The variable part (booking, consumables) is not included here as it depends on revenue.
    // This UI total only reflects the scalable fixed costs.
    const totalAnnualOpex = scaledFixedOpex; 

    const totalOpexInput = document.getElementById('opex-total-annual') as HTMLInputElement;
    if (totalOpexInput) {
        totalOpexInput.value = `${(totalAnnualOpex / 1_000_000).toFixed(2)} млн ₽`;
    }

    const tooltipIcon = document.querySelector('[data-bs-toggle="tooltip"]');
    if (tooltipIcon) {
        const tooltipText = `Базовые годовые затраты (ФОТ, маркетинг, комм. услуги) для 10 домов: ${(baseFixedOpex / 1_000_000).toFixed(2)} млн.
Масштабирующий коэф-т (${totalUnits} домов / 10): ${scalingFactor.toFixed(2)}.
Итого: ${(scaledFixedOpex / 1_000_000).toFixed(2)} млн.
(Переменные затраты, такие как комиссия с бронирований и расходники, здесь не учтены).`;
        const tooltip = bootstrap.Tooltip.getInstance(tooltipIcon);
        if (tooltip) {
            tooltip.setContent({ '.tooltip-inner': tooltipText });
        }
    }
}

function getSeasonalityFactorsFromUI(): Record<string, MonthlyFactor> {
    const factors: Record<string, MonthlyFactor> = {};
    MONTH_KEYS.forEach((monthKey, index) => {
        const occupancySlider = document.querySelector(`#seasonality-sliders [data-month-key="${monthKey}"][data-factor-type="occupancy"]`) as HTMLInputElement;
        const adrSlider = document.querySelector(`#seasonality-sliders [data-month-key="${monthKey}"][data-factor-type="adr"]`) as HTMLInputElement;
        
        if (occupancySlider && adrSlider) {
            factors[monthKey] = {
                occupancy: parseFloat(occupancySlider.value),
                adr: parseFloat(adrSlider.value)
            };
        }
    });
    return factors;
}

function setSeasonalityFactorsInUI(factors: Record<string, MonthlyFactor>) {
    Object.keys(factors).forEach(monthKey => {
        const occupancySlider = document.querySelector(`#seasonality-sliders [data-month-key="${monthKey}"][data-factor-type="occupancy"]`) as HTMLInputElement;
        const adrSlider = document.querySelector(`#seasonality-sliders [data-month-key="${monthKey}"][data-factor-type="adr"]`) as HTMLInputElement;

        if (occupancySlider) occupancySlider.value = String(factors[monthKey].occupancy);
        if (adrSlider) adrSlider.value = String(factors[monthKey].adr);

        // Update slider labels
        const occupancyLabel = document.getElementById(`occupancy-value-${monthKey}`);
        const adrLabel = document.getElementById(`adr-value-${monthKey}`);
        if (occupancyLabel) occupancyLabel.textContent = String(factors[monthKey].occupancy);
        if (adrLabel) adrLabel.textContent = String(factors[monthKey].adr);
    });
}

/**
 * Gathers all parameters from the UI into a single object.
 */
function collectParamsFromUI(): ScenarioParams {
    return {
        // Capex
        publicBuildings: getInputNumber('public-buildings', 0),
        sportSpa: getInputNumber('sport-spa', 0),
        engineering: getInputNumber('engineering', 0),
        itSmart: getInputNumber('it-smart', 0),
        landscaping: getInputNumber('landscaping', 0),
        furniture: getInputNumber('furniture', 0),
        other: getInputNumber('other', 0),
        // Ops
        occupancy: getInputNumber('occupancy-rate', 0),
        adr: getInputNumber('adr', 0),
        adrCAGR: getInputNumber('adr-cagr', 0),
        opexStructure: {
            payroll: getInputNumber('opex-payroll', 0),
            marketing: getInputNumber('opex-marketing', 0),
            booking: getInputNumber('opex-booking', 0),
            consumables: getInputNumber('opex-consumables', 0),
            utilities: getInputNumber('opex-utilities', 0)
        },
        opexCAGR: getInputNumber('opex-cagr', 0),
        taxRegime: getInputString('tax-regime', 'USN6') as TaxRegime,
        // Houses
        houses: getHousesFromUI().map(h => ({ type: h.type, tier: h.tier, qty: h.qty })),
        // Extra Revenues
        extraRevenueServices: getExtraRevenuesFromUI(),
        // Seasonality
        seasonality: getSeasonalityFactorsFromUI()
    };
}

/**
 * Applies a scenario's parameters to the entire UI.
 * @param params The scenario parameters object.
 */
function applyParamsToUI(params: ScenarioParams) {
    // Capex
    setInputValue('public-buildings', params.publicBuildings);
    setInputValue('sport-spa', params.sportSpa);
    setInputValue('engineering', params.engineering);
    setInputValue('it-smart', params.itSmart);
    setInputValue('landscaping', params.landscaping);
    setInputValue('furniture', params.furniture);
    setInputValue('other', params.other);
    // Ops
    setInputValue('occupancy-rate', params.occupancy);
    setInputValue('adr', params.adr);
    setInputValue('adr-cagr', params.adrCAGR);
    setInputValue('opex-payroll', params.opexStructure.payroll);
    setInputValue('opex-marketing', params.opexStructure.marketing);
    setInputValue('opex-booking', params.opexStructure.booking);
    setInputValue('opex-consumables', params.opexStructure.consumables);
    setInputValue('opex-utilities', params.opexStructure.utilities);
    setInputValue('opex-cagr', params.opexCAGR);
    setInputValue('tax-regime', params.taxRegime);
    // Houses
    const houses = params.houses.map((h: { type: HouseType; tier: HouseTier; qty: number; }, i: number) => new House(`h${i}`, h.type, h.tier, h.qty));
    setHousesInUI(houses);
    // Extra Revenues
    setExtraRevenuesInUI(params.extraRevenueServices);
    // Seasonality
    setSeasonalityFactorsInUI(params.seasonality);

    // Recalculate totals and chart after loading
    updateTotalCapexUI();
    updateTotalOpexUI();
    window.calculate();
}

// Main calculation function
window.calculate = function calculate() {
  // 1. Read parameters from form
  const params = {
    publicBuildings: getInputNumber('public-buildings', 5.35),
    sportSpa: getInputNumber('sport-spa', 3.0),
    engineering: getInputNumber('engineering', 4.95),
    itSmart: getInputNumber('it-smart', 0.9),
    landscaping: getInputNumber('landscaping', 4.0),
    furniture: getInputNumber('furniture', 1.2),
    other: getInputNumber('other', 0.5),
    occupancy: getInputNumber('occupancy-rate', 55),
    adr: getInputNumber('adr', 9400),
    adrCAGR: getInputNumber('adr-cagr', 3.0),
    opexStructure: {
      payroll: getInputNumber('opex-payroll', 3500000),
      marketing: getInputNumber('opex-marketing', 1200000),
      booking: getInputNumber('opex-booking', 5) / 100, // Convert to ratio
      consumables: getInputNumber('opex-consumables', 500),
      utilities: getInputNumber('opex-utilities', 250000) * 12 // Convert to annual
    },
    opexCAGR: getInputNumber('opex-cagr', 6.0),
    taxRegime: getInputString('tax-regime', 'USN6') as TaxRegime
  };

  // 2. Get houses from UI and create a phase
  const houses = getHousesFromUI();
  const phase1 = new Phase('phase1', 'Phase 1', new Date('2025-01-01'), houses);

  // 3. Calculate CAPEX
  const houseCapex = phase1.getTotalCapex(HOUSE_TYPES);
  const otherCapex = params.publicBuildings + params.sportSpa + params.engineering + 
                     params.itSmart + params.landscaping + params.furniture + params.other;
  const totalCapex = houseCapex + otherCapex;

  // 4. Update reserve and total CAPEX fields
  const reserve = totalCapex * 0.1;
  (document.getElementById('reserve') as HTMLInputElement).value = reserve.toFixed(2);
  (document.getElementById('total-capex') as HTMLInputElement).value = totalCapex.toFixed(2);

  // 5. Create Scenario
  const scenario = new Scenario('ui', 'UI Scenario', {
    occupancy: params.occupancy,
    adr: params.adr,
    adrCAGR: params.adrCAGR,
    opexStructure: params.opexStructure,
    opexCAGR: params.opexCAGR,
    taxRegime: params.taxRegime,
    extraRevenueServices: getExtraRevenuesFromUI(),
    seasonality: getSeasonalityFactorsFromUI()
  });
  scenario.addPhase(phase1);
  // HACK: Manually populate scenario.houses for legacy getTotalUnits() to work
  phase1.houses.forEach(h => scenario.addHouse(h));

  // 6. Расчёт
  const timeline = CalculationService.buildPhaseTimeline(scenario, totalCapex);
  const cashFlow = CalculationService.calculateCashFlow(scenario, timeline);
  
  const totalInvestment = totalCapex * 1.1; // Add 10% reserve
  const kpis = CalculationService.deriveKPIs(cashFlow, totalInvestment);

  // 7. Обновить KPI в DOM
  (document.getElementById('total-investment') as HTMLElement).textContent = totalInvestment.toFixed(1);
  (document.getElementById('payback-period') as HTMLElement).textContent = kpis.paybackPeriod?.toFixed(1) ?? '-';
  
  const year5Revenue = cashFlow
    .filter(cf => cf.year === 2029)
    .reduce((sum, p) => sum + p.revenue, 0);
  (document.getElementById('annual-revenue') as HTMLElement).textContent = year5Revenue.toFixed(1);

  // 8. Обновить таблицу
  const tbody = document.getElementById('projections-body');
  if (tbody) {
    tbody.innerHTML = '';
    const phaseBoundaries = [1, 5, 9]; // Indexes before which to insert a separator: before 2026 H1, 2028 H1, 2029 H1
    const phaseNames = ['Фаза I. Старт (2025-2026)', 'Фаза II. Разгон (2027-2028)', 'Фаза III. Флагман (2029-2033)'];
    let phaseIdx = 0;

    cashFlow.forEach((row, index) => {
      if (phaseBoundaries.includes(index)) {
        const phaseRow = document.createElement('tr');
        phaseRow.className = 'table-primary phase-separator';
        phaseRow.innerHTML = `<td colspan="7" class="text-center fw-bold">${phaseNames[phaseIdx]}</td>`;
        tbody.appendChild(phaseRow);
        phaseIdx++;
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.period}</td>
        <td>${row.revenue.toFixed(2)}</td>
        <td>${row.opex.toFixed(2)}</td>
        <td>${row.capex.toFixed(2)}</td>
        <td>${row.tax.toFixed(2)}</td>
        <td>${row.netCf.toFixed(2)}</td>
        <td>${row.cumulativeCf.toFixed(2)}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // 9. Обновить/создать график
  const ctx = (document.getElementById('cashFlowChart') as HTMLCanvasElement)?.getContext('2d');
  if (ctx) {
    const labels = cashFlow.map(row => row.period);
    
    if (cashFlowChart) {
      cashFlowChart.data.labels = labels;
      cashFlowChart.data.datasets[0].data = cashFlow.map(row => row.revenue);
      cashFlowChart.data.datasets[1].data = cashFlow.map(row => row.opex);
      cashFlowChart.data.datasets[2].data = cashFlow.map(row => row.capex);
      cashFlowChart.data.datasets[3].data = cashFlow.map(row => row.netCf);
      cashFlowChart.data.datasets[4].data = cashFlow.map(row => row.cumulativeCf);
      cashFlowChart.update();
    } else {
      cashFlowChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Выручка',
              data: cashFlow.map(row => row.revenue),
              backgroundColor: 'rgba(75, 192, 192, 0.6)', // Teal
              order: 2
            },
            {
              label: 'OPEX',
              data: cashFlow.map(row => row.opex),
              backgroundColor: 'rgba(255, 159, 64, 0.6)', // Orange
              order: 2
            },
            {
              label: 'CAPEX',
              data: cashFlow.map(row => row.capex),
              backgroundColor: 'rgba(153, 102, 255, 0.6)', // Purple
              order: 2
            },
             {
              label: 'Чистый CF',
              data: cashFlow.map(row => row.netCf),
              type: 'line',
              borderColor: 'rgba(54, 162, 235, 1)', // Blue
              backgroundColor: 'rgba(54, 162, 235, 0.5)',
              tension: 0.1,
              pointRadius: 3,
              order: 1,
              yAxisID: 'y'
            },
            {
              label: 'Накопленный CF',
              data: cashFlow.map(row => row.cumulativeCf),
              type: 'line',
              borderColor: 'rgb(255, 205, 86)', // Yellow
              backgroundColor: 'rgba(255, 205, 86, 0.5)',
              pointRadius: 5,
              pointHoverRadius: 8,
              tension: 0.1,
              fill: false,
              order: 1,
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          animation: {
            duration: 1000,
          },
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false,
          },
          scales: {
            x: {
              stacked: false, // Bars will be grouped
            },
            y: {
              stacked: false, // Bars will be grouped
              type: 'linear',
              display: true,
              position: 'left',
              title: {
                display: true,
                text: 'Денежный поток (млн ₽)'
              }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              grid: {
                drawOnChartArea: false, // only draw grid for y axis
              },
              title: {
                display: true,
                text: 'Накопленный CF (млн ₽)'
              }
            }
          },
          plugins: {
            legend: {
              onClick: (e: any, legendItem: any, legend: any) => {
                const index = legendItem.datasetIndex;
                const ci = legend.chart;
                const meta = ci.getDatasetMeta(index);
                
                // Default behavior for toggling visibility
                meta.hidden = meta.hidden === null ? !ci.data.datasets[index].hidden : null;
                
                ci.update();
              }
            },
            tooltip: {
              callbacks: {
                label: function(context: any) {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  if (context.parsed.y !== null) {
                    const value = context.raw as number;
                    label += `${value.toFixed(2)} млн ₽`;
                  }
                  return label;
                }
              }
            }
          }
        }
      });
    }
  }
};

function createHouseRowElement(): HTMLElement {
    const houseRow = document.createElement('div');
    houseRow.className = 'house-row input-group mb-2';
    // Final assembly
    houseRow.innerHTML = `
        <select class="form-select" data-type="house-type"></select>
        <select class="form-select" data-type="house-tier"></select>
        <input type="number" class="form-control" data-type="house-qty" value="1" min="1" style="flex-grow: 0.5;">
        <span class="input-group-text" style="width: 80px;">0.00 ₽</span>
        <button class="btn btn-outline-danger" type="button" data-action="remove-house">X</button>
    `;
    return houseRow;
}

/**
 * Populates the scenario dropdown with saved scenarios from StorageService.
 */
function updateScenarioDropdown() {
    const select = document.getElementById('scenario-select') as HTMLSelectElement;
    const scenarios = StorageService.listScenarios();
    select.innerHTML = '<option selected disabled>Выберите сценарий...</option>';
    scenarios.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
    });
}

function setupEventListeners() {
    // Main calculate button
    const calcButton = document.querySelector('.btn.btn-primary');
    calcButton?.addEventListener('click', window.calculate);

    // Add house button
    document.getElementById('add-house-btn')?.addEventListener('click', () => {
        const list = document.getElementById('house-list');
        const firstRow = list?.querySelector('.house-row');
        if (list && firstRow) {
            const newRow = firstRow.cloneNode(true) as HTMLElement;
            // Reset quantity for the new row
            const qtyInput = newRow.querySelector('[data-type="house-qty"]') as HTMLInputElement;
            if (qtyInput) qtyInput.value = '1';

            list.appendChild(newRow);
            initializeHouseRow(newRow); // Attach listeners to the new row
            updateHouseRowCost(newRow);
            updateTotalCapexUI();
            updateTotalOpexUI();
        }
    });

    // Inputs that should trigger a full recalculation
    const fullRecalcInputs = [
        'occupancy-rate', 'adr', 'adr-cagr', 'opex-cagr', 'tax-regime',
        'opex-booking', 'opex-consumables'
    ];
    fullRecalcInputs.forEach(id => {
        document.getElementById(id)?.addEventListener('input', window.calculate);
    });

    // Inputs that only update the CAPEX display without a full recalculation
    const capexInputs = ['public-buildings', 'sport-spa', 'engineering', 'it-smart', 'landscaping', 'furniture', 'other'];
    capexInputs.forEach(id => {
        document.getElementById(id)?.addEventListener('input', updateTotalCapexUI);
    });

    // Inputs that only update the OPEX display without a full recalculation
    const opexInputs = ['opex-payroll', 'opex-marketing', 'opex-utilities'];
    opexInputs.forEach(id => {
        document.getElementById(id)?.addEventListener('input', () => {
            updateTotalOpexUI();
            // Also trigger full recalc as it affects cash flow
            window.calculate();
        });
    });

    // Listeners for extra revenues (triggers full recalc)
    document.getElementById('extra-revenue-section')?.addEventListener('change', window.calculate);
    
    // Listeners for seasonality sliders
    document.getElementById('seasonality-sliders')?.addEventListener('input', window.calculate);

    // Event listeners for scenario management
    const saveBtn = document.getElementById('save-scenario-btn');
    const loadBtn = document.getElementById('load-scenario-btn');
    const deleteBtn = document.getElementById('delete-scenario-btn');
    const scenarioSelect = document.getElementById('scenario-select') as HTMLSelectElement;
    const exportBtn = document.getElementById('export-scenario-btn');
    const importBtn = document.getElementById('import-scenario-btn');
    const importInput = document.getElementById('import-scenario-input') as HTMLInputElement;

    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const name = prompt('Введите имя для сохранения сценария:');
            if (name) {
                try {
                    const params = collectParamsFromUI();
                    StorageService.saveScenario(name, params);
                    updateScenarioDropdown();
                    alert(`Сценарий "${name}" успешно сохранен!`);
                    scenarioSelect.value = name;
                } catch (e) {
                    console.error('Failed to save scenario:', e);
                    alert('Ошибка при сохранении сценария. См. консоль для деталей.');
                }
            }
        });
    }

    if (loadBtn) {
        loadBtn.addEventListener('click', () => {
            const name = scenarioSelect.value;
            if (name && scenarioSelect.selectedIndex > 0) { // Ensure it's not the placeholder
                const params = StorageService.loadScenario(name);
                if (params) {
                    applyParamsToUI(params);
                    alert(`Сценарий "${name}" загружен.`);
                } else {
                    alert('Не удалось загрузить сценарий.');
                }
            } else {
                alert('Пожалуйста, выберите сценарий для загрузки.');
            }
        });
    }

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const name = scenarioSelect.value;
            if (name && scenarioSelect.selectedIndex > 0) {
                const params = StorageService.loadScenario(name);
                if (params) {
                    StorageService.exportScenarioToFile(name, params);
                } else {
                    alert('Не удалось найти данные для экспорта.');
                }
            } else {
                alert('Пожалуйста, выберите сценарий для экспорта.');
            }
        });
    }

    if (importBtn && importInput) {
        importBtn.addEventListener('click', () => {
            importInput.click(); // Open file dialog
        });

        importInput.addEventListener('change', async () => {
            if (importInput.files && importInput.files.length > 0) {
                const file = importInput.files[0];
                try {
                    const { name, params } = await StorageService.importScenarioFromFile(file);
                    
                    // Check if a scenario with this name already exists
                    const existingScenarios = StorageService.listScenarios();
                    let scenarioName = name;
                    if (existingScenarios.includes(name)) {
                        if (!confirm(`Сценарий с именем "${name}" уже существует. Перезаписать его?`)) {
                            // Reset file input to allow re-selection of the same file
                            importInput.value = '';
                            return;
                        }
                    }
                    
                    StorageService.saveScenario(scenarioName, params);
                    updateScenarioDropdown();
                    scenarioSelect.value = scenarioName; // Select the newly imported scenario
                    applyParamsToUI(params); // Load the new scenario into the UI
                    alert(`Сценарий "${scenarioName}" успешно импортирован и загружен!`);

                } catch (error) {
                    console.error('Import failed:', error);
                    alert('Ошибка при импорте файла. Убедитесь, что это корректный файл сценария. Детали в консоли.');
                } finally {
                    // Reset file input to allow re-selection of the same file if needed
                    importInput.value = '';
                }
            }
        });
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            const name = scenarioSelect.value;
            if (name && scenarioSelect.selectedIndex > 0) {
                if (confirm(`Вы уверены, что хотите удалить сценарий "${name}"?`)) {
                    StorageService.deleteScenario(name);
                    updateScenarioDropdown();
                    alert(`Сценарий "${name}" удален.`);
                }
            } else {
                alert('Пожалуйста, выберите сценарий для удаления.');
            }
        });
    }
}

function populateExtraRevenues() {
    const section = document.getElementById('extra-revenue-section');
    if (!section) return;

    section.innerHTML = ''; // Clear existing
    Object.keys(EXTRA_REVENUES).forEach(serviceId => {
        const config = EXTRA_REVENUES[serviceId];
        const wrapper = document.createElement('div');
        wrapper.className = 'form-check form-switch mb-2';

        const input = document.createElement('input');
        input.className = 'form-check-input';
        input.type = 'checkbox';
        input.role = 'switch';
        input.id = `extra-${serviceId}`;
        input.dataset.extraRevenue = serviceId;

        const label = document.createElement('label');
        label.className = 'form-check-label';
        label.htmlFor = input.id;
        label.textContent = config.name;

        const details = document.createElement('span');
        details.className = 'form-text text-muted ms-2';
        details.id = `extra-details-${serviceId}`;
        details.textContent = '(расчет...)';

        wrapper.appendChild(input);
        wrapper.appendChild(label);
        wrapper.appendChild(details);
        section.appendChild(wrapper);
    });
}

function populateSeasonalitySliders() {
    const container = document.getElementById('seasonality-sliders');
    if (!container) return;

    container.innerHTML = '';
    MONTH_NAMES.forEach((name, index) => {
        const monthKey = MONTH_KEYS[index];
        const initialFactors = SEASONALITY_FACTORS[monthKey] || { occupancy: 1.0, adr: 1.0 };

        const wrapper = document.createElement('div');
        wrapper.className = 'mb-3 border-bottom pb-2';

        const monthLabel = document.createElement('h6');
        monthLabel.textContent = name;
        wrapper.appendChild(monthLabel);
        
        // Occupancy Slider
        const occWrapper = document.createElement('div');
        const occLabel = document.createElement('label');
        occLabel.className = 'form-label small';
        occLabel.textContent = `Загрузка: `;
        const occValueSpan = document.createElement('span');
        occValueSpan.textContent = initialFactors.occupancy.toFixed(2);
        occLabel.appendChild(occValueSpan);
        
        const occSlider = document.createElement('input');
        occSlider.type = 'range';
        occSlider.className = 'form-range range-slider';
        occSlider.min = '0.5';
        occSlider.max = '2.0';
        occSlider.step = '0.05';
        occSlider.value = String(initialFactors.occupancy);
        occSlider.setAttribute('data-month-key', monthKey);
        occSlider.setAttribute('data-factor-type', 'occupancy');
        occSlider.addEventListener('input', () => { occValueSpan.textContent = parseFloat(occSlider.value).toFixed(2); });

        occWrapper.appendChild(occLabel);
        occWrapper.appendChild(occSlider);
        wrapper.appendChild(occWrapper);

        // ADR Slider
        const adrWrapper = document.createElement('div');
        const adrLabel = document.createElement('label');
        adrLabel.className = 'form-label small';
        adrLabel.textContent = `Цена (ADR): `;
        const adrValueSpan = document.createElement('span');
        adrValueSpan.textContent = initialFactors.adr.toFixed(2);
        adrLabel.appendChild(adrValueSpan);

        const adrSlider = document.createElement('input');
        adrSlider.type = 'range';
        adrSlider.className = 'form-range range-slider';
        adrSlider.min = '0.8';
        adrSlider.max = '2.5';
        adrSlider.step = '0.05';
        adrSlider.value = String(initialFactors.adr);
        adrSlider.setAttribute('data-month-key', monthKey);
        adrSlider.setAttribute('data-factor-type', 'adr');
        adrSlider.addEventListener('input', () => { adrValueSpan.textContent = parseFloat(adrSlider.value).toFixed(2); });
        
        adrWrapper.appendChild(adrLabel);
        adrWrapper.appendChild(adrSlider);
        wrapper.appendChild(adrWrapper);

        container.appendChild(wrapper);
    });
}

function initializePage() {
    // Enable tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Initial calculation and chart drawing
    populateExtraRevenues();
    populateSeasonalitySliders();
    document.querySelectorAll('#house-list .house-row').forEach(row => initializeHouseRow(row as HTMLElement));
    updateTotalCapexUI();
    updateTotalOpexUI();
    setupEventListeners();
    updateScenarioDropdown(); // Populate scenarios on load

    // Run calculation once on load
    window.calculate();
}

// Ensure bootstrap tooltips are initialized
document.addEventListener('DOMContentLoaded', () => {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    })

    initializePage();
}); 