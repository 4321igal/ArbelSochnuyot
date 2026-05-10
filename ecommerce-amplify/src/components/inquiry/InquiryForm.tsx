import { useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { createInquiry, type CreateInquiryInput, type ContactMethod, type InquirySource } from '@/lib/api/inquiries';

interface Props {
  vehicleId?: string;
  vehicleLabel?: string;
  source?: InquirySource;
  defaultMessage?: string;
  showFinancing?: boolean;
  showTestDrive?: boolean;
  showTradeIn?: boolean;
  onSuccess?: () => void;
}

const PHONE_REGEX = /^(\+972|0)([23489]|5[0-9]|7[0-9])[-]?\d{7}$/;

export function InquiryForm({
  vehicleId,
  vehicleLabel,
  source = 'CONTACT_PAGE',
  defaultMessage,
  showFinancing = true,
  showTestDrive = true,
  showTradeIn = true,
  onSuccess,
}: Props) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [contactMethod, setContactMethod] = useState<ContactMethod>('PHONE');
  const [message, setMessage] = useState(defaultMessage || '');
  const [interestedInTestDrive, setInterestedInTestDrive] = useState(false);
  const [interestedInFinancing, setInterestedInFinancing] = useState(false);
  const [tradeInDescription, setTradeInDescription] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = fullName.trim();
    if (trimmedName.length < 2) {
      setError('אנא הזן שם מלא');
      return;
    }
    const normalizedPhone = phone.replace(/\s+/g, '');
    if (!PHONE_REGEX.test(normalizedPhone)) {
      setError('מספר טלפון לא תקין');
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('כתובת אימייל לא תקינה');
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateInquiryInput = {
        vehicleId,
        fullName: trimmedName,
        phone: normalizedPhone,
        email: email.trim() || undefined,
        preferredContactMethod: contactMethod,
        message: message.trim() || undefined,
        interestedInTestDrive,
        interestedInFinancing,
        tradeInDescription: tradeInDescription.trim() || undefined,
        source,
      };
      await createInquiry(payload);
      setSubmitted(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שליחת הפנייה נכשלה');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-8 px-4">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-brand-900 mb-2">קיבלנו את הפנייה שלך</h3>
        <p className="text-gray-600">
          נחזור אליך בהקדם האפשרי, בדרך כלל תוך שעות העבודה הקרובות.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {vehicleLabel && (
        <div className="bg-brand-50 border border-brand-200 rounded-lg p-3 text-sm text-brand-800">
          פנייה לגבי: <strong>{vehicleLabel}</strong>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="inq-name">שם מלא *</label>
          <input
            id="inq-name"
            type="text"
            className="input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="ישראל ישראלי"
            required
            autoComplete="name"
          />
        </div>
        <div>
          <label className="label" htmlFor="inq-phone">טלפון *</label>
          <input
            id="inq-phone"
            type="tel"
            className="input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="050-1234567"
            required
            autoComplete="tel"
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="inq-email">אימייל (אופציונלי)</label>
        <input
          id="inq-email"
          type="email"
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          autoComplete="email"
        />
      </div>

      <div>
        <label className="label">דרך יצירת קשר מועדפת</label>
        <div className="flex gap-2">
          {(['PHONE', 'WHATSAPP', 'EMAIL'] as ContactMethod[]).map((m) => (
            <label
              key={m}
              className={`flex-1 cursor-pointer border rounded-lg p-2.5 text-center text-sm transition-all ${
                contactMethod === m
                  ? 'border-accent-500 bg-accent-50 text-brand-900 font-medium'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                type="radio"
                name="contact-method"
                value={m}
                checked={contactMethod === m}
                onChange={() => setContactMethod(m)}
                className="sr-only"
              />
              {m === 'PHONE' && 'טלפון'}
              {m === 'WHATSAPP' && 'וואטסאפ'}
              {m === 'EMAIL' && 'אימייל'}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="label" htmlFor="inq-msg">הודעה (אופציונלי)</label>
        <textarea
          id="inq-msg"
          className="input"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="ספר לנו מה אתה מחפש..."
        />
      </div>

      {(showTestDrive || showFinancing || showTradeIn) && (
        <div className="space-y-2 bg-gray-50 rounded-lg p-3">
          {showTestDrive && (
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={interestedInTestDrive}
                onChange={(e) => setInterestedInTestDrive(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-accent-500 focus:ring-accent-400"
              />
              <span>מעוניין בנסיעת מבחן</span>
            </label>
          )}
          {showFinancing && (
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={interestedInFinancing}
                onChange={(e) => setInterestedInFinancing(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-accent-500 focus:ring-accent-400"
              />
              <span>מעוניין במידע על מימון</span>
            </label>
          )}
          {showTradeIn && (
            <div>
              <label className="flex items-center gap-2 text-sm mb-1">
                <span>יש לי רכב להחלפה (אופציונלי)</span>
              </label>
              <input
                type="text"
                className="input"
                value={tradeInDescription}
                onChange={(e) => setTradeInDescription(e.target.value)}
                placeholder='לדוגמה: סקודה אוקטביה 2018, 80,000 ק"מ'
              />
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
          {error}
        </div>
      )}

      <button type="submit" disabled={submitting} className="btn-accent w-full">
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>שולח...</span>
          </>
        ) : (
          <span>שלח פנייה</span>
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        בלחיצה על "שלח פנייה" אתה מסכים ליצירת קשר מצידנו.
      </p>
    </form>
  );
}
