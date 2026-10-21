// House text rules for anything the AI writes.

// No em or en dashes anywhere in the app. A range like 30–45 becomes 30-45, anything else a plain hyphen.
export const stripDashes = (text: string): string =>
  text
    .replace(/(\d)\s*[\u2013\u2014]\s*(\d)/g, '$1-$2')
    .replace(/\s*[\u2013\u2014]\s*/g, ' - ');

// Hindi words are never wanted in the advice (Tamil, Tanglish or English are fine). A short list of the
// common ones is enough to catch a slip.
const HINDI_WORDS =
  /\b(mera|meri|mere|tum|tumhara|tumhari|tumse|aap|aapka|beta|beti|jaan|jaanu|pyaar|pyar|bahut|accha|achha|acha|shabash|shabaash|chalo|yaar|bilkul|zaroor|kya|nahi|nahin|bhai|dost|ladki)\b/i;
export const mentionsHindi = (text: string): boolean => HINDI_WORDS.test(text);

// The least a form note may have. A working exercise needs real coaching; a one-set routine
// (warm-up, cardio, stretching) can be shorter because it is a list of steps.
export const MIN_NOTE_CHARS = 150;
export const MIN_ROUTINE_NOTE_CHARS = 40;
