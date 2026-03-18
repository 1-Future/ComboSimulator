"""
Scrape Dustloop wiki for fighting game combo and frame data.

Usage:
  python scripts/scrape-dustloop.py ggst          # Scrape Guilty Gear Strive
  python scripts/scrape-dustloop.py all            # Scrape all supported games

Outputs JSON files to public/data/fighting/
"""

import json
import os
import sys
import time
import re
import urllib.request
from pathlib import Path
from html.parser import HTMLParser


# Game configs — wiki path prefix and game ID
GAMES = {
    'ggst': {
        'name': 'Guilty Gear -Strive-',
        'wiki_prefix': 'GGST',
        'wiki_url': 'https://www.dustloop.com/w/GGST',
    },
    'dbfz': {
        'name': 'Dragon Ball FighterZ',
        'wiki_prefix': 'DBFZ',
        'wiki_url': 'https://www.dustloop.com/w/DBFZ',
    },
    'bbcf': {
        'name': 'BlazBlue: Central Fiction',
        'wiki_prefix': 'BBCF',
        'wiki_url': 'https://www.dustloop.com/w/BBCF',
    },
    'bbtag': {
        'name': 'BlazBlue Cross Tag Battle',
        'wiki_prefix': 'BBTag',
        'wiki_url': 'https://www.dustloop.com/w/BBTag',
    },
    'dnfd': {
        'name': 'DNF Duel',
        'wiki_prefix': 'DNFD',
        'wiki_url': 'https://www.dustloop.com/w/DNFD',
    },
    'gbvsr': {
        'name': 'Granblue Fantasy Versus: Rising',
        'wiki_prefix': 'GBVSR',
        'wiki_url': 'https://www.dustloop.com/w/GBVSR',
    },
    'ggxrd': {
        'name': 'Guilty Gear Xrd REV 2',
        'wiki_prefix': 'GGXRD-R2',
        'wiki_url': 'https://www.dustloop.com/w/GGXRD-R2',
    },
    'ggacr': {
        'name': 'Guilty Gear XX Accent Core +R',
        'wiki_prefix': 'GGACR',
        'wiki_url': 'https://www.dustloop.com/w/GGACR',
    },
    'p4au': {
        'name': 'Persona 4 Arena Ultimax',
        'wiki_prefix': 'P4AU',
        'wiki_url': 'https://www.dustloop.com/w/P4AU',
    },
}

FPS = 60
FRAME_MS = 1000 / FPS  # 16.667ms per frame


def fetch_page(url: str) -> str:
    """Fetch a wiki page."""
    req = urllib.request.Request(url, headers={'User-Agent': 'ComboSimulator/1.0'})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.read().decode('utf-8')
    except Exception as e:
        print(f"  FETCH ERROR: {e}")
        return ""


class TableParser(HTMLParser):
    """Simple HTML table parser."""
    def __init__(self):
        super().__init__()
        self.tables = []
        self.current_table = []
        self.current_row = []
        self.current_cell = ""
        self.in_table = False
        self.in_row = False
        self.in_cell = False
        self.is_header = False

    def handle_starttag(self, tag, attrs):
        if tag == 'table':
            self.in_table = True
            self.current_table = []
        elif tag == 'tr' and self.in_table:
            self.in_row = True
            self.current_row = []
        elif tag in ('td', 'th') and self.in_row:
            self.in_cell = True
            self.is_header = tag == 'th'
            self.current_cell = ""

    def handle_endtag(self, tag):
        if tag in ('td', 'th') and self.in_cell:
            self.current_row.append(self.current_cell.strip())
            self.in_cell = False
        elif tag == 'tr' and self.in_row:
            if self.current_row:
                self.current_table.append(self.current_row)
            self.in_row = False
        elif tag == 'table' and self.in_table:
            if self.current_table:
                self.tables.append(self.current_table)
            self.in_table = False

    def handle_data(self, data):
        if self.in_cell:
            self.current_cell += data


