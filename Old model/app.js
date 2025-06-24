// Financial Model for Sofiyanka Glamping Project

// DOM Elements
const form = document.getElementById('parameters-form');
const projectionsBody = document.getElementById('projections-body');

// Global chart instance - use a different name to avoid collision with canvas ID
let chartInstance = null;

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
    console.log('calculate() called');
    
    try {
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
    
    console.log('Calculation completed successfully');
    } catch (error) {
        console.error('Error in calculate function:', error);
        if (error instanceof Error) {
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
        }
    }
}

// Generate financial projections
function generateProjections(totalInvestment, params) {
    console.log('generateProjections called with:', { totalInvestment, params });
    
    const projections = [];
    let cumulativeCf = 0;
    
    if (!params) {
        console.error('No parameters provided to generateProjections');
        return [];
    }
    
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
    console.log(`Generating projections from ${startYear} to ${endYear}`);
    
    for (let year = startYear; year <= endYear; year++) {
        console.log(`Processing year: ${year}`);
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
    
    console.log('Generated projections:', projections);
    return projections;
}

// Update the projections table with phase indicators
function updateProjectionsTable(projections) {
    const tbody = document.getElementById('projections-body');
    if (!tbody) {
        console.error('Projections table body not found!');
        return;
    }
    
    tbody.innerHTML = ''; // Clear existing rows
    
    // Define phase boundaries (indexes where new phases start)
    const phaseBoundaries = [4, 8]; // After 2026 H2 and 2028 H2
    let currentPhase = 0;
    
    projections.forEach((proj, i) => {
        const row = document.createElement('tr');
        
        // Highlight the year row
        if (proj.period.endsWith(' H1') || projections.indexOf(proj) === 0) {
            row.classList.add('table-active');
        }
        
        // Add phase separator row if needed
        if (phaseBoundaries.includes(i)) {
            const phaseRow = document.createElement('tr');
            const phaseNames = ['I. Старт (2025-2026)', 'II. Разгон (2027-2028)', 'III. Флагман (2029-2033)'];
            const phaseClass = `phase-${currentPhase + 1}`;
            phaseRow.className = `table-${phaseClass} phase-separator`;
            phaseRow.innerHTML = `
                <td colspan="6" class="text-center fw-bold">
                    Фаза ${phaseNames[currentPhase]}
                </td>
            `;
            tbody.appendChild(phaseRow);
            currentPhase++;
        }
        
        const rowClass = `phase-${currentPhase}`;
        row.className = rowClass;
        
        // Highlight current row if it's a year start
        const isYearStart = proj.period.endsWith('H1');
        if (isYearStart) {
            row.classList.add('year-start');
        }
        
        row.innerHTML = `
            <td>${proj.period}</td>
            <td>${formatCurrency(proj.revenue)}</td>
            <td>${formatCurrency(proj.opex)}</td>
            <td>${formatCurrency(proj.capex)}</td>
            <td class="${proj.netCf < 0 ? 'text-danger' : 'text-success'}">${formatCurrency(proj.netCf)}</td>
            <td class="fw-bold ${proj.cumulativeCf < 0 ? 'text-danger' : 'text-success'}">${formatCurrency(proj.cumulativeCf)}</td>
        `;
        tbody.appendChild(row);
    });
}

// Add phase indicators to the chart
function addPhaseIndicators(chart) {
    try {
        const chartArea = chart.chartArea;
        if (!chartArea) {
            console.warn('Chart area not available');
            return;
        }
        
        const phaseBoundaries = [
            { x: 0.5, label: 'I. Старт' },
            { x: 4.5, label: 'II. Разгон' },
            { x: 8.5, label: 'III. Флагман' }
        ];
        
        phaseBoundaries.forEach(phase => {
            if (chart.scales?.x && phase.x >= chart.scales.x.min && phase.x <= chart.scales.x.max) {
                const xPos = chart.scales.x.getPixelForValue(phase.x);
                
                // Draw vertical line
                chart.ctx.save();
                chart.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
                chart.ctx.lineWidth = 1;
                chart.ctx.setLineDash([5, 3]);
                chart.ctx.beginPath();
                chart.ctx.moveTo(xPos, chartArea.top);
                chart.ctx.lineTo(xPos, chartArea.bottom);
                chart.ctx.stroke();
                
                // Draw phase label
                chart.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                chart.ctx.font = '12px Arial';
                chart.ctx.textAlign = 'center';
                chart.ctx.fillText(phase.label, xPos, chartArea.top + 20);
                chart.ctx.restore();
            }
        });
    } catch (error) {
        console.error('Error in addPhaseIndicators:', error);
    }
}

// Update the chart with projections
function updateChart(projections) {
    console.log('=== updateChart called ===');
    console.log('Projections data:', projections);
    
    // Get the canvas element
    const canvas = document.getElementById('cashFlowChart');
    console.log('Canvas element:', canvas);
    
    if (!canvas) {
        console.error('❌ Chart canvas element not found!');
        return;
    }
    
    // Check canvas dimensions
    console.log('Canvas dimensions:', {
        width: canvas.width,
        height: canvas.height,
        clientWidth: canvas.clientWidth,
        clientHeight: canvas.clientHeight,
        offsetWidth: canvas.offsetWidth,
        offsetHeight: canvas.offsetHeight
    });
    
    // Set explicit dimensions
    canvas.style.width = '100%';
    canvas.style.height = '400px';
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Could not get 2D context from canvas');
        return;
    }
    
    // Destroy previous chart if it exists
    if (chartInstance) {
        console.log('Destroying previous chart instance');
        try {
            chartInstance.destroy();
            console.log('Previous chart instance destroyed');
        } catch (e) {
            console.error('Error destroying previous chart:', e);
        } finally {
            chartInstance = null;
        }
    }
    
    // Check if we have data to display
    if (!projections || projections.length === 0) {
        console.error('❌ No data provided for chart');
        return;
    }
    
    console.log('Chart data validation:', {
        hasProjections: !!projections,
        projectionsLength: projections.length,
        firstItem: projections[0]
    });
    
    // Validate data
    const hasInvalidData = projections.some(p => isNaN(p.revenue) || isNaN(p.opex) || isNaN(p.capex));
    if (hasInvalidData) {
        console.error('❌ Invalid data in projections:', projections);
        return;
    }
    
    console.log('Chart.js version:', Chart?.version || 'Not loaded');
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded!');
        return;
    }
    
    // Prepare data for chart
    const labels = projections.map(p => p.period);
    const revenueData = projections.map(p => p.revenue || 0);
    const opexData = projections.map(p => p.opex || 0);
    const capexData = projections.map(p => p.capex || 0);
    const netCfData = projections.map(p => p.netCf || 0);
    const cumulativeCfData = projections.map(p => p.cumulativeCf || 0);
    
    // Create chart configuration with all indicators
    const chartConfig = {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                // Revenue (bar)
                {
                    label: 'Выручка',
                    data: revenueData,
                    backgroundColor: 'rgba(40, 167, 69, 0.7)',
                    borderColor: 'rgba(40, 167, 69, 1)',
                    borderWidth: 1,
                    type: 'bar',
                    yAxisID: 'y',
                    order: 1
                },
                // OPEX (bar)
                {
                    label: 'ОПЕКС',
                    data: opexData,
                    backgroundColor: 'rgba(220, 53, 69, 0.7)',
                    borderColor: 'rgba(220, 53, 69, 1)',
                    borderWidth: 1,
                    type: 'bar',
                    yAxisID: 'y',
                    order: 2
                },
                // CAPEX (bar)
                {
                    label: 'КАПЕКС',
                    data: capexData,
                    backgroundColor: 'rgba(111, 66, 193, 0.7)',
                    borderColor: 'rgba(111, 66, 193, 1)',
                    borderWidth: 1,
                    type: 'bar',
                    yAxisID: 'y',
                    order: 3
                },
                // Net Cash Flow (line)
                {
                    label: 'Чистый денежный поток',
                    data: netCfData,
                    borderColor: 'rgba(13, 110, 253, 1)',
                    backgroundColor: 'transparent',
                    borderWidth: 3,
                    type: 'line',
                    yAxisID: 'y1',
                    order: 0,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.3
                },
                // Cumulative Cash Flow (line)
                {
                    label: 'Накопленный денежный поток',
                    data: cumulativeCfData,
                    borderColor: 'rgba(255, 193, 7, 1)',
                    backgroundColor: 'transparent',
                    borderWidth: 3,
                    type: 'line',
                    yAxisID: 'y1',
                    order: 0,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    borderDash: [5, 5],
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        boxWidth: 12,
                        padding: 10,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += formatCurrency(context.parsed.y) + ' млн. руб.';
                            }
                            return label;
                        }
                    }
                },
                title: {
                    display: false
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        autoSkip: false
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'млн. руб.'
                    },
                    grid: {
                        drawOnChartArea: true,
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString('ru-RU');
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Накопленный CF (млн. руб.)'
                    },
                    grid: {
                        drawOnChartArea: false
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString('ru-RU');
                        }
                    }
                }
            },
            animation: {
                duration: 1000
            }
        }
    };
    
    // Add phase indicators plugin
    chartConfig.plugins = chartConfig.plugins || {};
    chartConfig.plugins.annotation = {
        annotations: {
            phase1: {
                type: 'box',
                xMin: -0.5,
                xMax: 3.5,
                backgroundColor: 'rgba(255, 99, 132, 0.1)',
                borderWidth: 0,
                label: {
                    content: 'I. Старт (2025-2026)',
                    enabled: true,
                    position: 'top',
                    xAdjust: 70,
                    yAdjust: -10,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: '#fff',
                    font: { size: 10 },
                    padding: { top: 4, bottom: 4, left: 8, right: 8 },
                    borderRadius: 4
                }
            },
            phase2: {
                type: 'box',
                xMin: 3.5,
                xMax: 7.5,
                backgroundColor: 'rgba(54, 162, 235, 0.1)',
                borderWidth: 0,
                label: {
                    content: 'II. Разгон (2027-2028)',
                    enabled: true,
                    position: 'top',
                    xAdjust: 70,
                    yAdjust: -10,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: '#fff',
                    font: { size: 10 },
                    padding: { top: 4, bottom: 4, left: 8, right: 8 },
                    borderRadius: 4
                }
            },
            phase3: {
                type: 'box',
                xMin: 7.5,
                xMax: projections.length - 0.5,
                backgroundColor: 'rgba(75, 192, 192, 0.1)',
                borderWidth: 0,
                label: {
                    content: 'III. Флагман (2029-2033)',
                    enabled: true,
                    position: 'top',
                    xAdjust: 80,
                    yAdjust: -10,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: '#fff',
                    font: { size: 10 },
                    padding: { top: 4, bottom: 4, left: 8, right: 8 },
                    borderRadius: 4
                }
            }
        }
    };
    
    console.log('Chart config prepared:', chartConfig);
    
    // Initialize the chart with the configuration
    try {
        console.log('Initializing chart with config:', chartConfig);
        
        // Create the chart instance
        console.log('Creating new Chart instance...');
        const startTime = performance.now();
        chartInstance = new Chart(ctx, chartConfig);
        const endTime = performance.now();
        
        console.log(`✅ Chart initialized successfully in ${(endTime - startTime).toFixed(2)}ms`);
        console.log('Chart instance:', chartInstance);
        
        // Force a redraw after a short delay
        setTimeout(() => {
            if (chartInstance) {
                console.log('Forcing chart update...');
                try {
                    chartInstance.update();
                    console.log('Chart update complete');
                } catch (updateError) {
                    console.error('Error updating chart:', updateError);
                }
            }
        }, 300);
        
    } catch (error) {
        console.error('❌ Error initializing chart:', error);
        if (error instanceof Error) {
            console.error('Chart error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
        }
        
        // Try to render a simple chart as fallback
        try {
            console.log('Attempting fallback chart render...');
            chartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Test'],
                    datasets: [{
                        label: 'Test Data',
                        data: [1],
                        backgroundColor: 'red'
                    }]
                }
            });
            console.log('Fallback chart rendered');
        } catch (fallbackError) {
            console.error('❌ Could not render fallback chart:', fallbackError);
        }
    }
}

