# CHANGELOG

## 2025-06-24
- Архитектурный рефакторинг: вынесены модели, сервисы, константы, утилиты в отдельные модули (TypeScript)
- Покрытие юнит-тестами: House, Phase, Scenario, CalculationService, StorageService, MigrationUtils
- Интеграция новой архитектуры в UI (index.html + main.ts)
- Перенос расчётов и вывода результатов на новую логику
- Оставлен старый app.js для плавного перехода
- Добавлен CHANGELOG.md для отслеживания изменений

## [1.2.0] - 2024-07-25

### Added
- **Dynamic House Configuration**: Replaced the static "Residential Fund" input with a dynamic UI. Users can now add, configure (type, tier, quantity), and remove multiple groups of houses.
- **Automatic CAPEX Calculation**: The model now automatically calculates the residential CAPEX based on the user's house configuration, providing more accurate and flexible financial planning.

### Changed
- **UI Logic**: Refactored `main.ts` to handle the new dynamic house interface, including event listeners for adding/removing rows and reading the configuration during calculation.

## [1.1.0] - 2024-07-25

### Added
- **Chart Visualization**: Implemented Chart.js to display a cash flow forecast, including Net CF (bars) and Cumulative CF (line).
- **Dynamic Calculations**: Linked sidebar parameters to the calculation engine. KPIs and the financial projections table now update on user input.

### Fixed
- **Calculation Logic**: Corrected the cash flow service to ensure revenue is generated in all periods after house construction is complete.
- **Module Loading**: Resolved JavaScript module loading errors by updating the HTML script tags and event listeners, enabling the use of ES modules with Vite.
- **Initial Data Population**: Ensured all KPIs, the table, and the chart populate with initial data on page load.

### Changed
- **Version Update**: Updated model version to 1.1 in `index.html`.

## [1.0.0] - 2024-07-24

### Added
- **Project Scaffolding**: Initialized the project with Vite, TypeScript, and Jest.
- **Core Architecture**: Created a modular structure with models (`House`, `Phase`, `Scenario`), services (`CalculationService`), and constants.
- **Unit Tests**: Implemented comprehensive unit tests for all backend logic, achieving 100% test coverage.
- **Initial UI Integration**: Created `main.ts` as the new entry point and wired it to the existing `index.html`.
- **Documentation**: Created `financial_model_enhancement_roadmap.md`, `phase1_plan.md`, `implementation_summary.md`, and this `CHANGELOG.md`. 