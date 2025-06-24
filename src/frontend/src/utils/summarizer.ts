
export function summarizeText(text: string): string {
  // This is a simplified summarization algorithm
  // In a real application, you might use AI/ML or more complex NLP
  
  // Split the text into sentences
  const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [];
  
  // If the text is already short, return it
  if (sentences.length <= 3) {
    return text;
  }
  
  // For this demo, we'll just take the first 3-4 sentences
  // which often contain the most important information in news articles
  const summary = sentences.slice(0, 4).join(' ');
  
  return summary;
}
