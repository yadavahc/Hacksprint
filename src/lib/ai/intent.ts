import type { Entities, Intent, IntentResult, Lang } from "@/lib/agents/types";
import { daysUntilWeekday } from "@/lib/cashflow/cashflow";

// Deterministic multilingual intent detection (English, Hindi/Hinglish, Kannada/Kanglish).
// An LLM (Groq / Gemini) is used on top of this only when rules are unsure and a key is configured.

const KN_WORDS = /\b(nanna|nimma|nanage|nange|yaake|yake|yaavaga|yavaga|eshtu|estu|ide|idhe|iddina|iddeena|maadu|madu|kotre|kottre|kottare|enagutte|enaagutte|enagatte|mugiyutte|mugiyuthe|hana|duddu|nijavaagi|nijavagi|kodbeku|kodtini|kodthini|kodtheeni|prati|prathi|tingalu|aagide|agide|kadime|vaara|beku|illa|hegide|saala|haudu|howdu|sari|beda|inda|alli|maadthini|baralilla|ondu|yaaru)\b|-ge\b|\baa\?/i;
const HI_WORDS = /\b(kyun|kyon|kyu|kitna|kitne|kitni|mera|meri|mere|hai|hain|hua|hui|karo|dena|dene|hoga|kya|paisa|paise|kab|khatam|nahi|mahine|grahak|bikri|dukaan|chahiye|batao|agar|hafte|abhi)\b/i;

export function detectLanguage(text: string, fallback: Lang = "kn"): { lang: Lang; strong: boolean } {
  if (/[ಀ-೿]/.test(text)) return { lang: "kn", strong: true };
  if (/[ऀ-ॿ]/.test(text)) return { lang: "hi", strong: true };
  const kn = (text.match(new RegExp(KN_WORDS.source, "gi")) ?? []).length;
  const hi = (text.match(new RegExp(HI_WORDS.source, "gi")) ?? []).length;
  if (kn > 0 && kn >= hi) return { lang: "kn", strong: true };
  if (hi > 0) return { lang: "hi", strong: true };
  if (/[a-z]/i.test(text)) return { lang: "en", strong: text.trim().split(/\s+/).length >= 3 };
  return { lang: fallback, strong: false };
}

const AMOUNT = /(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d+)?)|([\d,]+(?:\.\d+)?)\s*(?:rupees|rupaye|rupayi|rs\b)/i;
const QUANTITY = /(\d+)\s*(pieces|piece|pcs|packets|packet|units|nos|bags|items)/i;
const WEEKDAYS: [RegExp, number, string][] = [
  [/\b(sunday|bhanuvara|ravivara?|ravivaar)\b/i, 0, "Sunday"],
  [/\b(monday|somavara|somvaar|somvar)\b/i, 1, "Monday"],
  [/\b(tuesday|mangalavara|mangalvar)\b/i, 2, "Tuesday"],
  [/\b(wednesday|budhavara|budhvar)\b/i, 3, "Wednesday"],
  [/\b(thursday|guruvara|guruvar)\b/i, 4, "Thursday"],
  [/\b(friday|shukravara|shukravar)\b/i, 5, "Friday"],
  [/\b(saturday|shanivara|shanivar)\b/i, 6, "Saturday"],
];

