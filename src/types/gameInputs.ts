/**
 * Per-game input definitions.
 * Each game has its own button set, default keybinds, and notation parser.
 */

export interface GameButton {
  id: string           // internal ID (e.g., 'punch', 'kick')
  label: string        // display label (e.g., 'P', 'K')
  name: string         // full name (e.g., 'Punch', 'Kick')
  color?: string       // optional color for display
}

export interface DirectionInput {
  id: string           // numpad notation (e.g., '2', '6', '236')
  label: string        // display (e.g., '↓', '→', '↓↘→')
  name: string         // full name (e.g., 'Down', 'Forward', 'Quarter Circle Forward')
  keys: string[]       // sequence of direction keys
}

export interface GameInputConfig {
  gameId: string
  buttons: GameButton[]
  directions: DirectionInput[]
  defaultKeyboard: Record<string, string>   // buttonId → key
  defaultDirections: Record<string, string> // directionId → key (for single dirs)
  defaultGamepad: Record<number, string>    // gamepad button → buttonId
}

// Direction notation → arrow display
export const NUMPAD_DIRECTIONS: Record<string, string> = {
  '1': '↙', '2': '↓', '3': '↘',
  '4': '←', '5': 'N', '6': '→',
  '7': '↖', '8': '↑', '9': '↗',
}

// Common direction motions
export const MOTION_INPUTS: Record<string, { label: string; name: string; sequence: string[] }> = {
  '236':  { label: '↓↘→', name: 'Quarter Circle Forward', sequence: ['2', '3', '6'] },
  '214':  { label: '↓↙←', name: 'Quarter Circle Back', sequence: ['2', '1', '4'] },
  '623':  { label: '→↓↘', name: 'Dragon Punch', sequence: ['6', '2', '3'] },
  '421':  { label: '←↓↙', name: 'Reverse Dragon Punch', sequence: ['4', '2', '1'] },
  '41236': { label: '←↓↘→', name: 'Half Circle Forward', sequence: ['4', '1', '2', '3', '6'] },
  '63214': { label: '→↓↙←', name: 'Half Circle Back', sequence: ['6', '3', '2', '1', '4'] },
  '632146': { label: '→↓↙←↓↘', name: '632146', sequence: ['6', '3', '2', '1', '4', '6'] },
  '236236': { label: '↓↘→↓↘→', name: 'Double QCF', sequence: ['2', '3', '6', '2', '3', '6'] },
  '214214': { label: '↓↙←↓↙←', name: 'Double QCB', sequence: ['2', '1', '4', '2', '1', '4'] },
  '360':  { label: '360°', name: 'Full Circle', sequence: ['6', '3', '2', '1', '4', '7', '8', '9'] },
  '720':  { label: '720°', name: 'Double Circle', sequence: ['6', '3', '2', '1', '4', '7', '8', '9', '6', '3', '2', '1', '4', '7', '8', '9'] },
  '28':   { label: '↓↑', name: 'Charge Down-Up', sequence: ['2', '8'] },
  '46':   { label: '←→', name: 'Charge Back-Forward', sequence: ['4', '6'] },
}

// ============ GAME CONFIGS ============