def parse_tables(html: str) -> list[list[list[str]]]:
    """Extract all tables from HTML."""
    parser = TableParser()
    parser.feed(html)
    return parser.tables


def extract_links(html: str, pattern: str) -> list[tuple[str, str]]:
    """Extract links matching a pattern. Returns [(url, text), ...]"""
    links = []
    # Simple regex for <a href="...">text</a>
    for match in re.finditer(r'<a[^>]+href="([^"]*)"[^>]*>([^<]*)</a>', html):
        href, text = match.groups()
        if pattern in href:
            links.append((href, text.strip()))
    return links


def get_characters(game_config: dict) -> list[dict]:
    """Get character list from a game's main page by finding character icon images."""
    url = game_config['wiki_url']
    html = fetch_page(url)
    if not html:
        return []

    prefix = game_config['wiki_prefix']
    characters = {}

    # Method 1: Find links that contain character icon images
    # Pattern: <a href="/w/GGST/Sol_Badguy"><img ... GGST_Sol_Icon.png ...></a>
    icon_pattern = re.compile(
        rf'<a[^>]+href="(/w/{prefix}/([^"/]+))"[^>]*>.*?<img[^>]+(?:Icon|Portrait|icon)[^>]*>',
        re.DOTALL | re.IGNORECASE
    )
    for match in icon_pattern.finditer(html):
        href, char_path = match.groups()
        if '/' in char_path:
            continue
        char_id = char_path.lower().replace(' ', '_').replace("'", '').replace('.', '')
        if char_id not in characters:
            # Clean up name from wiki path
            name = char_path.replace('_', ' ')
            characters[char_id] = {
                'id': char_id,
                'name': name,
                'wiki_path': char_path,
            }

    # Method 2: Fallback — find all links to /w/PREFIX/Name that have the Name
    # as a known character pattern (single segment, capitalized)
    if not characters:
        for match in re.finditer(rf'<a[^>]+href="/w/{prefix}/([A-Z][^"/]*)"[^>]*title="[^"]*"[^>]*>', html):
            char_path = match.group(1)
            if '/' in char_path or any(x in char_path.lower() for x in ('patch', 'system', 'mechanic', 'overview', 'control', 'faq', 'glossary', 'notation', 'defense', 'offense', 'movement', 'hud', 'getting', 'tier', 'esoterica', 'miscellaneous', 'universal', 'damage', 'frame_data', 'team')):
                continue
            char_id = char_path.lower().replace(' ', '_').replace("'", '').replace('.', '')
            if char_id not in characters:
                name = char_path.replace('_', ' ')
                characters[char_id] = {
                    'id': char_id,
                    'name': name,
                    'wiki_path': char_path,
                }

    return list(characters.values())


def get_frame_data(game_config: dict, char_wiki_path: str) -> dict[str, dict]:
    """Get frame data for a character."""
    prefix = game_config['wiki_prefix']
    url = f"https://www.dustloop.com/w/{prefix}/{char_wiki_path}/Frame_Data"
    html = fetch_page(url)
    if not html:
        return {}

    tables = parse_tables(html)
    frame_data = {}

    for table in tables:
        if len(table) < 2:
            continue
        headers = [h.lower().strip() for h in table[0]]

        # Look for tables with startup/active/recovery columns
        startup_col = next((i for i, h in enumerate(headers) if 'startup' in h), None)
        active_col = next((i for i, h in enumerate(headers) if 'active' in h), None)
        recovery_col = next((i for i, h in enumerate(headers) if 'recovery' in h), None)
        hit_col = next((i for i, h in enumerate(headers) if 'hit' in h and 'block' not in h), None)
        input_col = next((i for i, h in enumerate(headers) if 'input' in h or 'move' in h or 'name' in h), 0)

        if startup_col is None:
            continue

        for row in table[1:]:
            if len(row) <= max(filter(None, [startup_col, active_col, recovery_col, input_col])):
                continue

            move_input = row[input_col].strip()
            if not move_input:
                continue

            try:
                startup = int(re.search(r'\d+', row[startup_col])[0]) if startup_col and row[startup_col] else 0
            except (TypeError, IndexError):
                startup = 0

            try:
                on_hit = row[hit_col].strip() if hit_col and hit_col < len(row) else '0'
            except IndexError:
                on_hit = '0'

            # Parse advantage (handle things like "+3", "-2", "KD", "HKD")
            adv = 0
            if on_hit:
                adv_match = re.search(r'[+-]?\d+', on_hit)
                if adv_match:
                    adv = int(adv_match[0])

            frame_data[move_input] = {
                'input': move_input,
                'startup': startup,
                'on_hit': adv,
                'raw_on_hit': on_hit,
            }

    return frame_data


