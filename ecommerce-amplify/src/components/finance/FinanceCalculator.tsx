import { useMemo, useState } from 'react';
import { Calculator } from 'lucide-react';

interface Props {
  initialPrice?: number;
  compact?: boolean;
}

function pmt(principal: number, monthlyRate: number, months: number): number {
  if (monthlyRate === 0) return principal / months;
  const factor = Math.pow(1 + monthlyRate, months);
  return (principal * monthlyRate * factor) / (factor - 1);
}

function formatILS(n: number): string {
  return `₪${Math.round(n).toLocaleString('he-IL')}`;
}

export function FinanceCalculator({ initialPrice = 150000, compact = false }: Props) {
  const [price, setPrice] = useState(initialPrice);
  const [downPayment, setDownPayment] = useState(Math.round(initialPrice * 0.2));
  const [annualRate, setAnnualRate] = useState(5);
  const [months, setMonths] = useState(60);

  const result = useMemo(() => {
    const principal = Math.max(0, price - downPayment);
    const monthlyRate = annualRate / 100 / 12;
    const monthly = principal > 0 ? pmt(principal, monthlyRate, months) : 0;
    const total = monthly * months + downPayment;
    const interest = total - price;
    return {
      principal,
      monthly,
      total,
      interest: Math.max(0, interest),
    };
  }, [price, downPayment, annualRate, months]);

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${compact ? 'p-4' : 'p-6'}`}>
      <h3 className="flex items-center gap-2 font-bold text-brand-900 mb-4">
        <Calculator className="w-5 h-5 text-accent-500" />
        מחשבון מימון
      </h3>

      <div className="space-y-4">
        <RangeField
          label="מחיר הרכב"
          value={price}
          min={20000}
          max={1000000}
          step={5000}
          onChange={(v) => {
            setPrice(v);
            if (downPayment > v) setDownPayment(Math.round(v * 0.2));
          }}
          format={formatILS}
        />

        <RangeField
          label="מקדמה"
          value={downPayment}
          min={0}
          max={price}
          step={1000}
          onChange={setDownPayment}
          format={formatILS}
          hint={`${price > 0 ? Math.round((downPayment / price) * 100) : 0}% מהמחיר`}
        />

        <RangeField
          label="ריבית שנתית"
          value={annualRate}
          min={0}
          max={20}
          step={0.25}
          onChange={setAnnualRate}
          format={(v) => `${v.toFixed(2)}%`}
        />

        <RangeField
          label="תקופת ההלוואה"
          value={months}
          min={12}
          max={120}
          step={6}
          onChange={setMonths}
          format={(v) => `${v} חודשים (${Math.round((v / 12) * 10) / 10} שנים)`}
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="bg-brand-50 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-600 mb-1">החזר חודשי</div>
          <div className="text-2xl font-bold text-brand-900">{formatILS(result.monthly)}</div>
        </div>
        <div className="bg-accent-50 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-600 mb-1">סה"כ תשלום</div>
          <div className="text-2xl font-bold text-brand-900">{formatILS(result.total)}</div>
        </div>
        <div className="col-span-2 bg-gray-50 rounded-lg p-3 text-sm flex items-center justify-between">
          <span className="text-gray-600">סה"כ ריבית:</span>
          <span className="font-semibold text-brand-900">{formatILS(result.interest)}</span>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-4">
        חישוב בלתי מחייב. תנאי המימון בפועל יקבעו לפי דירוג אשראי ומקור המימון.
      </p>
    </div>
  );
}

interface RangeProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
  hint?: string;
}

function RangeField({ label, value, min, max, step, onChange, format, hint }: RangeProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm font-bold text-brand-900">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent-500"
      />
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}
