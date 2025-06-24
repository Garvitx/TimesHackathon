import { detect as ldDetect } from 'langdetect';

const scriptRanges = {
  // Devanagari scripts (Hindi, Marathi, Nepali)
  hi: /[\u0900-\u097F]/g,   // Devanagari
  mr: /[\u0900-\u097F]/g,   // Marathi (also Devanagari)
  ne: /[\u0900-\u097F]/g,   // Nepali (also Devanagari)
  
  // Other Indian scripts
  bn: /[\u0980-\u09FF]/g,   // Bengali
  gu: /[\u0A80-\u0AFF]/g,   // Gujarati
  pa: /[\u0A00-\u0A7F]/g,   // Gurmukhi (Punjabi)
  ta: /[\u0B80-\u0BFF]/g,   // Tamil
  te: /[\u0C00-\u0C7F]/g,   // Telugu
  kn: /[\u0C80-\u0CFF]/g,   // Kannada
  ml: /[\u0D00-\u0D7F]/g,   // Malayalam
  or: /[\u0B00-\u0B7F]/g,   // Odia
  
  // Arabic script (Urdu, Arabic)
  ur: /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g,
  ar: /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g,
  
  // Chinese scripts
  zh: /[\u4E00-\u9FFF\u3400-\u4DBF]/g,  // CJK Unified Ideographs
  
  // Japanese scripts
  ja: /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/g,  // Hiragana, Katakana, Kanji
  
  // Korean
  ko: /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/g,  // Hangul
  
  // Thai
  th: /[\u0E00-\u0E7F]/g,
  
  // Myanmar
  my: /[\u1000-\u109F]/g,
  
  // Khmer
  km: /[\u1780-\u17FF]/g
};

// Common Hindi words for better Devanagari disambiguation
const hindiWords = [
  'और', 'का', 'की', 'के', 'में', 'से', 'को', 'है', 'हैं', 'था', 'थी', 'थे',
  'कि', 'यह', 'वह', 'इस', 'उस', 'एक', 'दो', 'तीन', 'आप', 'हम', 'तुम',
  'क्या', 'कैसे', 'कहाँ', 'कब', 'क्यों', 'जो', 'जा', 'आना', 'जाना'
];

const marathiWords = [
  'आणि', 'च्या', 'ची', 'चे', 'मध्ये', 'पासून', 'ला', 'आहे', 'आहेत', 'होता', 'होती', 'होते',
  'की', 'हा', 'तो', 'या', 'त्या', 'एक', 'दोन', 'तीन', 'तुम्ही', 'आम्ही', 'तू'
];

const nepaliWords = [
  'र', 'को', 'की', 'का', 'मा', 'बाट', 'लाई', 'छ', 'छन्', 'थियो', 'थिई', 'थिए',
  'कि', 'यो', 'त्यो', 'यस', 'त्यस', 'एक', 'दुई', 'तीन', 'तपाईं', 'हामी', 'तिमी'
];

// Urdu vs Arabic distinction words
const urduWords = [
  'اور', 'کا', 'کی', 'کے', 'میں', 'سے', 'کو', 'ہے', 'ہیں', 'تھا', 'تھی', 'تھے',
  'کہ', 'یہ', 'وہ', 'اس', 'اُس', 'ایک', 'دو', 'تین', 'آپ', 'ہم', 'تم'
];

function normalizeText(text) {
  // Remove extra whitespace, numbers, punctuation for better analysis
  return text.replace(/[0-9\s\p{P}]+/gu, ' ').trim();
}

function calculateScriptDensity(text, regex) {
  const scriptChars = (text.match(regex) || []).length;
  const totalChars = text.replace(/\s/g, '').length;
  return totalChars > 0 ? scriptChars / totalChars : 0;
}

function detectDevanagariLanguage(text) {
  const normalizedText = normalizeText(text);
  
  // Count word matches for each language
  const hindiMatches = hindiWords.filter(word => 
    normalizedText.includes(word)
  ).length;
  
  const marathiMatches = marathiWords.filter(word => 
    normalizedText.includes(word)
  ).length;
  
  const nepaliMatches = nepaliWords.filter(word => 
    normalizedText.includes(word)
  ).length;
  
  // Return language with most matches, default to Hindi
  if (marathiMatches > hindiMatches && marathiMatches > nepaliMatches) {
    return 'mr';
  } else if (nepaliMatches > hindiMatches && nepaliMatches > marathiMatches) {
    return 'ne';
  }
  return 'hi'; // Default to Hindi for Devanagari
}

