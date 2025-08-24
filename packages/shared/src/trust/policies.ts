// Forbidden words list (Romanian + English)
export const FORBIDDEN_WORDS_RO_EN = [
  // Romanian vulgarities
  "pula", "pizda", "fut", "futu", "futu-i", "futu-te", "futu-m-as",
  "cacat", "cacatul", "cacatului", "cacatul", "cacatului",
  "cur", "curul", "curului", "curule", "curulele",
  "muie", "muia", "muiei", "muia", "muiei",
  "pizda", "pizdei", "pizdele", "pizdelele",
  "sugi", "suge", "suge-o", "suge-l", "suge-le",
  "boul", "boii", "boii", "boii", "boii",
  "prost", "prostul", "prostului", "prostule", "prostulele",
  "idiot", "idiotul", "idiotului", "idiotule", "idiotulele",
  "cretin", "cretinul", "cretinului", "cretinule", "cretinulele",
  
  // English vulgarities
  "fuck", "fucking", "fucker", "fuckers", "fuckin",
  "shit", "shitting", "shitter", "shitters", "shitty",
  "bitch", "bitches", "bitching", "bitchy",
  "ass", "asshole", "assholes", "asshat", "asshats",
  "cock", "cocks", "cocky", "cocking",
  "dick", "dicks", "dickhead", "dickheads", "dicking",
  "pussy", "pussies", "pussying",
  "cunt", "cunts", "cunting",
  "whore", "whores", "whoring", "whorey",
  "slut", "sluts", "slutting", "slutty",
  
  // Spam indicators
  "buy now", "click here", "free money", "make money fast",
  "earn money", "work from home", "get rich quick",
  "weight loss", "diet pills", "viagra", "cialis",
  "casino", "poker", "betting", "gambling",
  "lottery", "prize", "winner", "won",
  "urgent", "limited time", "act now", "don't miss out",
  "exclusive", "secret", "hidden", "revealed",
  "miracle", "cure", "healing", "natural remedy",
  
  // Romanian spam
  "cumpara acum", "click aici", "bani gratis", "castiga bani rapid",
  "castiga bani", "lucreaza de acasa", "devino bogat rapid",
  "slabeste", "pastile dieta", "viagra", "cialis",
  "cazino", "poker", "pariuri", "jocuri de noroc",
  "loto", "premiu", "castigator", "castigat",
  "urgent", "timp limitat", "actioneaza acum", "nu rata",
  "exclusiv", "secret", "ascuns", "dezvăluit",
  "miracol", "vindecare", "sanare", "remediu natural"
];

// Content policy for nudity
export const ALLOWED_NUDITY_POLICY = {
  description: "Artistic nudity is allowed but must be marked as MATURE content. Explicit sexual content, graphic violence, and hate speech are prohibited.",
  allowed: [
    "artistic nudity",
    "classical art with nudity",
    "tasteful artistic photography",
    "educational content"
  ],
  prohibited: [
    "explicit sexual activity",
    "pornographic content",
    "graphic violence",
    "hate speech",
    "child exploitation",
    "non-consensual content"
  ]
};

// Text scoring function
export function scoreText(text: string): { 
  profanity: boolean; 
  links: boolean; 
  wordsHit: string[] 
} {
  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);
  
  const wordsHit: string[] = [];
  let profanity = false;
  let links = false;
  
  // Check for forbidden words
  for (const word of FORBIDDEN_WORDS_RO_EN) {
    if (lowerText.includes(word.toLowerCase())) {
      wordsHit.push(word);
      profanity = true;
    }
  }
  
  // Check for links
  const linkRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|bit\.ly\/[^\s]+|t\.co\/[^\s]+)/gi;
  if (linkRegex.test(text)) {
    links = true;
  }
  
  return {
    profanity,
    links,
    wordsHit
  };
}

// Trust score computation
export function computeTrustDelta(params: {
  reportClosed?: boolean;
  reportValid?: boolean;
  chargeback?: boolean;
  kycApproved?: boolean;
  onTimeShip?: boolean;
}): number {
  let delta = 0;
  
  if (params.reportClosed) {
    delta += 5; // Good: report was closed (false alarm)
  }
  
  if (params.reportValid) {
    delta -= 20; // Bad: report was valid
  }
  
  if (params.chargeback) {
    delta -= 30; // Bad: chargeback occurred
  }
  
  if (params.kycApproved) {
    delta += 10; // Good: KYC approved
  }
  
  if (params.onTimeShip) {
    delta += 5; // Good: shipped on time
  }
  
  return delta;
}

// Trust score bounds
export const TRUST_SCORE_MIN = 0;
export const TRUST_SCORE_MAX = 100;
export const TRUST_SCORE_INITIAL = 50;

// Trust score levels
export const TRUST_LEVELS = {
  EXCELLENT: { min: 80, label: "Excellent" },
  GOOD: { min: 60, label: "Good" },
  AVERAGE: { min: 40, label: "Average" },
  POOR: { min: 20, label: "Poor" },
  BANNED: { min: 0, label: "Banned" }
} as const;

export function getTrustLevel(score: number): keyof typeof TRUST_LEVELS {
  if (score >= 80) return "EXCELLENT";
  if (score >= 60) return "GOOD";
  if (score >= 40) return "AVERAGE";
  if (score >= 20) return "POOR";
  return "BANNED";
}
