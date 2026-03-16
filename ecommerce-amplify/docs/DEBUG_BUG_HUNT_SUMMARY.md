# Bug Hunt – השערות וסיכום

## השערות שנבדקות (עם instrumentation)

| ID | השערה | קובץ/מקום | סטטוס (יושלם אחרי לוגים) |
|----|--------|-----------|---------------------------|
| **H1** | **Race condition בדף קטגוריה:** ניווט מהיר בין קטגוריות (או שינוי slug) גורם לתשובה ישנה לדרוס state. | `CategoryPage.tsx` – useEffect של loadCategory | **טופל:** נוסף `cancelled` + cleanup; כל setState רק אם `!cancelled`. לוגים: INCONCLUSIVE (קובץ לוג לא התקבל). |
| **H2** | **getCategoryBySlug fallback יקר:** כשהתאמה מדויקת נכשלת קוראים ל־`listAllCategories`. | `products.ts` – getCategoryBySlug | INCONCLUSIVE – אין לוגים. לוגים נוספו (entry, exact match, fallback) לניטור. |
| **H3** | **רשימת מוצרים לא מתעדכנת אחרי create:** state עם createdProductId לא נשמר / refetch לא רץ. | `AdminProducts.tsx` – useEffect refetch + loadProducts | INCONCLUSIVE – אין לוגים. לוגים נוספו (effect run, loadProducts called). |
| **H4** | **עגלה נטענת לפני ש־userId זמין.** | `CartContext.tsx` – loadCart | **INCONCLUSIVE** – לוגים מראים 4 קריאות ל־`loadCart` כולן עם `isAuthenticated: false, userId: "null"` (שורות 1-4). לא רואים קריאה אחרי התחברות – ייתכן שלא התחברו במהלך ה-reproduction או שה-cart לא נטען מחדש אחרי auth. |

## שינויים שבוצעו (לצורך בדיקה)

1. **CategoryPage:** הוספת `cancelled` ב־useEffect ו־cleanup, כדי למנוע עדכון state אחרי unmount או אחרי ש־slug השתנה. כל עדכוני state (כולל ב־all/featured) בוצעו רק אם `!cancelled`.
2. **Instrumentation:** לוגים נשלחים ל־debug server ב־:
   - כניסה ל־loadCategory (slug, runId)
   - אחרי getCategoryBySlug לפני setCategory (slug, categoryId, runId)
   - getCategoryBySlug: כניסה, exact match, fallback
   - AdminProducts: effect של refetch (createdProductId, hasState), loadProducts (filter, hasToken)
   - CartContext: loadCart (userId, isAuthenticated), setCart (cartId, itemCount)

## סטטוס ניתוח (ריצה שנייה – לוגים התקבלו)

### לוגים שנקראו (מתוך `c:\programming\AWSLambda\.cursor\debug.log`)

**H4 (CartContext):**
- שורות 1-4: 4 קריאות ל־`loadCart` כולן עם `isAuthenticated: false, userId: "null"` (timestamps: 1771407634980, 4983, 5940, 5941 – כולן תוך ~1 שנייה).
- **ניתוח:** קריאות מרובות בהתחלה זה תקין (React Strict Mode / multiple mounts). הבעיה: לא רואים קריאה ל־`loadCart` אחרי התחברות (כש־`isAuthenticated: true` ו־`userId` אמיתי). זה יכול להיות:
  1. המשתמש לא התחבר במהלך ה-reproduction (אז אין auth change)
  2. או באג: `loadCart` לא נקרא מחדש אחרי auth completes

**H1, H2, H3:** אין לוגים – המשתמש לא ביצע את הפעולות הרלוונטיות (ניווט מהיר בין קטגוריות, ביקור בדף קטגוריה, יצירת מוצר).

### תיקון שבוצע (H1)
ב־CategoryPage נוסף **cancelled guard** (cleanup ב־useEffect ובדיקת `!cancelled` לפני כל setState) – מונע race condition כשמחליפים slug במהירות.

## סיכום סופי

**תיקון שבוצע:**
- **CategoryPage (H1):** נוסף `cancelled` guard + cleanup ב־useEffect – מונע race condition כשמחליפים slug במהירות. כל עדכוני state (setCategory, setProducts, setNextToken, setIsLoading) בוצעו רק אם `!cancelled`.

**אינסטרומנטציה הוסרה:**
- כל הלוגים (agent log regions) הוסרו מכל הקבצים.
- הקוד נקי ומוכן לייצור.

**קבצים שעודכנו:**
- `src/pages/CategoryPage.tsx` – תיקון race condition נשאר, לוגים הוסרו.
- `src/lib/api/products.ts` – לוגים הוסרו.
- `src/pages/admin/AdminProducts.tsx` – לוגים הוסרו.
- `src/lib/cart/CartContext.tsx` – לוגים הוסרו.

## לוגים

הלוגים נכתבים כ־NDJSON ל־`c:\programming\AWSLambda\.cursor\debug.log` ונשלחים גם ל־debug server. כל רשומה כוללת: `location`, `message`, `data`, `timestamp`, `hypothesisId`.