function detectArabicScript(text) {
  const normalizedText = normalizeText(text);
  
  const urduMatches = urduWords.filter(word => 
    normalizedText.includes(word)
  ).length;
  
  // Simple heuristic: if we find Urdu words, it's likely Urdu
  // Otherwise, default to Arabic
  return urduMatches > 2 ? 'ur' : 'ar';
}

export function detectLanguage(text) {
  if (!text || text.trim().length < 10) {
    return 'en'; // Default for very short text
  }
  
  const normalizedText = normalizeText(text);
  const textLength = normalizedText.replace(/\s/g, '').length;
  
  // Minimum threshold for script detection (lowered for better sensitivity)
  const SCRIPT_THRESHOLD = 0.05; // 5% of characters need to be from the script
  
  // 1) Check each script with density calculation
  for (const [lang, regex] of Object.entries(scriptRanges)) {
    const density = calculateScriptDensity(text, regex);
    
    if (density > SCRIPT_THRESHOLD) {
      // Special handling for scripts used by multiple languages
      if (lang === 'hi' && density > 0.1) { // Higher threshold for Devanagari
        return detectDevanagariLanguage(text);
      } else if (lang === 'ur' && density > 0.1) {
        return detectArabicScript(text);
      } else if (!['mr', 'ne', 'ar'].includes(lang)) {
        // Return non-ambiguous scripts directly
        return lang;
      }
    }
  }
  
  // 2) Fallback to langdetect library with error handling
  try {
    const result = ldDetect(text);
    
    if (Array.isArray(result) && result.length > 0) {
      // Take the highest confidence result
      const bestMatch = result[0];
      
      // Only trust high-confidence results
      if (bestMatch.prob > 0.7) {
        return bestMatch.lang;
      }
      
      // For lower confidence, check if it's a supported language
      const supportedLangs = ['en', 'hi', 'bn', 'ta', 'te', 'gu', 'kn', 'ml', 'pa', 'or', 'ur', 'ar', 'zh', 'ja', 'ko', 'th', 'my', 'km'];
      if (supportedLangs.includes(bestMatch.lang)) {
        return bestMatch.lang;
      }
    } else if (typeof result === 'string') {
      return result;
    }
  } catch (error) {
    console.warn('Language detection fallback failed:', error.message);
  }
  
  // 3) Final fallback: check for Latin script vs others
  const latinChars = (text.match(/[a-zA-Z]/g) || []).length;
  const latinDensity = latinChars / textLength;
  
  if (latinDensity > 0.7) {
    return 'en'; // Likely English or another Latin-script language
  }
  
  // 4) Ultimate fallback
  return 'en';
}

// Export for compatibility with existing code
export default { detect: detectLanguage };

// Test function to validate detection
export function testLanguageDetection() {
  const testCases = [
    { text: 'This is a test sentence in English.', expected: 'en' },
    { text: 'यह एक परीक्षण वाक्य है। भारत एक विविधताओं से भरपूर देश है।', expected: 'hi' },
    { text: 'এটি একটি পরীক্ষা বাক্য। বাংলাদেশ দক্ষিণ এশিয়ার একটি দেশ।', expected: 'bn' },
    { text: 'இது ஒரு சோதனை வாக்கியம். தமிழ்நாடு இந்தியாவின் ஒரு மாநிலம்.', expected: 'ta' },
    { text: 'ਇਹ ਇਕ ਟੈਸਟ ਵਾਕ ਹੈ। ਪੰਜਾਬ ਇੱਕ ਸੁੰਦਰ ਰਾਜ ਹੈ।', expected: 'pa' },
    { text: 'یہ ایک ٹیسٹ جملہ ہے۔ پاکستان جنوبی ایشیا کا ایک ملک ہے۔', expected: 'ur' },
    { text: 'हे एक चाचणी वाक्य आहे. महाराष्ट्र हा भारताचा एक राज्य आहे.', expected: 'mr' },
  ];
  
  console.log('Language Detection Test Results:');
  console.log('================================');
  
  testCases.forEach(({ text, expected }) => {
    const detected = detectLanguage(text);
    const status = detected === expected ? '✅' : '❌';
    console.log(`${status} Expected: ${expected}, Got: ${detected}`);
    console.log(`   Text: ${text.substring(0, 50)}...`);
    console.log();
  });
}