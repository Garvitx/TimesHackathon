// test.js
import detector from './languageDetector.js';  // adjust the path

const samples = {
  english: 'This is a test sentence in English.',
  hindi: 'यह एक परीक्षण वाक्य है।',
  bengali: 'এটি একটি পরীক্ষা বাক্য।',
  tamil: 'இது ஒரு சோதனை வாக்கியம்.',
  punjabi: 'ਇਹ ਇਕ ਟੈਸਟ ਵਾਕ ਹੈ।',
  urdu: 'یہ ایک ٹیسٹ جملہ ہے۔',
  mixed: 'Hello नमस्ते 123',
};

for (const [lang, text] of Object.entries(samples)) {
  console.log(`${lang} →`, detector.detect(text));
}
