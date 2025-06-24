import { CalculationService } from './services/calcService';
import { HOUSE_TYPES, getHouseTypes, getTiersForType, getHouseCost } from './constants/houseTypes';
import { EXTRA_REVENUES } from './constants/extraRevenues';
import { Phase } from './models/Phase';
import { House, HouseType, HouseTier } from './models/House';
import { Scenario, TaxRegime } from './models/Scenario';

declare const Chart: any; // Говорим TypeScript, что Chart существует глобально
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

    typeSelect.addEventListener('change', () => {
        populateTierOptions(tierSelect, typeSelect.value as HouseType);
        updateHouseRowCost(row);
        updateTotalCapexUI();
    });
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
      cashFlowChart.destroy();
    }

    cashFlowChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Выручка',
            data: cashFlow.map(row => row.revenue),
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            order: 2
          },
          {
            label: 'OPEX',
            data: cashFlow.map(row => row.opex),
            backgroundColor: 'rgba(255, 159, 64, 0.6)',
            borderColor: 'rgba(255, 159, 64, 1)',
            order: 2
          },
          {
            label: 'CAPEX',
            data: cashFlow.map(row => row.capex),
            backgroundColor: 'rgba(153, 102, 255, 0.6)',
            borderColor: 'rgba(153, 102, 255, 1)',
            order: 2
          },
          {
            type: 'line',
            label: 'Чистый CF',
            data: cashFlow.map(row => row.netCf),
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            yAxisID: 'y',
            tension: 0.1,
            order: 1
          },
          {
            type: 'line',
            label: 'Накопленный CF',
            data: cashFlow.map(row => row.cumulativeCf),
            borderColor: 'rgba(255, 206, 86, 1)',
            backgroundColor: 'rgba(255, 206, 86, 0.5)',
            yAxisID: 'y1',
            borderDash: [5, 5],
            tension: 0.1,
            order: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            mode: 'index',
            intersect: false,
          },
        },
        scales: {
          x: {
            stacked: false,
          },
          y: {
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
            title: {
              display: true,
              text: 'Накопленный CF (млн ₽)'
            },
            grid: {
              drawOnChartArea: false,
            },
          }
        }
      }
    });
  }
};

function setupEventListeners() {
    const calcButton = document.querySelector('.btn-primary');
    if (calcButton) {
        calcButton.addEventListener('click', window.calculate);
    }

    const addHouseBtn = document.getElementById('add-house-btn');
    if (addHouseBtn) {
        addHouseBtn.addEventListener('click', () => {
            const houseList = document.getElementById('house-list');
            const templateRow = houseList?.querySelector('.house-row');
            if (templateRow) {
                const newHouseRow = templateRow.cloneNode(true) as HTMLElement;
                (newHouseRow.querySelector('[data-type="house-qty"]') as HTMLInputElement).value = '1';
                initializeHouseRow(newHouseRow);
                houseList?.appendChild(newHouseRow);
                updateHouseRowCost(newHouseRow);
                updateTotalCapexUI();
            }
        });
    }

    // Event delegation for remove buttons and input changes
    const houseList = document.getElementById('house-list');
    if (houseList) {
        houseList.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;
            if (target && target.matches('[data-action="remove-house"]')) {
                const houseRow = target.closest('.house-row');
                if (houseRow && houseList.children.length > 1) {
                    houseRow.remove();
                    updateTotalCapexUI();
                }
            }
        });

        houseList.addEventListener('change', (event) => {
            const target = event.target as HTMLElement;
            if (target.matches('[data-type="house-tier"], [data-type="house-qty"]')) {
                const houseRow = target.closest('.house-row') as HTMLElement;
                if (houseRow) {
                    updateHouseRowCost(houseRow);
                    updateTotalCapexUI();
                }
            }
        })
    }

    // Trigger recalculation on extra revenue change
    const extraRevenueSection = document.getElementById('extra-revenue-section');
    if (extraRevenueSection) {
        extraRevenueSection.addEventListener('change', window.calculate);
    }

    // Trigger recalculation on any opex input change
    const opexInputs = [
        'opex-payroll', 'opex-marketing', 'opex-booking',
        'opex-consumables', 'opex-utilities', 'opex-cagr'
    ];
    opexInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', window.calculate);
        }
    });
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

// Автоматически запускать расчёт при загрузке
window.addEventListener('DOMContentLoaded', () => {
  populateExtraRevenues();
  document.querySelectorAll('.house-row').forEach(row => {
    initializeHouseRow(row as HTMLElement);
  });
  setupEventListeners();
  updateTotalCapexUI();
  window.calculate();
}); 