# לוקלי מול ענן (AWS Amplify) – checklist

רשימת בדיקה כשהפרויקט עובד בענן אבל לא לוקלית (או להפך).

---

## 1. משתני סביבה (Environment variables)

| מקום | מה לבדוק |
|------|-----------|
| **Cloud** | Amplify Console → App settings → Environment variables |
| **לוקלי** | אין קובץ `.env` בפרויקט – האפליקציה לא משתמשת ב-`process.env` / `VITE_*` לקונפיגורציה |
| **חריג** | `import.meta.env.DEV` ב-`src/lib/amplify/configure.ts` (רק לוג) |

**מסקנה:** אם בעתיד תוסיף משתני סביבה בענן – הוסף גם `.env.local` לוקלית (ו-`VITE_*` אם זה Vite).

---

## 2. Amplify outputs / קונפיגורציה

| נושא | סטטוס בפרויקט |
|------|-----------------|
| **קובץ** | `amplify_outputs.json` (בשורש הפרויקט) |
| **טעינה** | `src/lib/amplify/configure.ts` טוען: `import outputs from '../../../amplify_outputs.json'` |
| **בענן** | ב-Amplify Hosting הקובץ נוצר אוטומטית ב-build (אקאנד המחובר). |
| **לוקלי** | חייב שיהיה קובץ תקף. הרצה: `npx ampx sandbox` (יוצר/מעדכן את הקובץ). |

**אם ניהול מוצרים / Auth לא עובדים לוקלית:**  
וודא ש-`amplify_outputs.json` קיים ואף לא ב-`.gitignore` אם אתה משתף אותו (או תריץ `npx ampx sandbox` אחרי clone).

---

## 3. Authentication (Cognito)

| נושא | מה לבדוק |
|------|-----------|
| **Callback / Logout URLs** | ב-Cognito User Pool → App integration → App client: ש-`http://localhost:5173` (או הפורט שלך) מופיע ב-Allowed callback URLs ו-Allowed sign-out URLs. |
| **Cognito domain** | אותו דומיין כמו בענן (הקונפיג מגיע מ-`amplify_outputs.json`). |
| **סנדבוקס** | אחרי `npx ampx sandbox`, ה-sandbox מוסיף לרוב את `http://localhost:5173` ל-Cognito. |

---

## 4. API endpoint

- ה-API (AppSync) מוגדר ב-`amplify_outputs.json` תחת `data.url`.
- לוקלי וענן משתמשים **באותו קובץ** – אז ה-endpoint זהה (או שונה רק אם יש לך קובץ outputs נפרד לפרודקשן).
- אם בענן יש build עם outputs מפרודקשן – ה-URL שם יהיה של הסביבה המחוברת.

---

## 5. CORS

- **S3 (Storage):** ב-`amplify/backend.ts` כבר מוגדר:
  - `http://localhost:5173`
  - `https://*.amplifyapp.com`
- אם מוסיפים דומיין פרודקשן – להוסיף אותו ל-`allowedOrigins`.

---

## 6. Build לעומת Dev

| מצב | לוקלי | ענן |
|-----|--------|-----|
| **הרצה** | `npm run dev` (Vite dev server) | `npm run build` + הגשת `dist/` |
| **Routing** | אותו React Router – אין הבדל. |
| **Imports** | אותו alias `@/` ב-`vite.config.ts`. |

אם יש באג רק ב-production – לבדוק lazy loading, dynamic imports, ו-`import.meta.env`.

---

## 7. Case sensitivity (Windows מול Linux)

- **Windows:** קבצים לא רגישים לאות גדולה/קטנה.
- **Build בענן (Linux):** רגיש לאותיות.

למשל:

- `import Header from './components/header'` כשהקובץ הוא `Header.tsx` – עלול לעבוד לוקלית ולהיכשל ב-build.

**המלצה:** להשתמש בשמות קבצים שתואמים בדיוק ל-import (כולל אות ראשית גדולה).

---

## 8. Amplify Hosting – rewrite rules

- באפליקציית SPA עם React Router יש לרוב כלל: כל בקשת דף מנותבת ל-`index.html`.
- ב-Amplify Hosting זה מוגדר בדרך כלל אוטומטית ל-SPA. אם לא – להוסיף rewrite ל-`/index.html` ל-path `/`.

---

## סיכום מהיר לוקלי

1. להריץ `npx ampx sandbox` (או להבטיח ש-`amplify_outputs.json` קיים ומעודכן).
2. להריץ `npm run dev` ולפתוח `http://localhost:5173`.
3. אם Auth לא עובד – לבדוק ב-Cognito ש-`http://localhost:5173` ב-callback/sign-out URLs.
4. אם יש משתני סביבה בענן – להגדיר אותם לוקלית (למשל ב-`.env.local` ו-`VITE_*`).
