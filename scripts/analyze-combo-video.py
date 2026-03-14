"""
Analyze OP.GG combo videos to extract timing data.

Strategy:
1. Read the text labels from the bottom bar (contour detection on white text)
   - This gives us the number of steps AND the key labels
2. Use those text positions as step positions
3. Detect when each position turns blue (= step activation time)
4. Output timing JSON

The text labels are the source of truth for step count and keys.
"""

import cv2
import numpy as np
import json
import sys
import os
from pathlib import Path


def get_video_info(video_path: str) -> dict:
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    duration = frame_count / fps if fps > 0 else 0
    cap.release()
    return {"fps": fps, "frame_count": frame_count, "width": width, "height": height, "duration": duration}


def read_bar_labels(video_path: str) -> list[dict]:
    """
    Read the text labels from the combo bar.
    Returns list of {x_center, label, width} for each step.
    Uses contour detection on the white text at the bottom of the frame.
    """
    cap = cv2.VideoCapture(video_path)

    # Try multiple timestamps to find a clear frame with labels
    for seek_time in [2.5, 3.0, 2.0, 3.5, 4.0]:
        cap.set(cv2.CAP_PROP_POS_MSEC, seek_time * 1000)
        ret, frame = cap.read()
        if not ret:
            continue

        h, w = frame.shape[:2]

        # Text labels are in the bottom ~7% of the frame
        text_top = int(h * 0.91)
        text_bottom = int(h * 0.98)
        text_row = frame[text_top:text_bottom, :]

        # Isolate white text using HSV (low saturation + high value = white)
        hsv = cv2.cvtColor(text_row, cv2.COLOR_BGR2HSV)
        thresh = cv2.inRange(hsv, np.array([0, 0, 120]), np.array([180, 40, 255]))
        # Clean up noise
        kernel = np.ones((2, 2), np.uint8)
        thresh = cv2.erode(thresh, kernel, iterations=1)
        thresh = cv2.dilate(thresh, kernel, iterations=1)

        # Find contours
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        # Get bounding boxes, filter noise
        boxes = []
        for cnt in contours:
            x, y, bw, bh = cv2.boundingRect(cnt)
            if bw * bh > 80 and bh > 6:
                boxes.append((x, y, bw, bh))

        if not boxes:
            continue

        # Sort by x
        boxes.sort(key=lambda b: b[0])

        # Group nearby boxes into labels (chars within 15px = same label)
        groups = []
        current_group = [boxes[0]]
        for b in boxes[1:]:
            if b[0] - (current_group[-1][0] + current_group[-1][2]) < 15:
                current_group.append(b)
            else:
                groups.append(current_group)
                current_group = [b]
        groups.append(current_group)

        if len(groups) < 2:
            continue  # Need at least 2 steps

        # Classify each group using template matching
        labels = []
        for group in groups:
            x_min = min(b[0] for b in group)
            x_max = max(b[0] + b[2] for b in group)
            y_min = min(b[1] for b in group)
            y_max = max(b[1] + b[3] for b in group)
            x_center = (x_min + x_max) // 2
            label_width = x_max - x_min

            crop = thresh[y_min:y_max, x_min:x_max]
            label = match_template(crop)

            labels.append({"x_center": x_center, "label": label, "width": label_width})

        cap.release()
        if labels:
            return labels

    cap.release()

    # Fallback: if text detection failed, detect icon positions from the icon strip
    # and label everything as items
    cap = cv2.VideoCapture(video_path)
    for seek_time in [3.0, 4.0, 5.0, 6.0]:
        cap.set(cv2.CAP_PROP_POS_MSEC, seek_time * 1000)
        ret, frame = cap.read()
        if not ret:
            continue

        h, w = frame.shape[:2]
        # Icon strip: 78-90% of frame height
        icon_top = int(h * 0.78)
        icon_bottom = int(h * 0.90)
        icon_strip = frame[icon_top:icon_bottom, :]

        # Look for distinct icon-sized regions (non-background areas)
        gray = cv2.cvtColor(icon_strip, cv2.COLOR_BGR2GRAY)
        # Icons are brighter than the dark bar background
        _, thresh = cv2.threshold(gray, 60, 255, cv2.THRESH_BINARY)
        # Close gaps within icons
        kernel = np.ones((5, 15), np.uint8)
        thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)

        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        boxes = []
        for cnt in contours:
            x, y, bw, bh = cv2.boundingRect(cnt)
            # Icons are roughly square-ish, at least 25px wide
            if bw > 25 and bh > 15 and bw < 120:
                boxes.append((x, y, bw, bh))

        if len(boxes) >= 2:
            boxes.sort(key=lambda b: b[0])
            labels = []
            for b in boxes:
                x_center = b[0] + b[2] // 2
                labels.append({"x_center": x_center, "label": "1", "width": b[2]})
            cap.release()
            return labels

    cap.release()
    return []


