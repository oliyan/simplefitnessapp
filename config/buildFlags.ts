// Switches that can differ between builds. The open-source app has everything on; a private
// build (for one person) can turn parts off without touching the screens.
export const BUILD = {
  showAiSettings: true, // Settings: API key, spending limit, training profile, body-scan import
  showPersonaliseSettings: true, // Settings: name, greeting, dedication and notes
  showAiPlanGenerator: true, // "Generate a plan with AI" buttons
  mentionAi: true, // wording that names the AI coach (welcome text, empty states)
  firstSessionAdvice: false, // also write a short note for a workout with no history yet
  coachVoice: '', // extra instructions on how the advice should sound (empty: the plain coach voice)
};
