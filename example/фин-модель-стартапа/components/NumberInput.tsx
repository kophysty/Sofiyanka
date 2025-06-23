
import React from 'react';
import { NumberInputProps } from '../types';

const NumberInput: React.FC<NumberInputProps> = ({ 
  label, 
  id, 
  value, 
  unit, 
  onChange, 
  min = 0,
  max,
  step = 1 ,
  placeholder,
  fullWidth = false,
  tooltip
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let numValue = e.target.value === '' ? 0 : parseFloat(e.target.value);
    if (!isNaN(numValue)) {
      if (max !== undefined && numValue > max) numValue = max;
      if (min !== undefined && numValue < min) numValue = min;
      onChange(id, numValue);
    } else if (e.target.value === '') {
       onChange(id, 0);
    }
  };

  return (
    <div className={`mb-4 ${fullWidth ? 'w-full' : ''}`} title={tooltip}>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">
        {label} {unit && <span className="text-xs text-slate-500">({unit})</span>}
      </label>
      <input
        type="number"
        id={id}
        name={id}
        value={value === 0 && placeholder && String(value) !== placeholder ? '' : String(value)}
        onChange={handleChange}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder || String(min)}
        className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm transition-colors duration-150"
      />
    </div>
  );
};

export default NumberInput;
