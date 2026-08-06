const MOTIVATIONAL_QUOTES = [
  { text: 'Self-care is how you take your power back.', author: 'Lalah Delia' },
  { text: "There is hope, even when your brain tells you there isn't.", author: 'John Green' },
  {
    text: "You don't have to control your thoughts. You just have to stop letting them control you.",
    author: 'Dan Millman',
  },
  { text: 'Recovery is not one and done. It is a lifelong journey.', author: 'Unknown' },
  { text: 'You are valuable just because you exist.', author: 'Max Lucado' },
  {
    text: 'What mental health needs is more sunlight, more candor, and more unashamed conversation.',
    author: 'Glenn Close',
  },
];

function pickRandomQuote() {
  return MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
}

module.exports = { MOTIVATIONAL_QUOTES, pickRandomQuote };