export function extractEntities(text: string): Entities {
  const e: Entities = {};
  const amount = text.match(AMOUNT);
  if (amount) e.amount = Number((amount[1] ?? amount[2]).replace(/,/g, ""));
  const qty = text.match(QUANTITY);
  if (qty) e.quantity = Number(qty[1]);

  for (const [re, day, label] of WEEKDAYS) {
    if (re.test(text)) {
      e.dueInDays = daysUntilWeekday(day);
      e.dayLabel = label;
    }
  }
  if (/\b(tomorrow|naale|nale)\b/i.test(text)) {
    e.dueInDays = 1;
    e.dayLabel = "tomorrow";
  }
  if (/(every month|monthly|prati tingalu|prathi tingalu|tingalige|har mahine|per month)/i.test(text)) e.recurring = true;

  if (/(rent|baadige|badige|kiraya|kiraaya)/i.test(text)) e.obligationKind = "rent";
  else if (/(salary|sambala|sambla|tankha|wages)/i.test(text)) e.obligationKind = "salary";
  else if (/(supplier|distributor|vendor|wholesale|agenc)/i.test(text)) e.obligationKind = "supplier";
  else if (/(electricity|bescom|light bill|internet|recharge)/i.test(text)) e.obligationKind = "bill";

  if (/discount/i.test(text)) e.offerType = "storewide";
  else if (/(offer|coupon|cashback|win-?back)/i.test(text)) e.offerType = "winback";

  if (/(refund|kyc|whatsapp)/i.test(text)) e.qrId = "qr-refund";
  else if (/\bsai\b/i.test(text)) e.qrId = "qr-sai";
  else if (/manjunatha/i.test(text)) e.qrId = "qr-manjunatha";

  if (/\bsai\b/i.test(text)) e.beneficiaryId = "b-sai";
  else if (/manjunatha/i.test(text)) e.beneficiaryId = "b-manjunatha";
  else if (/karthik|35,?700/i.test(text)) e.beneficiaryId = "b-karthik";

  if (amount && e.quantity !== undefined) {
    const before = text.slice(0, amount.index).replace(/^\s*(ee|this|yeh|ye|add|new|hosa)\s+/i, "");
    const name = before.replace(/[,.:;!?-]+$/g, "").replace(/\b(price|is|for|at|bele|daam|catalog-?ge|add maadu)\b/gi, "").trim();
    if (name) e.productName = name.replace(/\s+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return e;
}

type Rule = { intent: Intent; confidence: number; test: (t: string, e: Entities) => boolean };

const RULES: Rule[] = [
  { intent: "qr_safety", confidence: 0.93, test: (t) => /\bqr\b|scanner|scan cheyy|scan maad/i.test(t) },
  { intent: "beneficiary_check", confidence: 0.9, test: (t) => /(beneficiary|recipient|payee|transfer gate|karthik|send money|check (the )?(account|upi|recipient)|hana kalis|paise bhej)/i.test(t) },
  { intent: "mandate_risk", confidence: 0.9, test: (t) => /(mandate|auto\s?pay|autopay|\bemi\b|\bnach\b|recurring payment)/i.test(t) },
  { intent: "invoice_update", confidence: 0.91, test: (t) => /(invoice|purchase bill|bill photo)/i.test(t) },
  { intent: "catalog_add", confidence: 0.88, test: (t, e) => /(catalog|catalogue|online store|digital store|storefront)/i.test(t) || (e.amount !== undefined && e.quantity !== undefined) },
  {
    intent: "add_obligation",
    confidence: 0.88,
    test: (t, e) =>
      e.amount !== undefined &&
      (/(kodbeku|kodtini|kodthini|kodtheeni|kodbekide|dena hai|dena hoga|deni hai|dene hai|have to pay|need to pay|i pay|must pay|due on|promised|obligation)/i.test(t) || (!!e.obligationKind && !/(offer|discount)/i.test(t))),
  },
  { intent: "credit_readiness", confidence: 0.9, test: (t) => /(loan|credit|\bsaala\b|karza|karz|udhar|lender|working capital)/i.test(t) },
  { intent: "simulate_offer", confidence: 0.9, test: (t, e) => /(offer|discount|coupon|cashback)/i.test(t) && (/(kotre|kottare|kottre|kodri|dene|diya|give|what if|enagutte|enaagutte|kya hoga|happen|simulate|if i)/i.test(t) || e.amount !== undefined) },
  { intent: "simulate_offer", confidence: 0.8, test: (t) => /(what if|what-if|simulate|simulation)/i.test(t) },
  { intent: "campaign_status", confidence: 0.88, test: (t) => /campaign/i.test(t) && /(status|result|hegide|kaisa|progress|how is|how's|performance|report|track|roi)/i.test(t) },
  { intent: "create_campaign", confidence: 0.86, test: (t) => /(campaign|win-?back|plan)/i.test(t) && /(create|start|launch|maadu|madu|shuru|karo|run|send|see|show|nodu|dikhao|approve)/i.test(t) },
  { intent: "stock_runout", confidence: 0.9, test: (t) => /(stock|inventory|\bmaal\b|saamaan|samaan|reorder|restock|run out|khatam|mugiyutte)/i.test(t) },
  { intent: "cash_available", confidence: 0.9, test: (t) => /(\bhana\b|duddu|paisa|paise|money|\bcash\b|balance|funds|available)/i.test(t) },
  { intent: "sales_decline", confidence: 0.92, test: (t) => /(sales|\bsale\b|revenue|vyapara|vyapaar|bikri|business|dhanda)/i.test(t) && /(kadime|kammi|\bkam\b|down|drop|less|low|fall|kuse|yaake|yake|kyun|kyon|why)/i.test(t) },
  { intent: "customers_at_risk", confidence: 0.85, test: (t) => /(customer|grahak|giraki|regulars|churn|inactive|yaaru|who are)/i.test(t) },
  { intent: "sales_decline", confidence: 0.72, test: (t) => /(sales|\bsale\b|revenue|vyapara|bikri|business)/i.test(t) },
  { intent: "briefing", confidence: 0.8, test: (t) => /(good morning|hello|\bhi\b|namaskara|namaste|attention|briefing|vishesha|what's new|priorit|today)/i.test(t) },
  { intent: "help", confidence: 0.8, test: (t) => /(help|what can you|enu maadbahudu|kya kar sakte)/i.test(t) },
];

// Native-script keywords (e.g. from Sarvam transcripts) mapped to the romanised tokens rules use.
const SCRIPT_KEYWORDS: [string, string][] = [
  ["ಸೇಲ್ಸ್", "sales"], ["ವ್ಯಾಪಾರ", "vyapara"], ["ಕಡಿಮೆ", "kadime"], ["ಯಾಕೆ", "yaake"], ["ಸ್ಟಾಕ್", "stock"],
  ["ಮುಗಿಯುತ್ತೆ", "mugiyutte"], ["ಹಣ", "hana"], ["ದುಡ್ಡು", "duddu"], ["ಲೋನ್", "loan"], ["ಸಾಲ", "saala"], ["ಆಫರ್", "offer"],
  ["ಡಿಸ್ಕೌಂಟ್", "discount"], ["ಇನ್ವಾಯ್ಸ್", "invoice"], ["ಬಾಡಿಗೆ", "rent"], ["ಕೊಡಬೇಕು", "kodbeku"], ["ಕ್ಯಾಂಪೇನ್", "campaign"],
  ["ಗ್ರಾಹಕ", "customer"], ["ಕ್ಯೂಆರ್", "qr"],
  ["बिक्री", "bikri"], ["सेल्स", "sales"], ["कम", "kam"], ["क्यों", "kyun"], ["स्टॉक", "stock"], ["पैसा", "paisa"], ["पैसे", "paise"],
  ["लोन", "loan"], ["ऑफर", "offer"], ["डिस्काउंट", "discount"], ["किराया", "kiraya"], ["ग्राहक", "grahak"], ["इनवॉइस", "invoice"],
];

function normaliseScript(text: string) {
  let out = text;
  for (const [native, roman] of SCRIPT_KEYWORDS) if (out.includes(native)) out += ` ${roman}`;
  return out;
}

export function detectIntent(text: string, preferred: Lang = "kn"): IntentResult {
  const clean = normaliseScript(text.trim());
  const entities = extractEntities(clean);
  const { lang, strong } = detectLanguage(clean, preferred);
  const language = strong ? lang : preferred;
  for (const rule of RULES) {
    if (rule.test(clean, entities)) return { intent: rule.intent, confidence: rule.confidence, entities, language, source: "rules" };
  }
  return { intent: "help", confidence: 0.3, entities, language, source: "rules" };
}

export const APPROVE_RE = /^(yes|haudu|howdu|sari|ok|okay|approve|haan|ha|karo|confirm|go ahead|maadu|madi)\b/i;
export const CANCEL_RE = /^(no|beda|illa|cancel|nahi|mat|stop)\b/i;
