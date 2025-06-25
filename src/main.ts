import { CalculationService } from './services/calcService';
import { HOUSE_TYPES, getHouseTypes, getTiersForType, getHouseCost } from './constants/houseTypes';
import { EXTRA_REVENUES } from './constants/extraRevenues';
import { Phase } from './models/Phase';
import { House, HouseType, HouseTier } from './models/House';
import { Scenario, TaxRegime } from './models/Scenario';

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

    populateHouseTypeOptions(typeSelect);
    populateTierOptions(tierSelect, typeSelect.value as HouseType);

    // Attach event listeners to this row's inputs
    row.querySelectorAll('select, input').forEach(el => {
        el.addEventListener('change', () => {
            updateHouseRowCost(row);
            updateTotalCapexUI();
            updateTotalOpexUI();
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
    extraRevenueServices: getExtraRevenuesFromUI()
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
  (document.getElementById('annual-revenue') as HTMLElement).textContent = cashFlow.find(cf => cf.year === 2029)?.revenue?.toFixed(1) ?? '-';

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

function initializePage() {
    populateExtraRevenues();
    setupEventListeners();

    // Initial setup for existing house rows
    document.querySelectorAll('#house-list .house-row').forEach(row => {
        initializeHouseRow(row as HTMLElement);
        updateHouseRowCost(row as HTMLElement);
    });

    updateTotalCapexUI(); // Initial CAPEX calculation
    updateTotalOpexUI(); // Initial OPEX calculation
    window.calculate(); // Run initial calculation
}

// Ensure bootstrap tooltips are initialized
document.addEventListener('DOMContentLoaded', () => {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    })

    initializePage();
}); 