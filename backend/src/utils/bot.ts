import natural from 'natural';
import * as math from 'mathjs';

const tokenizer = new natural.WordTokenizer();

// Knowledge base for the bot
const conversationRules: { pattern: string[], responses: string[] }[] = [
  {
    pattern: ['hello', 'hi', 'hey', 'greetings'],
    responses: [
      "Hello friend! How is your day going?",
      "Hi there! Ready to tap some Morse code?",
      "Greetings! It's typical wonderful weather in the digital world today."
    ]
  },
  {
    pattern: ['how', 'are', 'you'],
    responses: [
      "I'm engaging in some deep thought processing. How about you?",
      "I'm feeling connected! .. - ... / --. --- --- -..",
      "Functioning perfectly and happy to chat with you!"
    ]
  },
  {
    pattern: ['name', 'who'],
    responses: [
      "I am MorseBot, your friendly neighborhood coding companion.",
      "Call me MorseBot. I live in the server.",
      "I'm just a bot standing in front of a user, asking them to learn Morse code."
    ]
  },
  {
    pattern: ['sad', 'bored', 'tired', 'unhappy', 'lonely'],
    responses: [
      "I'm sorry to hear that. Coding (and Morse) always cheers me up!",
      " sending virtual hugs... ",
      "Why do you feel that way? You can tell me.",
      "Maybe take a break and listen to some music? Or some soothing 800Hz sine waves?"
    ]
  },
  {
    pattern: ['happy', 'excited', 'good', 'great', 'awesome'],
    responses: [
      "That is wonderful news! Keep that energy up!",
      "Fantastic! Happiness is contagious, even over sockets.",
      "Yay! Let's celebrate with some high-speed Morse practice."
    ]
  }
];

const scienceFacts: Record<string, string> = {
    'gravity': "Gravity is the force by which a planet or other body draws objects toward its center. On Earth, it's 9.8 m/s².",
    'speed of light': "The speed of light in vacuum is approximately 299,792,458 meters per second.",
    'dna': "DNA (Deoxyribonucleic acid) is the molecule that carries genetic information for the development and functioning of an organism.",
    'photosynthesis': "Photosynthesis is the process used by plants to convert light energy into chemical energy.",
    'atom': "An atom is the smallest unit of ordinary matter that forms a chemical element.",
    'water': "Water (H2O) is a clear, colorless, odorless, and tasteless liquid essential for most plant and animal life.",
    'earth': "Earth is the third planet from the Sun and the only astronomical object known to harbor life.",
    'sun': "The Sun is the star at the center of the Solar System. It converts hydrogen into helium via nuclear fusion.",
    'moon': "The Moon is Earth's only natural satellite.",
    'pi': "Pi is the ratio of a circle's circumference to its diameter, approx 3.14159."
};

const fallbacks = [
  "That's interesting! Tell me more.",
  "I see. How does that make you feel?",
  "Really? I never thought of it that way.",
  "I'm listening. Go on.",
  "I can do math too! Try 'calculate 5 * 10' or ask me about 'gravity'."
];

export const getBotReply = async (text: string): Promise<string> => {
  const lower = text.toLowerCase();
  
  // 1. Math Calculation using mathjs
  const mathRegex = /(\d+[\+\-\*\/\^%]\d+)|(sqrt|sin|cos|tan|log)\(.*\)|(\d+\s*[\+\-\*\/\^%]\s*\d+)/;
  
  // Explicit commands
  if (lower.startsWith('calculate') || lower.startsWith('calc') || lower.startsWith('solve')) {
      try {
          const expression = lower.replace(/calculate|calc|solve/g, '').trim();
          const result = math.evaluate(expression);
          return `The answer is ${result}`;
      } catch (e) {
         // fall through
      }
  }

  // Implicit "what is..." math questions
  const implicitMatch = lower.match(mathRegex);
  if (lower.includes('answer of') || (implicitMatch && lower.includes('what is'))) {
      try {
          let potentialExpr = "";
          if (implicitMatch) {
              potentialExpr = implicitMatch[0];
          } else {
              const match = lower.match(/[\d\.\+\-\*\/\(\)\^% e\s]{3,}/);
              if (match) potentialExpr = match[0];
          }
          potentialExpr = potentialExpr.trim();
          if (potentialExpr && (/\d/.test(potentialExpr) || /(sqrt|sin|cos|tan|log)/.test(potentialExpr))) {
             const result = math.evaluate(potentialExpr);
             return `The answer is ${result}`;
          }
      } catch (e) {
          // Ignore
      }
  }

  // 2. Encyclopedia / Dictionary (External API)
  // Look for "define X", "what is X", "definition of X"
  if (lower.startsWith('define') || lower.includes('what is') || lower.includes('meaning of') || lower.includes('definition of')) {
      // Extract word
      let word = "";
      if (lower.startsWith('define')) word = lower.replace('define', '').trim();
      else if (lower.includes('what is')) word = lower.replace('what is', '').trim();
      else if (lower.includes('meaning of')) word = lower.replace('meaning of', '').trim();
      else if (lower.includes('definition of')) word = lower.replace('definition of', '').trim();

      // Cleanup punctuation
      word = word.replace(/[?.,!]/g, '');
      
      // Filter out common stop words if "what is a X"
      word = word.replace(/^(a|an|the)\s+/i, '');

      if (word && word.length > 1 && !word.match(/^[\d\s\+\-\*\/]+$/)) { // Don't try to define numbers/math
          try {
              const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
              if (response.ok) {
                  const data = await response.json();
                  if (data && data.length > 0 && data[0].meanings && data[0].meanings.length > 0) {
                      const definition = data[0].meanings[0].definitions[0].definition;
                      return `Definition of ${word}: ${definition}`;
                  }
              }
          } catch (e) {
              console.error("Dictionary API error:", e);
          }
      }
  }

  // 3. Science Knowledge Base (Fallback)
  for (const [topic, fact] of Object.entries(scienceFacts)) {
      if (lower.includes(topic)) {
          return fact;
      }
  }

  // 4. Utility commands
  if (lower.includes('time')) return "It is currently " + new Date().toLocaleTimeString();
  if (lower.includes('date')) return "Today is " + new Date().toLocaleDateString();

  // 5. Tokenize and Fuzzy Match conversational rules
  const tokens = tokenizer.tokenize(lower);
  let bestMatch = { score: 0, responses: fallbacks };

  for (const rule of conversationRules) {
    let score = 0;
    rule.pattern.forEach(keyword => {
      if (tokens.includes(keyword) || lower.includes(keyword)) score++;
    });
    
    if (rule.pattern.length > 2 && lower.includes(rule.pattern.join(' '))) {
        score += 5;
    }

    if (score > bestMatch.score) {
      bestMatch = { score, responses: rule.responses };
    }
  }

  // 6. Return random response
  if (bestMatch.score > 0) {
    return bestMatch.responses[Math.floor(Math.random() * bestMatch.responses.length)];
  }

  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
};
