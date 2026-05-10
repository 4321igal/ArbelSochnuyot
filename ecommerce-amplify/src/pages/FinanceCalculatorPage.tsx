import { Link } from 'react-router-dom';
import { ArrowLeft, Info } from 'lucide-react';
import { FinanceCalculator } from '@/components/finance/FinanceCalculator';

export function FinanceCalculatorPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container-narrow">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-brand-900 mb-3">מחשבון מימון</h1>
          <p className="text-gray-600">
            הכנס מחיר רכב, מקדמה, ריבית ותקופה — וקבל את ההחזר החודשי המשוער.
          </p>
        </header>

        <FinanceCalculator />

        <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-accent-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-brand-900 mb-2">מה כדאי לדעת?</h3>
              <ul className="text-sm text-gray-700 space-y-1.5 list-disc list-inside">
                <li>הריבית בפועל תיקבע לפי הדירוג האשראי שלך והמלווה.</li>
                <li>בערבל אנחנו עובדים עם מספר מקורות מימון להציע לך את התנאים הטובים ביותר.</li>
                <li>אישור עקרוני אפשר לקבל תוך 24 שעות.</li>
                <li>החישוב במחשבון לא מחייב את הסוכנות או את גוף המימון.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/contact" className="btn-primary inline-flex">
            רוצה הצעת מימון מותאמת אישית?
            <ArrowLeft className="w-4 h-4 ms-2" />
          </Link>
        </div>
      </div>
    </div>
  );
}
