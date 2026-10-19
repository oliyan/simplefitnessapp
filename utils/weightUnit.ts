// The app only uses kilograms. A unit setting would silently change the meaning of every number
// already logged (and of a multi-week plan) the moment someone flipped it, so there isn't one.
export const WEIGHT_UNIT = 'kg';

// True when text talks about pounds, so an AI reply in the wrong unit can be caught.
// Matches "lb", "lbs", "lb." and "pound(s)", also glued to a number ("45lbs").
export const mentionsPounds = (text: string): boolean => /(\b|\d)(lbs?|pounds?)\b/i.test(text);
