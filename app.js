// Financial Model for Sofiyanka Glamping Project

// DOM Elements
const form = document.getElementById('parameters-form');
const projectionsBody = document.getElementById('projections-body');

// Chart instance
let cashFlowChart;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Calculate on page load
    calculate();
    
    // Add event listeners for dynamic calculations
    const inputs = form.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        input.addEventListener('input', calculate);
    });
});

// Main calculation function
function calculate() {
    // Get input values with defaults
    const params = {
        // CAPEX
        residentialFund: parseFloat(document.getElementById('residential-fund').value) || 27.2,
        publicBuildings: parseFloat(document.getElementById('public-buildings').value) || 5.35,
        sportSpa: parseFloat(document.getElementById('sport-spa').value) || 3.0,
        engineering: parseFloat(document.getElementById('engineering').value) || 4.95,
        itSmart: parseFloat(document.getElementById('it-smart').value) || 0.9,
        landscaping: parseFloat(document.getElementById('landscaping').value) || 4.0,
        furniture: parseFloat(document.getElementById('furniture').value) || 1.2,
        other: parseFloat(document.getElementById('other').value) || 0.5,
        
        // Operational Parameters
        occupancyRate: parseFloat(document.getElementById('occupancy-rate').value) || 55,
        adr: parseFloat(document.getElementById('adr').value) || 9400,
        opexPercent: parseFloat(document.getElementById('opex-percent').value) || 50
    };
    
    // Calculate CAPEX
    const totalCapex = params.residentialFund + params.publicBuildings + params.sportSpa + 
                      params.engineering + params.itSmart + params.landscaping + 
                      params.furniture + params.other;
    
    const reserve = totalCapex * 0.1; // 10% reserve
    const totalInvestment = totalCapex + reserve;
    
    // Update reserve and total CAPEX fields
    document.getElementById('reserve').value = reserve.toFixed(2);
    document.getElementById('total-capex').value = totalInvestment.toFixed(2);
    
    // Generate cash flow projections
    const projections = generateProjections(totalInvestment, params);
    
    // Update the table
    updateProjectionsTable(projections);
    
    // Update the chart
    updateChart(projections);
    
    // Update KPI cards
    updateKPIs(projections, totalInvestment);
}

// Generate financial projections
function generateProjections(totalInvestment, params) {
    const projections = [];
    let cumulativeCf = 0;
    
    // Years to project (2025-2033 as per PRD)
    const startYear = 2025;
    const endYear = 2033;
    
    // Phasing details from PRD
    const phases = [
        { year: 2025, capex: 5.0, units: 0 },
        { year: 2026, capex: 20.0, units: 4 },
        { year: 2027, capex: 19.0, units: 9 },
        { year: 2028, capex: 8.0, units: 10 },
        { year: 2029, capex: 0, units: 10 },
        { year: 2030, capex: 0, units: 10 },
        { year: 2031, capex: 0, units: 10 },
        { year: 2032, capex: 0, units: 10 },
        { year: 2033, capex: 0, units: 10 }
    ];
    
    // Generate projections for each year
    for (let year = startYear; year <= endYear; year++) {
        const phase = phases[year - startYear] || { capex: 0, units: 10 };
        
        // Calculate annual revenue based on units, occupancy, and ADR
        const roomNights = phase.units * 365 * (params.occupancyRate / 100);
        let annualRevenue = roomNights * params.adr / 1000000; // In millions RUB
        
        // Apply growth in later years
        if (year > 2028) {
            annualRevenue *= Math.pow(1.03, year - 2028); // 3% growth after 2028
        }
        
        // Split into H1 and H2 from 2026 onwards
        if (year >= 2026) {
            // First half (H1)
            const h1Revenue = annualRevenue * 0.5;
            const h1Opex = h1Revenue * (params.opexPercent / 100);
            const h1Capex = year <= 2028 ? phase.capex * 0.5 : 0;
            const h1NetCf = h1Revenue - h1Opex - h1Capex;
            cumulativeCf += h1NetCf;
            
            projections.push({
                period: `${year} H1`,
                revenue: h1Revenue,
                opex: h1Opex,
                capex: h1Capex,
                netCf: h1NetCf,
                cumulativeCf: cumulativeCf,
                year: year,
                isH2: false
            });
            
            // Second half (H2)
            const h2Revenue = annualRevenue * 0.5;
            const h2Opex = h2Revenue * (params.opexPercent / 100);
            const h2Capex = year <= 2028 ? phase.capex * 0.5 : 0;
            const h2NetCf = h2Revenue - h2Opex - h2Capex;
            cumulativeCf += h2NetCf;
            
            projections.push({
                period: `${year} H2`,
                revenue: h2Revenue,
                opex: h2Opex,
                capex: h2Capex,
                netCf: h2NetCf,
                cumulativeCf: cumulativeCf,
                year: year,
                isH2: true
            });
        } else {
            // Full year for 2025 (pre-operational)
            const opex = 0; // No revenue in 2025
            const capex = phase.capex;
            const netCf = -capex;
            cumulativeCf += netCf;
            
            projections.push({
                period: `${year}`,
                revenue: 0,
                opex: opex,
                capex: capex,
                netCf: netCf,
                cumulativeCf: cumulativeCf,
                year: year,
                isH2: false
            });
        }
    }
    
    return projections;
}

