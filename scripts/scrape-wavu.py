"""
Scrape Wavu Wiki for Tekken 8 combo and frame data.

Usage:
  python scripts/scrape-wavu.py
"""

import json
import os
import re
import time
import urllib.request
from pathlib import Path
from html.parser import HTMLParser


WAVU_BASE = 'https://wavu.wiki/t'
FPS = 60
FRAME_MS = 1000 / FPS

CHARACTERS = [
    'Alisa', 'Asuka', 'Azucena', 'Bryan', 'Claudio', 'Devil_Jin',
    'Dragunov', 'Eddy', 'Feng', 'Heihachi', 'Hwoarang', 'Jack-8',
    'Jin', 'Jun', 'Kazuya', 'King', 'Kuma', 'Lars', 'Law', 'Lee',
    'Leo', 'Lili', 'Nina', 'Panda', 'Paul', 'Raven', 'Reina',
    'Shaheen', 'Steve', 'Victor', 'Xiaoyu', 'Yoshimitsu', 'Zafina',
    'Lidia',
]


class TableParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tables = []
        self.current_table = []
        self.current_row = []
        self.current_cell = ''
        self.in_table = False
        self.in_row = False
        self.in_cell = False

    def handle_starttag(self, tag, attrs):
        if tag == 'table':
            self.in_table = True
            self.current_table = []
        elif tag == 'tr' and self.in_table:
            self.in_row = True
            self.current_row = []
        elif tag in ('td', 'th') and self.in_row:
            self.in_cell = True
            self.current_cell = ''

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


def fetch_page(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'ComboSimulator/1.0'})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.read().decode('utf-8')
    except Exception as e:
        print(f'  FETCH ERROR: {e}')
        return ''


def parse_tables(html):
    parser = TableParser()
    parser.feed(html)
    return parser.tables


def get_combos(char_name):
    url = f'{WAVU_BASE}/{char_name}_combos'
    html = fetch_page(url)
    if not html:
        return []

    tables = parse_tables(html)
    combos = []

    for table in tables:
        if len(table) < 2:
            continue

        for row in table[1:]:
            if len(row) < 1:
                continue

            # First column is usually the combo notation
            notation = row[0].strip()
            if not notation or len(notation) < 3:
                continue
            if notation.lower() in ('combo', 'input', 'command', 'launcher'):
                continue

            damage = ''
            for cell in row[1:]:
                # Look for damage numbers
                dmg_match = re.search(r'\d+', cell)
                if dmg_match and len(cell) < 10:
                    damage = cell.strip()
                    break

            combos.append({
                'notation': notation,
                'damage': damage,
            })

    return combos


def get_frame_data(char_name):
    url = f'{WAVU_BASE}/{char_name}_movelist'
    html = fetch_page(url)
    if not html:
        return {}

    tables = parse_tables(html)
    frame_data = {}

    for table in tables:
        if len(table) < 2:
            continue
        headers = [h.lower().strip() for h in table[0]]

        input_col = None
        startup_col = None
        hit_col = None

        for i, h in enumerate(headers):
            if any(x in h for x in ['input', 'command', 'move']):
                input_col = i
            elif 'startup' in h or h == 'i':
                startup_col = i
            elif 'hit' in h and 'block' not in h:
                hit_col = i

        if input_col is None or startup_col is None:
            continue

        for row in table[1:]:
            if input_col >= len(row):
                continue
            move = row[input_col].strip()
            if not move:
                continue

            try:
                startup = int(re.search(r'\d+', row[startup_col])[0])
            except (TypeError, IndexError):
                startup = 10

            on_hit = 0
            if hit_col and hit_col < len(row):
                m = re.search(r'[+-]?\d+', row[hit_col])
                if m:
                    on_hit = int(m[0])

            frame_data[move] = {
                'input': move,
                'startup': startup,
                'on_hit': on_hit,
            }

    return frame_data


def notation_to_inputs(notation, frame_data):
    parts = re.split(r'\s+', notation)
    inputs = []
    current_time = 0

    for i, part in enumerate(parts):
        clean = part.strip().rstrip(',')
        if not clean or clean in ('T!', 'S!', 'W!', '!', 'dash', 'iWS', 'WS'):
            continue

        fd = frame_data.get(clean, {})
        startup = fd.get('startup', 12)
        on_hit = fd.get('on_hit', 5)

        inputs.append({
            'key': clean,
            'time': round(current_time / 1000, 3),
            'label': clean,
            'window': 120,
        })

        current_time += (startup + max(0, on_hit)) * FRAME_MS

    return inputs


def scrape_tekken8():
    print('Scraping Tekken 8 from Wavu Wiki')
    print('=' * 50)

    out_dir = Path('public/data/fighting/tekken8')
    out_dir.mkdir(parents=True, exist_ok=True)

    char_index = []

    for char_name in CHARACTERS:
        print(f'\n  {char_name}...')

        frame_data = get_frame_data(char_name)
        print(f'    Frame data: {len(frame_data)} moves')

        raw_combos = get_combos(char_name)
        print(f'    Raw combos: {len(raw_combos)}')

        combos = []
        for rc in raw_combos:
            inputs = notation_to_inputs(rc['notation'], frame_data)
            if len(inputs) < 2:
                continue

            combo_id = re.sub(r'[^a-z0-9]+', '-', rc['notation'][:50].lower()).strip('-')
            combos.append({
                'id': combo_id,
                'name': rc['notation'][:60],
                'notation': rc['notation'],
                'description': f"{rc['damage']} damage" if rc['damage'] else '',
                'difficulty': 'intermediate',
                'category': 'bread-and-butter',
                'tags': [],
                'video': None,
                'inputs': inputs,
                'tips': [],
                'damage': rc['damage'],
            })

        char_id = char_name.lower().replace(' ', '_').replace('-', '_')
        char_data = {
            'characterId': char_id,
            'game': 'tekken8',
            'gameName': 'Tekken 8',
            'name': char_name.replace('_', ' '),
            'combos': combos,
            'frameData': frame_data,
        }

        char_file = out_dir / f'{char_id}.json'
        with open(char_file, 'w', encoding='utf-8') as f:
            json.dump(char_data, f, indent=2, ensure_ascii=False)

        char_index.append({
            'id': char_id,
            'name': char_name.replace('_', ' '),
            'comboCount': len(combos),
            'moveCount': len(frame_data),
        })

        print(f'    Saved {len(combos)} combos')
        time.sleep(0.5)

    game_index = {
        'id': 'tekken8',
        'name': 'Tekken 8',
        'characters': char_index,
        'totalCombos': sum(c['comboCount'] for c in char_index),
        'totalCharacters': len(char_index),
    }

    with open(out_dir / 'index.json', 'w') as f:
        json.dump(game_index, f, indent=2)

    print(f'\n{"=" * 50}')
    print(f'Done! {len(char_index)} characters, {game_index["totalCombos"]} combos')


if __name__ == '__main__':
    scrape_tekken8()