export const GAME_INPUTS: Record<string, GameInputConfig> = {
  // --- Guilty Gear Strive ---
  ggst: {
    gameId: 'ggst',
    buttons: [
      { id: 'P', label: 'P', name: 'Punch', color: '#3B82F6' },
      { id: 'K', label: 'K', name: 'Kick', color: '#22C55E' },
      { id: 'S', label: 'S', name: 'Slash', color: '#EAB308' },
      { id: 'HS', label: 'HS', name: 'Heavy Slash', color: '#EF4444' },
      { id: 'D', label: 'D', name: 'Dust', color: '#A855F7' },
    ],
    directions: [],
    defaultKeyboard: { P: 'j', K: 'k', S: 'l', HS: ';', D: 'u' },
    defaultDirections: { '2': 's', '4': 'a', '6': 'd', '8': 'w' },
    defaultGamepad: { 0: 'P', 1: 'K', 2: 'S', 3: 'HS', 4: 'D' },
  },

  // --- Guilty Gear Xrd / AC+R (same buttons) ---
  ggxrd: {
    gameId: 'ggxrd',
    buttons: [
      { id: 'P', label: 'P', name: 'Punch', color: '#3B82F6' },
      { id: 'K', label: 'K', name: 'Kick', color: '#22C55E' },
      { id: 'S', label: 'S', name: 'Slash', color: '#EAB308' },
      { id: 'HS', label: 'HS', name: 'Heavy Slash', color: '#EF4444' },
      { id: 'D', label: 'D', name: 'Dust', color: '#A855F7' },
    ],
    directions: [],
    defaultKeyboard: { P: 'j', K: 'k', S: 'l', HS: ';', D: 'u' },
    defaultDirections: { '2': 's', '4': 'a', '6': 'd', '8': 'w' },
    defaultGamepad: { 0: 'P', 1: 'K', 2: 'S', 3: 'HS', 4: 'D' },
  },

  ggacr: {
    gameId: 'ggacr',
    buttons: [
      { id: 'P', label: 'P', name: 'Punch', color: '#3B82F6' },
      { id: 'K', label: 'K', name: 'Kick', color: '#22C55E' },
      { id: 'S', label: 'S', name: 'Slash', color: '#EAB308' },
      { id: 'HS', label: 'HS', name: 'Heavy Slash', color: '#EF4444' },
      { id: 'D', label: 'D', name: 'Dust', color: '#A855F7' },
    ],
    directions: [],
    defaultKeyboard: { P: 'j', K: 'k', S: 'l', HS: ';', D: 'u' },
    defaultDirections: { '2': 's', '4': 'a', '6': 'd', '8': 'w' },
    defaultGamepad: { 0: 'P', 1: 'K', 2: 'S', 3: 'HS', 4: 'D' },
  },

  // --- Dragon Ball FighterZ ---
  dbfz: {
    gameId: 'dbfz',
    buttons: [
      { id: 'L', label: 'L', name: 'Light', color: '#3B82F6' },
      { id: 'M', label: 'M', name: 'Medium', color: '#EAB308' },
      { id: 'H', label: 'H', name: 'Heavy', color: '#EF4444' },
      { id: 'S', label: 'S', name: 'Special', color: '#22C55E' },
      { id: 'A1', label: 'A1', name: 'Assist 1', color: '#8B5CF6' },
      { id: 'A2', label: 'A2', name: 'Assist 2', color: '#A855F7' },
    ],
    directions: [],
    defaultKeyboard: { L: 'j', M: 'k', H: 'l', S: ';', A1: 'u', A2: 'i' },
    defaultDirections: { '2': 's', '4': 'a', '6': 'd', '8': 'w' },
    defaultGamepad: { 0: 'L', 1: 'M', 2: 'H', 3: 'S', 4: 'A1', 5: 'A2' },
  },

  // --- BlazBlue Central Fiction ---
  bbcf: {
    gameId: 'bbcf',
    buttons: [
      { id: 'A', label: 'A', name: 'A', color: '#3B82F6' },
      { id: 'B', label: 'B', name: 'B', color: '#22C55E' },
      { id: 'C', label: 'C', name: 'C', color: '#EF4444' },
      { id: 'D', label: 'D', name: 'D', color: '#A855F7' },
    ],
    directions: [],
    defaultKeyboard: { A: 'j', B: 'k', C: 'l', D: ';' },
    defaultDirections: { '2': 's', '4': 'a', '6': 'd', '8': 'w' },
    defaultGamepad: { 0: 'A', 1: 'B', 2: 'C', 3: 'D' },
  },

  // --- BlazBlue Cross Tag Battle ---
  bbtag: {
    gameId: 'bbtag',
    buttons: [
      { id: 'A', label: 'A', name: 'A', color: '#3B82F6' },
      { id: 'B', label: 'B', name: 'B', color: '#22C55E' },
      { id: 'C', label: 'C', name: 'C', color: '#EF4444' },
      { id: 'D', label: 'D', name: 'D (Tag)', color: '#A855F7' },
    ],
    directions: [],
    defaultKeyboard: { A: 'j', B: 'k', C: 'l', D: ';' },
    defaultDirections: { '2': 's', '4': 'a', '6': 'd', '8': 'w' },
    defaultGamepad: { 0: 'A', 1: 'B', 2: 'C', 3: 'D' },
  },

  // --- DNF Duel ---
  dnfd: {
    gameId: 'dnfd',
    buttons: [
      { id: 'A', label: 'A', name: 'A (Light)', color: '#3B82F6' },
      { id: 'B', label: 'B', name: 'B (Medium)', color: '#EAB308' },
      { id: 'S', label: 'S', name: 'S (Skill)', color: '#22C55E' },
      { id: 'MS', label: 'MS', name: 'MS (MP Skill)', color: '#EF4444' },
    ],
    directions: [],
    defaultKeyboard: { A: 'j', B: 'k', S: 'l', MS: ';' },
    defaultDirections: { '2': 's', '4': 'a', '6': 'd', '8': 'w' },
    defaultGamepad: { 0: 'A', 1: 'B', 2: 'S', 3: 'MS' },
  },

  // --- Granblue Fantasy Versus: Rising ---
  gbvsr: {
    gameId: 'gbvsr',
    buttons: [
      { id: 'L', label: 'L', name: 'Light', color: '#3B82F6' },
      { id: 'M', label: 'M', name: 'Medium', color: '#EAB308' },
      { id: 'H', label: 'H', name: 'Heavy', color: '#EF4444' },
      { id: 'U', label: 'U', name: 'Unique', color: '#22C55E' },
      { id: 'S', label: 'S', name: 'Skill', color: '#A855F7' },
    ],
    directions: [],
    defaultKeyboard: { L: 'j', M: 'k', H: 'l', U: ';', S: 'u' },
    defaultDirections: { '2': 's', '4': 'a', '6': 'd', '8': 'w' },
    defaultGamepad: { 0: 'L', 1: 'M', 2: 'H', 3: 'U', 4: 'S' },
  },

  // --- Persona 4 Arena Ultimax ---
  p4au: {
    gameId: 'p4au',
    buttons: [
      { id: 'A', label: 'A', name: 'A (Weak)', color: '#3B82F6' },
      { id: 'B', label: 'B', name: 'B (Strong)', color: '#22C55E' },
      { id: 'C', label: 'C', name: 'C (Weak Persona)', color: '#EAB308' },
      { id: 'D', label: 'D', name: 'D (Strong Persona)', color: '#EF4444' },
    ],
    directions: [],
    defaultKeyboard: { A: 'j', B: 'k', C: 'l', D: ';' },
    defaultDirections: { '2': 's', '4': 'a', '6': 'd', '8': 'w' },
    defaultGamepad: { 0: 'A', 1: 'B', 2: 'C', 3: 'D' },
  },

  // --- Street Fighter 6 (coming soon) ---
  sf6: {
    gameId: 'sf6',
    buttons: [
      { id: 'LP', label: 'LP', name: 'Light Punch', color: '#3B82F6' },
      { id: 'MP', label: 'MP', name: 'Medium Punch', color: '#EAB308' },
      { id: 'HP', label: 'HP', name: 'Heavy Punch', color: '#EF4444' },
      { id: 'LK', label: 'LK', name: 'Light Kick', color: '#06B6D4' },
      { id: 'MK', label: 'MK', name: 'Medium Kick', color: '#F97316' },
      { id: 'HK', label: 'HK', name: 'Heavy Kick', color: '#DC2626' },
    ],
    directions: [],
    defaultKeyboard: { LP: 'j', MP: 'k', HP: 'l', LK: 'u', MK: 'i', HK: 'o' },
    defaultDirections: { '2': 's', '4': 'a', '6': 'd', '8': 'w' },
    defaultGamepad: { 0: 'LP', 1: 'MP', 2: 'HP', 3: 'LK', 4: 'MK', 5: 'HK' },
  },

  // --- Tekken 8 (coming soon) ---
  tekken8: {
    gameId: 'tekken8',
    buttons: [
      { id: '1', label: '1', name: 'Left Punch', color: '#3B82F6' },
      { id: '2', label: '2', name: 'Right Punch', color: '#EAB308' },
      { id: '3', label: '3', name: 'Left Kick', color: '#22C55E' },
      { id: '4', label: '4', name: 'Right Kick', color: '#EF4444' },
    ],
    directions: [],
    defaultKeyboard: { '1': 'j', '2': 'k', '3': 'l', '4': ';' },
    defaultDirections: { '2': 's', '4': 'a', '6': 'd', '8': 'w' },
    defaultGamepad: { 0: '1', 1: '2', 2: '3', 3: '4' },
  },

  // --- League of Legends ---
  league: {
    gameId: 'league',
    buttons: [
      { id: 'spell1', label: 'Q', name: 'Spell 1' },
      { id: 'spell2', label: 'W', name: 'Spell 2' },
      { id: 'spell3', label: 'E', name: 'Spell 3' },
      { id: 'spell4', label: 'R', name: 'Spell 4' },
      { id: 'summoner1', label: 'D', name: 'Summoner 1' },
      { id: 'summoner2', label: 'F', name: 'Summoner 2' },
      { id: 'autoattack', label: 'AA', name: 'Auto Attack' },
      { id: 'item1', label: '1', name: 'Item 1' },
      { id: 'item2', label: '2', name: 'Item 2' },
      { id: 'item3', label: '3', name: 'Item 3' },
      { id: 'item4', label: '4', name: 'Item 4' },
    ],
    directions: [],
    defaultKeyboard: {
      spell1: 'q', spell2: 'w', spell3: 'e', spell4: 'r',
      summoner1: 'd', summoner2: 'f', autoattack: 'mouse2',
      item1: '1', item2: '2', item3: '3', item4: '4',
    },
    defaultDirections: {},
    defaultGamepad: {
      0: 'spell1', 1: 'spell2', 2: 'spell3', 3: 'spell4',
      4: 'summoner1', 5: 'summoner2', 12: 'autoattack',
    },
  },
}

export function getGameInputConfig(gameId: string): GameInputConfig | undefined {
  return GAME_INPUTS[gameId]
}