// Update KPI cards
function updateKPIs(projections, totalInvestment) {
    // Update total investment
    document.getElementById('total-investment').textContent = formatCurrency(totalInvestment);
    document.getElementById('total-investment-label').textContent = 'Общие инвестиции';
    document.getElementById('payback-period-label').textContent = 'Срок окупаемости';
    document.getElementById('annual-revenue-label').textContent = 'Годовая выручка (5-й год)';
    
    // Calculate payback period in years
    let paybackPeriod = 'N/A';
    let paybackFound = false;
    let positiveYear = null;
    
    for (let i = 0; i < projections.length; i++) {
        if (projections[i].cumulativeCf >= 0) {
            const years = (i / 2) + 0.5; // Each step is half a year
            paybackPeriod = years.toFixed(1) + ' лет';
            positiveYear = projections[i].year;
            paybackFound = true;
            break;
        }
    }
    
    document.getElementById('payback-period').textContent = paybackPeriod;
    
    // Calculate annual revenue for year 5 (2029)
    const year5Revenue = projections
        .filter(p => p.year === 2029)
        .reduce((sum, p) => sum + p.revenue, 0);
    
    if (!paybackFound) {
        paybackPeriod = '> ' + (projections.length / 2) + ' лет';
    }
    
    document.getElementById('annual-revenue').textContent = formatCurrency(year5Revenue) + ' млн ₽';
    document.getElementById('total-investment').textContent += ' млн ₽';
}

// Helper function to format currency
function formatCurrency(value) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'decimal',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    }).format(value);
}