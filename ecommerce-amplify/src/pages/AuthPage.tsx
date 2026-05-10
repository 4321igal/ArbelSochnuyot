import { useNavigate, useLocation } from 'react-router-dom';
import { Authenticator, translations } from '@aws-amplify/ui-react';
import { I18n } from 'aws-amplify/utils';
import '@aws-amplify/ui-react/styles.css';

I18n.putVocabularies(translations);
I18n.setLanguage('he');

export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || '/';

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-gray-50">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-900">ברוכים הבאים</h1>
          <p className="text-gray-600 mt-2">התחבר לחשבון או צור חשבון חדש</p>
        </div>

        <Authenticator
          signUpAttributes={['email', 'given_name', 'family_name']}
          components={{
            Header() {
              return null;
            },
          }}
        >
          {({ user }) => {
            if (user) {
              navigate(from, { replace: true });
            }
            return <div />;
          }}
        </Authenticator>

        <p className="text-center text-sm text-gray-500 mt-6">
          בהתחברות אתה מסכים ל
          <a href="#" className="text-brand-700 hover:text-brand-800 mx-1">תנאי השימוש</a>
          ול
          <a href="#" className="text-brand-700 hover:text-brand-800 mx-1">מדיניות הפרטיות</a>
          שלנו.
        </p>
      </div>
    </div>
  );
}