def get_combos(game_config: dict, char_wiki_path: str) -> list[dict]:
    """Get combos for a character from their combo page."""
    prefix = game_config['wiki_prefix']
    url = f"https://www.dustloop.com/w/{prefix}/{char_wiki_path}/Combos"
    html = fetch_page(url)
    if not html:
        return []

    tables = parse_tables(html)
    combos = []

    for table in tables:
        if len(table) < 2:
            continue
        headers = [h.lower().strip() for h in table[0]]

        # Find relevant columns
        combo_col = None
        damage_col = None
        diff_col = None
        pos_col = None

        for i, h in enumerate(headers):
            if any(x in h for x in ['combo', 'recipe', 'notation', 'route']):
                combo_col = i
            elif 'damage' in h or 'dmg' in h:
                damage_col = i
            elif 'difficult' in h or 'diff' in h:
                diff_col = i
            elif 'position' in h or 'where' in h or 'location' in h:
                pos_col = i

        if combo_col is None:
            # Try first column as combo
            combo_col = 0

        for row in table[1:]:
            if combo_col >= len(row):
                continue

            notation = row[combo_col].strip()
            if not notation or len(notation) < 3:
                continue
            # Skip if it looks like a header
            if notation.lower() in ('combo', 'recipe', 'notation', 'route'):
                continue

            combo = {
                'notation': notation,
                'damage': row[damage_col].strip() if damage_col and damage_col < len(row) else '',
                'difficulty': row[diff_col].strip() if diff_col and diff_col < len(row) else '',
                'position': row[pos_col].strip() if pos_col and pos_col < len(row) else '',
            }
            combos.append(combo)

    return combos


def parse_notation_to_inputs(notation: str, frame_data: dict) -> list[dict]:
    """
    Convert combo notation to timed inputs using frame data.
    E.g., 'c.S > 5H > 236KK' → [{key: 'c.S', time: 0}, {key: '5H', time: 0.383}, ...]
    """
    # Split on common combo separators
    parts = re.split(r'\s*>\s*|\s*,\s*|\s*~\s*', notation)
    parts = [p.strip() for p in parts if p.strip()]

    if not parts:
        return []

    inputs = []
    current_time = 0  # in ms

    for i, part in enumerate(parts):
        # Clean up the part
        clean = re.sub(r'\(.*?\)', '', part).strip()  # remove parenthetical notes
        clean = re.sub(r'\s+', ' ', clean)

        if not clean:
            continue

        # Look up frame data for this move
        fd = frame_data.get(clean, {})
        startup = fd.get('startup', 10)  # default 10 frames if unknown
        on_hit = fd.get('on_hit', 3)  # default +3 if unknown

        if i == 0:
            # First move
            inputs.append({
                'key': clean,
                'time': round(current_time / 1000, 3),
                'label': clean,
                'window': 100,
            })
            # After first move: startup + active frames + advantage
            current_time += (startup + abs(on_hit)) * FRAME_MS
        else:
            inputs.append({
                'key': clean,
                'time': round(current_time / 1000, 3),
                'label': clean,
                'window': 100,
            })
            current_time += (startup + max(0, on_hit)) * FRAME_MS

    return inputs