// Update the projections table
function updateProjectionsTable(projections) {
    const tbody = document.getElementById('projections-body');
    tbody.innerHTML = '';
    
    projections.forEach(proj => {
        const row = document.createElement('tr');
        
        // Highlight the year row
        if (proj.period.endsWith(' H1') || projections.indexOf(proj) === 0) {
            row.classList.add('table-active');
        }
        
        row.innerHTML = `
            <td>${proj.period}</td>
            <td>${formatCurrency(proj.revenue)}</td>
            <td>${formatCurrency(proj.opex)}</td>
            <td>${formatCurrency(proj.capex)}</td>
            <td class="${proj.netCf < 0 ? 'text-danger' : 'text-success'}">${formatCurrency(proj.netCf)}</td>
            <td class="${proj.cumulativeCf < 0 ? 'text-danger' : 'text-success'}">${formatCurrency(proj.cumulativeCf)}</td>
        `;
        
        tbody.appendChild(row);
    });
}

// Update the chart with projections
function updateChart(projections) {
    const ctx = document.getElementById('cashFlowChart').getContext('2d');
    
    // Prepare data for chart
    const labels = projections.map(p => p.period);
    const revenueData = projections.map(p => p.revenue);
    const opexData = projections.map(p => p.opex);
    const capexData = projections.map(p => p.capex);
    const netCfData = projections.map(p => p.netCf);
    
    // Destroy previous chart if it exists
    if (cashFlowChart) {
        cashFlowChart.destroy();
    }
    
    // Create new chart
    cashFlowChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Revenue',
                    data: revenueData,
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    type: 'bar'
                },
                {
                    label: 'OPEX',
                    data: opexData,
                    backgroundColor: 'rgba(255, 99, 132, 0.7)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1,
                    type: 'bar'
                },
                {
                    label: 'CAPEX',
                    data: capexData,
                    backgroundColor: 'rgba(255, 159, 64, 0.7)',
                    borderColor: 'rgba(255, 159, 64, 1)',
                    borderWidth: 1,
                    type: 'bar'
                },
                {
                    label: 'Net Cash Flow',
                    data: netCfData,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    type: 'line',
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Amount (Million RUB)'
                    }
                },
                y1: {
                    position: 'right',
                    beginAtZero: true,
                    grid: {
                        drawOnChartArea: false
                    },
                    title: {
                        display: true,
                        text: 'Net Cash Flow (Million RUB)'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += formatCurrency(context.parsed.y);
                            }
                            return label;
                        }
                    }
                },
                legend: {
                    position: 'top',
                }
            }
        }
    });
}

// Update KPI cards
function updateKPIs(projections, totalInvestment) {
    // Update total investment
    document.getElementById('total-investment').textContent = formatCurrency(totalInvestment);
    
    // Calculate payback period
    let paybackPeriod = 'N/A';
    let positiveYear = null;
    
    for (let i = 0; i < projections.length; i++) {
        if (projections[i].cumulativeCf >= 0) {
            const years = (i / 2) + 0.5; // Each step is half a year
            paybackPeriod = years.toFixed(1);
            positiveYear = projections[i].year;
            break;
        }
    }
    
    document.getElementById('payback-period').textContent = paybackPeriod;
    
    // Calculate annual revenue for year 5 (2029)
    const year5Revenue = projections
        .filter(p => p.year === 2029)
        .reduce((sum, p) => sum + p.revenue, 0);
    
    document.getElementById('annual-revenue').textContent = formatCurrency(year5Revenue);
}

// Helper function to format currency
function formatCurrency(value) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'decimal',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    }).format(value);
}