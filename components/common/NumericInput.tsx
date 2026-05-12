'use client';

import React from 'react';

interface NumericInputProps {
  value: number;
  onChange: (v: number) => void;
  isFloat?: boolean;
  className?: string;
  readOnly?: boolean;
  placeholder?: string;
}

export function NumericInput({ value, onChange, isFloat = false, className, readOnly, placeholder }: NumericInputProps) {
  const [display, setDisplay] = React.useState('');

  React.useEffect(() => {
    if (isFloat) {
      setDisplay(value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    } else {
      setDisplay(value.toLocaleString('pt-BR'));
    }
  }, [value, isFloat]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return;
    const raw = e.target.value;

    if (isFloat) {
      const clean = raw.replace(/[^\d,]/g, '');
      setDisplay(clean);
      const num = parseFloat(clean.replace(',', '.')) || 0;
      onChange(num);
    } else {
      const clean = raw.replace(/\D/g, '');
      setDisplay(clean ? Number(clean).toLocaleString('pt-BR') : '');
      onChange(Number(clean) || 0);
    }
  };

  const handleBlur = () => {
    if (isFloat) {
      setDisplay(value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    } else {
      setDisplay(value.toLocaleString('pt-BR'));
    }
  };

  return (
    <input
      type="text"
      className={className}
      value={display}
      onChange={handleChange}
      onBlur={handleBlur}
      readOnly={readOnly}
      placeholder={placeholder}
    />
  );
}
