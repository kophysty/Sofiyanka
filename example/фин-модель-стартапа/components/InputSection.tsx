import React from 'react';
import { InputSectionProps } from '../types';
import NumberInput from './NumberInput';
import CollapsibleSection from './CollapsibleSection';

const InputSection: React.FC<InputSectionProps> = ({ inputs, onInputChange }) => {
  return (
    <div>
      <h2 className="text-xl font-semibold text-sky-600 mb-6">Параметры модели</h2>
      
      <div className="space-y-4">
        <CollapsibleSection title="1. Инвестиции в разработку MVP" defaultOpen={true}>
          <NumberInput label="З/П основателя (для MVP)" id="founderSalaryMonthly" value={inputs.founderSalaryMonthly} unit="руб./мес." onChange={onInputChange} step={1000} tooltip="Используется для расчета доли основателей в стоимости MVP (Разработка UI/структуры)"/>
          <NumberInput label="Кол-во основателей (для MVP)" id="founderCount" value={inputs.founderCount} unit="чел." onChange={onInputChange} min={1} tooltip="Используется для расчета доли основателей в стоимости MVP"/>
          <NumberInput label="Срок разработки MVP" id="mvpDevelopmentMonths" value={inputs.mvpDevelopmentMonths} unit="мес." onChange={onInputChange} min={1} tooltip="Используется для расчета доли основателей в стоимости MVP"/>
          <NumberInput label="Ставка специалиста (MVP)" id="specialistRatePerHour" value={inputs.specialistRatePerHour} unit="руб./час" onChange={onInputChange} step={100} />
          <NumberInput label="Часы специалиста на MVP" id="specialistHoursMVP" value={inputs.specialistHoursMVP} unit="часов" onChange={onInputChange} />
          <NumberInput label="Расходы на TG версию (MVP)" id="mvpTgVersionCost" value={inputs.mvpTgVersionCost} unit="руб." onChange={onInputChange} step={10000} />
          <NumberInput label="Софт и Непредвиденное (MVP)" id="mvpSoftwareContingencyCost" value={inputs.mvpSoftwareContingencyCost} unit="руб." onChange={onInputChange} step={5000} />
          <NumberInput label="Сервера (MVP)" id="mvpInitialServerCost" value={inputs.mvpInitialServerCost} unit="руб." onChange={onInputChange} step={5000} tooltip="Первоначальные затраты на серверную инфраструктуру для MVP"/>
        </CollapsibleSection>

        <CollapsibleSection title="2. Привлечение и рост пользователей">
          <NumberInput label="Начальное количество пользователей" id="initialClientCount" value={inputs.initialClientCount} unit="чел." onChange={onInputChange} min={0} tooltip="Пользователи на момент старта (месяц 0)"/>
          <NumberInput label="Базовый приток новых пользователей" id="baseDirectNewUsersMonthly" value={inputs.baseDirectNewUsersMonthly} unit="чел./мес." onChange={onInputChange} min={0} tooltip="Среднее количество новых пользователей, привлекаемых напрямую каждый месяц"/>
          <NumberInput label="Вариация притока пользователей" id="newUserInflowVariationPercentage" value={inputs.newUserInflowVariationPercentage} unit="%" onChange={onInputChange} step={0.01} min={0} max={1} tooltip="Максимальное отклонение от базового притока (e.g., 0.2 = +/- 20%)"/>
          <NumberInput label="Ежемесячный отток пользователей" id="monthlyChurnAbsolute" value={inputs.monthlyChurnAbsolute} unit="чел./мес." onChange={onInputChange} step={1} min={0} tooltip="Абсолютное количество индивидуальных пользователей, уходящих каждый месяц"/>
        </CollapsibleSection>
        
        <CollapsibleSection title="3. Маркетинг, расходы и монетизация (базовая)">
          <NumberInput label="Цена стандартной подписки" id="subscriptionPricePerUser" value={inputs.subscriptionPricePerUser} unit="руб./мес." onChange={onInputChange} step={100} />
          <NumberInput label="Базовый бюджет на маркетинг" id="baseMarketingSpendMonthly" value={inputs.baseMarketingSpendMonthly} unit="руб./мес." onChange={onInputChange} step={1000} />
          <NumberInput label="Маркетинг (% от прибыли пред. мес.)" id="marketingSpendAsProfitPercentage" value={inputs.marketingSpendAsProfitPercentage} unit="%" onChange={onInputChange} step={0.001} min={0} max={1} tooltip="Доля от чистой прибыли предыдущего месяца, добавляемая к маркетинговому бюджету (e.g. 0.05 = 5%)"/>
          <NumberInput label="ФОТ Основателей (пост-MVP, общий)" id="ongoingFounderSalaryMonthlyTotal" value={inputs.ongoingFounderSalaryMonthlyTotal} unit="руб./мес." onChange={onInputChange} step={10000} tooltip="Общая сумма зарплат основателей в месяц после запуска MVP"/>
          <NumberInput label="Расходы на серверы (ежемес.)" id="serverCostsMonthly" value={inputs.serverCostsMonthly} unit="руб./мес." onChange={onInputChange} step={1000} tooltip="Регулярные ежемесячные расходы на серверы"/>
          <NumberInput label="Часы на поддержку/доработку" id="supportHoursMonthly" value={inputs.supportHoursMonthly} unit="час./мес." onChange={onInputChange} tooltip="Оплачиваются по ставке специалиста"/>
          <NumberInput label="Расходы на бухгалтерию" id="accountingCostsMonthly" value={inputs.accountingCostsMonthly} unit="руб./мес." onChange={onInputChange} step={1000} tooltip="Ежемесячные расходы на бухгалтерское обслуживание"/>
          <NumberInput label="Ставка налога на прибыль" id="taxRate" value={inputs.taxRate} unit="%" onChange={onInputChange} step={0.01} min={0} max={1} tooltip="e.g. 0.20 для 20% налога"/>
        </CollapsibleSection>

        <CollapsibleSection title="4. Дополнительные источники дохода">
          <NumberInput label="Цена расширенного пакета" id="extendedPackagePrice" value={inputs.extendedPackagePrice} unit="руб./мес./польз." onChange={onInputChange} step={100} />
          <NumberInput label="Старт расширенного пакета (месяц)" id="extendedPackageStartMonth" value={inputs.extendedPackageStartMonth} unit="мес." onChange={onInputChange} min={1} max={24} step={1} tooltip="Месяц, с которого доступен расширенный пакет"/>
          <NumberInput label="% конверсии в расширенный пакет" id="percentageUsersConvertingToExtended" value={inputs.percentageUsersConvertingToExtended} unit="в мес." onChange={onInputChange} step={0.001} min={0} max={1} tooltip="Доля стандартных пользователей, переходящих на расширенный пакет ежемесячно (e.g. 0.05 = 5%)"/>
          
          <NumberInput label="Корпоративный пакет (разовый платеж)" id="corporatePackageSetupFee" value={inputs.corporatePackageSetupFee} unit="руб." onChange={onInputChange} step={10000} />
          <NumberInput label="Корпоративный пакет (ежемес. платеж)" id="corporatePackageMonthlyFee" value={inputs.corporatePackageMonthlyFee} unit="руб./мес." onChange={onInputChange} step={1000} />
          <NumberInput label="Старт корпоративного пакета (месяц)" id="corporatePackageStartMonth" value={inputs.corporatePackageStartMonth} unit="мес." onChange={onInputChange} min={1} max={24} step={1} tooltip="Месяц, с которого доступны корпоративные продажи"/>
          <NumberInput label="Новых корпоративных сделок в месяц" id="newCorporateDealsPerMonth" value={inputs.newCorporateDealsPerMonth} unit="сделок" onChange={onInputChange} step={0.05} min={0} tooltip="Среднее количество новых корпоративных клиентов в месяц (может быть дробным)"/>
        </CollapsibleSection>
      </div>
    </div>
  );
};

export default InputSection;