def difficulty_to_standard(diff: str) -> str:
    """Map Dustloop difficulty labels to our standard."""
    d = diff.lower().strip()
    if 'very easy' in d:
        return 'beginner'
    elif 'easy' in d:
        return 'beginner'
    elif 'medium' in d:
        return 'intermediate'
    elif 'hard' in d or 'very hard' in d:
        return 'advanced'
    return 'intermediate'


def scrape_game(game_id: str) -> None:
    """Scrape all characters and combos for a game."""
    if game_id not in GAMES:
        print(f"Unknown game: {game_id}")
        print(f"Available: {', '.join(GAMES.keys())}")
        return

    config = GAMES[game_id]
    print(f"\n{'='*60}")
    print(f"Scraping {config['name']}")
    print(f"{'='*60}")

    # Get characters
    print("\nFinding characters...")
    characters = get_characters(config)
    print(f"Found {len(characters)} characters")

    if not characters:
        print("No characters found!")
        return

    # Output directory
    out_dir = Path(f"public/data/fighting/{game_id}")
    out_dir.mkdir(parents=True, exist_ok=True)

    # Character index
    char_index = []

    for char in characters:
        print(f"\n  {char['name']}...")

        # Get frame data
        frame_data = get_frame_data(config, char['wiki_path'])
        print(f"    Frame data: {len(frame_data)} moves")

        # Get combos
        raw_combos = get_combos(config, char['wiki_path'])
        print(f"    Raw combos: {len(raw_combos)}")

        # Convert combos to our format
        combos = []
        for rc in raw_combos:
            inputs = parse_notation_to_inputs(rc['notation'], frame_data)
            if len(inputs) < 2:
                continue

            combo_id = re.sub(r'[^a-z0-9]+', '-', rc['notation'][:50].lower()).strip('-')
            combos.append({
                'id': combo_id,
                'name': rc['notation'][:60],
                'notation': rc['notation'],
                'description': f"{rc['position']} — {rc['damage']} damage" if rc['damage'] else rc['position'] or '',
                'difficulty': difficulty_to_standard(rc['difficulty']),
                'category': 'bread-and-butter',
                'tags': [t for t in [rc['position'].lower()] if t],
                'video': None,  # No video — timing from frame data
                'inputs': inputs,
                'tips': [],
                'damage': rc['damage'],
            })

        # Save character combos
        char_data = {
            'characterId': char['id'],
            'game': game_id,
            'gameName': config['name'],
            'name': char['name'],
            'combos': combos,
            'frameData': frame_data,
        }

        char_file = out_dir / f"{char['id']}.json"
        with open(char_file, 'w', encoding='utf-8') as f:
            json.dump(char_data, f, indent=2, ensure_ascii=False)

        char_index.append({
            'id': char['id'],
            'name': char['name'],
            'comboCount': len(combos),
            'moveCount': len(frame_data),
        })

        print(f"    Saved {len(combos)} combos -> {char_file}")
        time.sleep(0.5)  # Be nice to the wiki

    # Save game index
    game_index = {
        'id': game_id,
        'name': config['name'],
        'characters': char_index,
        'totalCombos': sum(c['comboCount'] for c in char_index),
        'totalCharacters': len(char_index),
    }

    index_file = out_dir / 'index.json'
    with open(index_file, 'w', encoding='utf-8') as f:
        json.dump(game_index, f, indent=2, ensure_ascii=False)

    print(f"\n{'='*60}")
    print(f"Done! {len(char_index)} characters, {game_index['totalCombos']} combos")
    print(f"Saved to {out_dir}/")
    print(f"{'='*60}")


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python scrape-dustloop.py <game_id|all>")
        print(f"Games: {', '.join(GAMES.keys())}")
        sys.exit(1)

    target = sys.argv[1]
    if target == 'all':
        for gid in GAMES:
            scrape_game(gid)
    else:
        scrape_game(target)
