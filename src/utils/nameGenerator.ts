export const ADJECTIVES = [
  'Cosmic',
  'Playful',
  'Dancing',
  'Happy',
  'Wandering',
  'Mystic',
  'Golden',
  'Silent',
  'Bold',
  'Bright',
  'Gentle',
  'Wild',
  'Dreamy',
  'Eager',
  'Clever',
  'Brave',
  'Calm',
  'Misty',
  'Jolly',
  'Lucky',
];

export const NOUNS = [
  'Dolphin',
  'Coral',
  'Starfish',
  'Wave',
  'Breeze',
  'Canvas',
  'Sketch',
  'Dream',
  'Journey',
  'Valley',
  'Forest',
  'Ocean',
  'River',
  'Mountain',
  'Garden',
  'Voyage',
  'Melody',
  'Whale',
  'Turtle',
  'Panda',
];

export function generateRandomName(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adjective} ${noun}`;
}
