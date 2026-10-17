# Cyber Cafe Backend — Setup (10 मिनट, सिर्फ एक बार)

यह backend तुम्हारे **खुद के Gmail** से OTP भेजेगा और सारा डेटा **तुम्हारी Google Sheet** में रहेगा। Free, कोई monthly खर्चा नहीं।

## Steps

1. फ़ोन/PC में खोलो → **script.google.com** → अपने Gmail से login करो
2. **"New project"** (नई परियोजना) पर दबाओ
3. खुले हुए editor में पुराना code (`function myFunction...`) **मिटा दो**
4. इस फ़ोल्डर की **Code.gs** फ़ाइल का पूरा code **paste** कर दो
5. ऊपर **💾 Save** दबाओ, फिर **Deploy → New deployment**
6. ⚙️ gear icon → type चुनो **"Web app"**
7. Execute as: **Me** · Who has access: **Anyone**
8. **Deploy** दबाओ → Google permission माँगेगा → **Allow** करो (सिर्फ email भेजने + Sheet बनाने की permission है)
9. मिला हुआ **Web app URL** (https://script.google.com/macros/s/...../exec) **copy करके मुझे (agent को) भेज दो** — मैं site config में लगा दूँगा, बस! OTP system LIVE ✅

## Admin Report (users + किसने क्या किया)

ब्राउज़र में खोलो: `तुम्हारा_SCRIPT_URL?admin=sanskriti786`
(password Code.gs में `ADMIN_KEY` से बदल सकते हो)

## Notes

- OTP 10 मिनट valid रहता है
- पहली बार email भेजने पर Google security check कर सकता है — Allow कर देना
- रोज़ ~100 emails तक free (Gmail limit) — शुरुआत के लिए काफ़ी