def load_templates() -> dict[str, np.ndarray]:
    """Load character templates from scripts/templates/."""
    templates = {}
    template_dir = Path(__file__).parent / "templates"
    if not template_dir.exists():
        return templates
    for f in template_dir.glob("*.png"):
        name = f.stem
        img = cv2.imread(str(f), cv2.IMREAD_GRAYSCALE)
        if img is not None:
            templates[name] = img
    return templates


# Global template cache
_templates: dict[str, np.ndarray] | None = None


def get_templates() -> dict[str, np.ndarray]:
    global _templates
    if _templates is None:
        _templates = load_templates()
    return _templates


def match_template(crop: np.ndarray) -> str:
    """Match a character crop against known templates using normalized correlation."""
    templates = get_templates()
    if not templates or crop.size == 0:
        return "?"

    h, w = crop.shape[:2]
    if h == 0 or w == 0:
        return "?"

    best_score = -1.0
    best_label = "?"

    for name, tmpl in templates.items():
        th, tw = tmpl.shape[:2]

        # Resize template to match crop height
        if th != h:
            scale = h / th
            new_w = max(1, int(tw * scale))
            tmpl_resized = cv2.resize(tmpl, (new_w, h), interpolation=cv2.INTER_AREA)
        else:
            tmpl_resized = tmpl

        # Pad crop or template to same width for comparison
        tw_r = tmpl_resized.shape[1]
        max_w = max(w, tw_r)
        crop_padded = np.zeros((h, max_w), dtype=np.uint8)
        crop_padded[:, :w] = crop
        tmpl_padded = np.zeros((h, max_w), dtype=np.uint8)
        tmpl_padded[:, :tw_r] = tmpl_resized

        # Normalized cross-correlation
        if np.std(crop_padded) == 0 or np.std(tmpl_padded) == 0:
            continue

        result = cv2.matchTemplate(
            crop_padded.astype(np.float32),
            tmpl_padded.astype(np.float32),
            cv2.TM_CCOEFF_NORMED,
        )
        score = result.max()

        if score > best_score:
            best_score = score
            best_label = name

    return best_label if best_score > 0.3 else "?"


