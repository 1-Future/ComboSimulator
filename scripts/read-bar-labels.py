"""
Read the key labels from the OP.GG combo bar using OCR-free approach.
Extracts the text region under each step position and classifies it.

Strategy: Extract a crop around each step position from the text row,
threshold to isolate white text, then match against known patterns.
Since we only have ~10 possible labels (Q, W, E, R, F, D, AA, Q2, Q3, W2, R2, E2),
we build reference templates from the first video and match subsequent ones.
"""

import cv2
import numpy as np
from pathlib import Path


def extract_bar_frame(video_path: str, seek_time: float = 2.5) -> np.ndarray | None:
    """Extract a frame where the combo bar is visible (after intro, before combo starts)."""
    cap = cv2.VideoCapture(video_path)
    cap.set(cv2.CAP_PROP_POS_MSEC, seek_time * 1000)
    ret, frame = cap.read()
    cap.release()
    return frame if ret else None


def get_text_row(frame: np.ndarray) -> np.ndarray:
    """Get the text row from the bottom of the frame (below the ability icons)."""
    h, w = frame.shape[:2]
    # Text labels are in bottom ~8% of the frame
    text_top = int(h * 0.91)
    text_bottom = int(h * 0.98)
    return frame[text_top:text_bottom, :]


def extract_label_crops(text_row: np.ndarray, step_x_positions: list[int], crop_width: int = 50) -> list[np.ndarray]:
    """Crop a small region around each step position from the text row."""
    crops = []
    h = text_row.shape[0]
    for x in step_x_positions:
        x1 = max(0, x - crop_width // 2)
        x2 = min(text_row.shape[1], x + crop_width // 2)
        crop = text_row[:, x1:x2]
        crops.append(crop)
    return crops


def classify_label(crop: np.ndarray) -> str:
    """
    Classify a text crop as one of the known key labels.
    Uses thresholding + pixel analysis.
    """
    # Convert to grayscale
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)

    # Threshold to isolate white text
    _, thresh = cv2.threshold(gray, 140, 255, cv2.THRESH_BINARY)

    # Count white pixels
    white_count = np.sum(thresh > 0)
    total = thresh.size

    if white_count < total * 0.02:
        return "?"  # No text detected

    # Get the bounding box of white pixels
    coords = np.where(thresh > 0)
    if len(coords[0]) == 0:
        return "?"

    min_y, max_y = coords[0].min(), coords[0].max()
    min_x, max_x = coords[1].min(), coords[1].max()
    text_width = max_x - min_x
    text_height = max_y - min_y

    # Crop to just the text
    text_only = thresh[min_y:max_y+1, min_x:max_x+1]
    tw, th = text_only.shape[1], text_only.shape[0]

    if tw == 0 or th == 0:
        return "?"

    aspect = tw / th
    density = np.sum(text_only > 0) / text_only.size

    # "AA" is wider (aspect > 1.5), two characters
    if aspect > 1.3 and text_width > 20:
        return "AA"

    # Single character classification based on shape
    # Q: round with tail, moderate density
    # W: wide with valleys
    # E: horizontal lines
    # R: round top + leg
    # F: similar to E but less bottom
    # D: round right side

    # Use horizontal profile (sum of white pixels per column)
    h_profile = np.sum(text_only > 0, axis=0)
    v_profile = np.sum(text_only > 0, axis=1)

    # Check for multi-char like Q2, Q3, W2, R2, E2
    if aspect > 0.9 and text_width > 15:
        # Might be two chars — check for gap in middle
        mid = tw // 2
        mid_region = h_profile[max(0, mid-3):min(tw, mid+3)]
        if len(mid_region) > 0 and np.min(mid_region) < np.max(h_profile) * 0.3:
            # Gap in middle — likely two characters
            # First char is in left half
            left_half = text_only[:, :mid]
            # For now, mark as compound
            if text_width > 20:
                return "Q2"  # placeholder — need better distinction

    # Simple heuristic based on pixel patterns
    # Top-half density vs bottom-half density
    top_half = text_only[:th//2, :]
    bot_half = text_only[th//2:, :]
    top_density = np.sum(top_half > 0) / max(1, top_half.size)
    bot_density = np.sum(bot_half > 0) / max(1, bot_half.size)

    # Left-half vs right-half
    left_half = text_only[:, :tw//2]
    right_half = text_only[:, tw//2:]
    left_density = np.sum(left_half > 0) / max(1, left_half.size)
    right_density = np.sum(right_half > 0) / max(1, right_half.size)

    # Center column density (vertical stroke indicator)
    center_col = h_profile[tw//2] if tw > 0 else 0
    max_col = np.max(h_profile) if len(h_profile) > 0 else 1

    # These are rough heuristics - may need tuning
    # Q: fairly symmetric, round
    # W: wider, valley in middle of v_profile
    # E: left-heavy (vertical bar on left)
    # R: top-heavy
    # F: top-heavy + left-heavy
    # D: right-heavy (curve on right)

    if left_density > right_density * 1.4 and top_density > bot_density * 1.2:
        return "F"
    elif left_density > right_density * 1.3:
        return "E"
    elif top_density > bot_density * 1.4:
        return "R"
    elif bot_density > top_density * 1.3:
        return "Q"
    elif density > 0.45:
        return "W"
    else:
        return "Q"  # Default fallback


def read_labels_from_video(video_path: str, step_positions: list[int]) -> list[str]:
    """
    Read key labels from a video by analyzing the bar text.
    Tries multiple timestamps in case some frames are clearer.
    """
    labels = []

    for seek_time in [2.5, 3.0, 2.0, 3.5]:
        frame = extract_bar_frame(video_path, seek_time)
        if frame is None:
            continue

        text_row = get_text_row(frame)
        crops = extract_label_crops(text_row, step_positions)

        labels = [classify_label(c) for c in crops]

        # If we got mostly non-"?" results, use them
        unknown_count = labels.count("?")
        if unknown_count <= len(labels) * 0.3:
            break

    return labels


if __name__ == "__main__":
    import sys
    video_path = sys.argv[1] if len(sys.argv) > 1 else "videos/Yasuo/Yasuo E  Q  AA  E.mp4"

    # Use step positions from the analyzer
    frame = extract_bar_frame(video_path, 2.5)
    if frame is not None:
        text_row = get_text_row(frame)
        cv2.imwrite("tmp_debug_textrow.png", text_row)
        print(f"Text row saved: {text_row.shape}")

        # Test with known positions for this video
        positions = [243, 381, 525, 696, 869]
        crops = extract_label_crops(text_row, positions)
        for i, (crop, pos) in enumerate(zip(crops, positions)):
            label = classify_label(crop)
            cv2.imwrite(f"tmp_crop_{i}_{label}.png", crop)
            print(f"  Step {i}: x={pos}, label={label}")
