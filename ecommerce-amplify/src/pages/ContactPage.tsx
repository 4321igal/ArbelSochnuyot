import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { InquiryForm } from '@/components/inquiry/InquiryForm';

export function ContactPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container-wide">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-brand-900 mb-3">צור קשר</h1>
          <p className="text-gray-600 max-w-xl mx-auto">
            מחפש רכב מסוים? יש לך שאלה? השאר פרטים ונחזור אליך תוך מספר שעות עבודה.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
            <h2 className="text-xl font-bold text-brand-900 mb-5">השאר פרטים</h2>
            <InquiryForm source="CONTACT_PAGE" />
          </div>

          <aside className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
              <h3 className="font-bold text-brand-900">פרטי הסוכנות</h3>
              <Item icon={<Phone className="w-5 h-5 text-accent-500" />} title="טלפון">
                <a href="tel:+972-3-1234567" className="hover:text-brand-700">03-1234567</a>
              </Item>
              <Item icon={<Mail className="w-5 h-5 text-accent-500" />} title="אימייל">
                <a href="mailto:contact@arbel-cars.co.il" className="hover:text-brand-700 break-all">
                  contact@arbel-cars.co.il
                </a>
              </Item>
              <Item icon={<MapPin className="w-5 h-5 text-accent-500" />} title="כתובת">
                רחוב התעשייה 12, ראשון לציון
              </Item>
              <Item icon={<Clock className="w-5 h-5 text-accent-500" />} title="שעות פתיחה">
                <div className="text-sm">
                  <div>א'-ה': 09:00-19:00</div>
                  <div>ו': 09:00-13:00</div>
                  <div>שבת: סגור</div>
                </div>
              </Item>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden aspect-square">
              <iframe
                title="מפת הסוכנות"
                src="https://www.openstreetmap.org/export/embed.html?bbox=34.79%2C31.97%2C34.81%2C31.99&layer=mapnik"
                className="w-full h-full border-0"
                loading="lazy"
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Item({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="shrink-0 mt-0.5">{icon}</div>
      <div>
        <div className="text-xs text-gray-500 font-medium mb-0.5">{title}</div>
        <div className="text-brand-900">{children}</div>
      </div>
    </div>
  );
}
