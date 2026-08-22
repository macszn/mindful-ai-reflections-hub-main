
export const quotes = [
  {
    text: "You don't have to control your thoughts. You just have to stop letting them control you.",
    author: "Dan Millman"
  },
  {
    text: "Mental health problems don't define who you are. They are something you experience.",
    author: "Matt Haig"
  },
  {
    text: "Self-care is how you take your power back.",
    author: "Lalah Delia"
  },
  {
    text: "You are not your illness. You have an individual story to tell.",
    author: "Julian Seifter"
  },
  {
    text: "Recovery is not one and done. It is a lifelong journey that takes place one day, one step at a time.",
    author: "Unknown"
  },
  {
    text: "What mental health needs is more sunlight, more candor, and more unashamed conversation.",
    author: "Glenn Close"
  },
  {
    text: "There is hope, even when your brain tells you there isn't.",
    author: "John Green"
  },
  {
    text: "You are valuable just because you exist. Not because of what you do or what you have done, but simply because you are.",
    author: "Max Lucado"
  },
  {
    text: "Happiness can be found even in the darkest of times, if one only remembers to turn on the light.",
    author: "Albus Dumbledore"
  },
  {
    text: "Just because no one else can heal or do your inner work for you doesn't mean you can, should, or need to do it alone.",
    author: "Lisa Olivera"
  },
  {
    text: "There is a crack in everything, that's how the light gets in.",
    author: "Leonard Cohen"
  },
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs"
  },
  {
    text: "Out of difficulties grow miracles.",
    author: "Jean de La Bruyère"
  },
  {
    text: "Start where you are. Use what you have. Do what you can.",
    author: "Arthur Ashe"
  },
  {
    text: "Although the world is full of suffering, it is also full of the overcoming of it.",
    author: "Helen Keller"
  },
  {
    text: "Sometimes when you're in a dark place you think you've been buried, but you've actually been planted.",
    author: "Christine Caine"
  },
  {
    text: "Hope is being able to see that there is light despite all of the darkness.",
    author: "Desmond Tutu"
  },
  {
    text: "You, yourself, as much as anybody in the entire universe, deserve your love and affection.",
    author: "Buddha"
  }
];

function utcDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function quoteIndexForDate(key: string, length: number) {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return hash % length;
}

/** Same quote the Home screen and quote notifications use for a given UTC day. */
export const getQuoteOfTheDay = (date = new Date()) => {
  const dateKey = utcDateKey(date);
  const quote = quotes[quoteIndexForDate(dateKey, quotes.length)];
  return { ...quote, date: dateKey };
};

export const getRandomQuote = () => getQuoteOfTheDay();