def classify_single_char(thresh_crop: np.ndarray) -> str:
    """Classify a single white-on-black character crop."""
    if thresh_crop.size == 0:
        return "?"

    h, t_w = thresh_crop.shape[:2]
    if h == 0 or t_w == 0:
        return "?"

    density = np.sum(thresh_crop > 0) / thresh_crop.size

    # Vertical profile (white pixels per row)
    v_prof = np.sum(thresh_crop > 0, axis=1).astype(float)
    if len(v_prof) == 0:
        return "?"

    # Horizontal profile
    h_prof = np.sum(thresh_crop > 0, axis=0).astype(float)

    # Top half vs bottom half
    mid_h = h // 2
    top = thresh_crop[:mid_h, :]
    bot = thresh_crop[mid_h:, :]
    top_d = np.sum(top > 0) / max(1, top.size)
    bot_d = np.sum(bot > 0) / max(1, bot.size)

    # Left half vs right half
    mid_w = t_w // 2
    left = thresh_crop[:, :mid_w]
    right = thresh_crop[:, mid_w:]
    left_d = np.sum(left > 0) / max(1, left.size)
    right_d = np.sum(right > 0) / max(1, right.size)

    # Bottom row presence (Q has a tail, others don't)
    bot_row = v_prof[-max(1, h//5):]
    bot_row_density = np.mean(bot_row) / max(1, np.max(v_prof))

    # Check for vertical bar on left (E, F have this)
    left_col = h_prof[:max(1, t_w//4)]
    left_col_avg = np.mean(left_col)
    right_col = h_prof[-max(1, t_w//4):]
    right_col_avg = np.mean(right_col)

    # W: very high density, wide shape
    if density > 0.42:
        return "W"

    # E: strong left vertical bar, horizontal lines
    if left_d > right_d * 1.5 and bot_d < top_d * 1.3:
        return "E"

    # F: like E but bottom is lighter
    if left_d > right_d * 1.3 and top_d > bot_d * 1.4:
        return "F"

    # R: top heavy, right side has curve
    if top_d > bot_d * 1.3 and right_d > left_d * 0.7:
        return "R"

    # D: right-heavy curve
    if right_d > left_d * 1.2:
        return "D"

    # Q: bottom tail, round shape
    if bot_row_density > 0.3:
        return "Q"

    # Default
    return "Q"


def classify_multi_char(thresh_crop: np.ndarray, boxes: list, color_crop: np.ndarray) -> str:
    """Classify a multi-character label (AA, Q2, Q3, W2, etc.)."""
    if len(boxes) == 2:
        # Two characters — check widths
        b1, b2 = boxes
        w1, w2 = b1[2], b2[2]

        # If both chars are similar width and narrow, likely "AA"
        if abs(w1 - w2) < 5 and w1 < 15 and w2 < 15:
            return "AA"

        # If second char is very narrow, likely a number (Q2, Q3, etc.)
        if w2 < w1 * 0.7:
            # First char determines the letter
            first_crop = thresh_crop[:, :b1[2]+2]
            letter = classify_single_char(first_crop)
            return f"{letter}2"

    # More than 2 boxes or unclear — try "AA" as default for multi-char
    total_w = sum(b[2] for b in boxes)
    if len(boxes) >= 2 and total_w < 40:
        return "AA"

    return "AA"


def detect_highlight_at_positions(frame: np.ndarray, step_positions: list[int]) -> list[bool]:
    """
    For each step position, check if the icon area is highlighted (any color).
    Active icons are brighter and more saturated than inactive (gray) ones.
    Returns list of booleans.
    """
    h, w = frame.shape[:2]

    # Icon area is above the text row — roughly 78-90% of frame height
    icon_top = int(h * 0.78)
    icon_bottom = int(h * 0.90)

    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    icon_strip = hsv[icon_top:icon_bottom, :]

    results = []
    check_width = 30

    for pos_info in step_positions:
        x = pos_info["x_center"]
        x1 = max(0, x - check_width)
        x2 = min(w, x + check_width)
        region = icon_strip[:, x1:x2]

        # Detect any bright, saturated highlight (blue, green, orange, etc.)
        # Active: S > 40 and V > 100 (saturated + bright)
        lower = np.array([0, 40, 100])
        upper = np.array([180, 255, 255])
        mask = cv2.inRange(region, lower, upper)
        highlight_ratio = np.sum(mask > 0) / max(1, mask.size)

        results.append(highlight_ratio > 0.08)  # >8% saturated+bright = highlighted

    return results


def analyze_video(video_path: str) -> tuple[list[dict], list[dict]]:
    """
    Analyze a video: read labels, detect timing.
    Returns (labels, activations).
    """
    info = get_video_info(video_path)
    print(f"  Video: {info['width']}x{info['height']}, {info['fps']:.1f}fps, {info['duration']:.2f}s")

    # Step 1: Read labels from bar text
    labels = read_bar_labels(video_path)
    if not labels:
        print("  WARNING: No bar labels found!")
        return [], []

    print(f"  Bar labels: {[l['label'] for l in labels]}")
    num_steps = len(labels)

    # Step 2: Scan frames to find when each step becomes active
    cap = cv2.VideoCapture(video_path)
    sample_rate = max(1, int(info["fps"] / 30))  # ~30 fps sampling for better precision

    # Track which step is currently highlighted
    activations = []
    activated = [False] * num_steps
    current_step = -1  # Track which step we expect next (left-to-right)
    next_expected = 0
    frame_idx = 0
    min_gap = 0.05  # 50ms minimum between activations
    last_time = -1.0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_idx % sample_rate == 0:
            timestamp = frame_idx / info["fps"]
            blues = detect_highlight_at_positions(frame, labels)

            # Find the rightmost newly-activated step
            # (combo progresses left to right)
            for i in range(num_steps):
                if blues[i] and not activated[i]:
                    # Only activate if it's the next expected step or close to it
                    if i >= next_expected - 1 and timestamp - last_time >= min_gap:
                        activated[i] = True
                        activations.append({
                            "step_index": i,
                            "timestamp": round(timestamp, 3),
                            "label": labels[i]["label"],
                        })
                        next_expected = i + 1
                        last_time = timestamp

            # If all steps activated, we're done
            if all(activated):
                break

        frame_idx += 1

    cap.release()
    print(f"  Activated {len(activations)}/{num_steps} steps")
    return labels, activations


def map_label_to_key(label: str) -> tuple[str, str | None]:
    """Map a bar label to (display_key, action)."""
    mapping = {
        "Q": ("Q", "spell1"),
        "Q2": ("Q", "spell1"),
        "Q3": ("Q", "spell1"),
        "W": ("W", "spell2"),
        "W2": ("W", "spell2"),
        "E": ("E", "spell3"),
        "E2": ("E", "spell3"),
        "R": ("R", "spell4"),
        "R2": ("R", "spell4"),
        "F": ("F", "summoner2"),
        "D": ("D", "summoner1"),
        "AA": ("A", "autoattack"),
        "1": ("1", "item1"),
        "2": ("2", "item2"),
        "3": ("3", "item3"),
        "4": ("4", "item4"),
    }
    if label in mapping:
        return mapping[label]
    # Unknown label → treat as item
    return ("1", "item1")


def generate_combo_entry(video_path: str, labels: list[dict], activations: list[dict]) -> dict | None:
    """Generate a combo JSON entry from analysis results."""
    info = get_video_info(video_path)
    filename = os.path.basename(video_path)
    champion_dir = os.path.basename(os.path.dirname(video_path))
    relative_path = f"{champion_dir}/{filename}"

    if not activations:
        return None

    # First activation timestamp = video start point
    # All times are stored as absolute video times so the engine can seek correctly
    first_time = activations[0]["timestamp"]

    inputs = []
    for act in activations:
        label = act["label"]
        key, action = map_label_to_key(label)
        entry = {
            "key": key,
            "time": round(act["timestamp"], 3),
            "label": label,
            "window": 100,
        }
        if action:
            entry["action"] = action
        inputs.append(entry)

    combo_id = Path(filename).stem.lower().replace(" ", "-").replace("--", "-").strip("-")
    key_sequence = [l["label"] for l in labels]

    return {
        "id": combo_id,
        "name": Path(filename).stem,
        "description": f"{champion_dir}: {' → '.join(key_sequence)}",
        "difficulty": "intermediate",
        "category": "bread-and-butter",
        "tags": [],
        "video": {
            "filename": relative_path,
            "duration": round(info["duration"], 1),
            "fps": round(info["fps"]),
            "comboStart": round(first_time, 3),
        },
        "inputs": inputs,
        "tips": [],
    }


def analyze_champion(champion_dir: str, output_dir: str) -> None:
    """Analyze all videos for a champion."""
    champion_name = os.path.basename(champion_dir)
    champion_id = champion_name.lower().replace("'", "").replace(" ", "-")

    video_files = sorted([f for f in os.listdir(champion_dir) if f.endswith(".mp4")])
    if not video_files:
        print(f"No videos for {champion_name}")
        return

    print(f"\n{'='*60}")
    print(f"Analyzing {champion_name} ({len(video_files)} videos)")
    print(f"{'='*60}")

    combos = []
    for vf in video_files:
        video_path = os.path.join(champion_dir, vf)
        print(f"\n  Processing: {vf}")

        try:
            labels, activations = analyze_video(video_path)
            if not labels:
                print(f"  SKIP: No labels detected")
                continue

            combo = generate_combo_entry(video_path, labels, activations)
            if combo and len(combo["inputs"]) > 0:
                combos.append(combo)
                print(f"  OK: {len(combo['inputs'])} inputs")
            else:
                print(f"  SKIP: No activations")
        except Exception as e:
            print(f"  ERROR: {e}")

    output = {
        "championId": champion_id,
        "patch": "14.24",
        "lastVerified": "2026-03-14",
        "combos": combos,
    }

    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, f"{champion_id}.json")
    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)

    print(f"\nWrote {len(combos)} combos to {output_path}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python analyze-combo-video.py <champion_name|all> [output_dir]")
        sys.exit(1)

    champion_arg = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else "public/data/combos"
    videos_dir = "videos"

    if champion_arg.lower() == "all":
        for champion in sorted(os.listdir(videos_dir)):
            champion_path = os.path.join(videos_dir, champion)
            if os.path.isdir(champion_path) and champion != "Unknown":
                analyze_champion(champion_path, output_dir)
    else:
        champion_path = os.path.join(videos_dir, champion_arg)
        if not os.path.isdir(champion_path):
            print(f"Champion directory not found: {champion_path}")
            sys.exit(1)
        analyze_champion(champion_path, output_dir)
