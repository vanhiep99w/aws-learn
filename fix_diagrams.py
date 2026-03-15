#!/usr/bin/env python3
"""Fix ASCII box diagram alignment in markdown files.

Strategy:
- For each outer box (┌...└ at indent 0), use the ┌ line dw as target.
- For content lines:
  * If line ends with single │: pad/trim spaces before that │
  * If line ends with │  │ / │ │ / ││ pattern (inner+outer border):
    strip the "  │" suffix (outer border + spaces), trim/pad the remaining
    content to fit, then re-add "  │" at the end
  * If line ends with ┐│ / ┘│ (inner border + outer border):
    adjust ─ count in the inner border
"""
import unicodedata
import sys
import ctypes
import ctypes.util

# Use system wcwidth for accurate terminal width
_libc = ctypes.CDLL(ctypes.util.find_library('c'))


def char_display_width(c):
    cp = ord(c)
    # Use system wcwidth — it matches what the terminal actually renders
    w = _libc.wcwidth(cp)
    if w >= 0:
        return w
    # Fallback for chars wcwidth doesn't know about
    eaw = unicodedata.east_asian_width(c)
    if eaw in ('W', 'F'):
        return 2
    return 1


def display_width(s):
    w = 0
    chars = list(s)
    i = 0
    prev_width = 0  # track width of previous char for FE0F boost
    while i < len(chars):
        cp = ord(chars[i])
        # Keycap sequences: digit + U+FE0F + U+20E3
        if (i + 2 < len(chars)
                and ord(chars[i + 1]) == 0xFE0F
                and ord(chars[i + 2]) == 0x20E3):
            w += 2
            i += 3
            prev_width = 2
            continue
        # U+FE0F (variation selector-16, emoji presentation)
        # Triggers emoji presentation: if base char was width 1, boost to 2
        if cp == 0xFE0F:
            if prev_width == 1:
                w += 1  # boost: base was 1, now renders as 2
            i += 1
            continue
        # U+20E3 (combining enclosing keycap) — zero width
        if cp == 0x20E3:
            i += 1
            continue
        # U+200D (ZWJ) — zero width, and the next char joins with previous
        # (the joined char is already counted via the base char)
        if cp == 0x200D:
            i += 1  # skip ZWJ itself
            if i < len(chars):
                i += 1  # skip joined char (rendered as part of previous glyph)
                # Also skip any trailing FE0F
                while i < len(chars) and ord(chars[i]) == 0xFE0F:
                    i += 1
            prev_width = 0
            continue
        cw = char_display_width(chars[i])
        w += cw
        prev_width = cw
        i += 1
    return w


def fix_box_group(lines, start, end, target_dw):
    for i in range(start, end + 1):
        line = lines[i]
        if not line or len(line) < 2:
            continue

        current_dw = display_width(line)
        if current_dw == target_dw:
            continue

        diff = target_dw - current_dw
        stripped = line.lstrip()
        indent = len(line) - len(stripped)

        # === Outer border line (indent 0, all border chars) ===
        if indent == 0 and stripped and stripped[0] in '┌├└' and stripped[-1] in '┐┤┘':
            inner = stripped[1:-1]
            border_chars = set('─┬┴┼')
            if all(c in border_chars for c in inner):
                if diff > 0:
                    lines[i] = stripped[:-1] + '─' * diff + stripped[-1]
                elif diff < 0:
                    j = len(stripped) - 2
                    while j > 0 and stripped[j] == '─':
                        j -= 1
                    removable = len(stripped) - 2 - j
                    if removable >= abs(diff):
                        lines[i] = stripped[:len(stripped) - 1 + diff] + stripped[-1]
            continue

        # Only process lines ending with │ or ┤
        if line[-1] not in '│┤':
            continue

        # === Inner border line: ends with ┐│ or ┘│ or ┤│ ===
        if len(line) >= 2 and line[-1] == '│' and line[-2] in '┐┘┤':
            if diff > 0:
                lines[i] = line[:-2] + '─' * diff + line[-2:]
            elif diff < 0:
                pre = line[:-2]
                j = len(pre) - 1
                while j >= 0 and pre[j] == '─':
                    j -= 1
                removable = len(pre) - 1 - j
                if removable >= abs(diff):
                    lines[i] = pre[:len(pre) + diff] + line[-2:]
            continue

        # === Border line ending with just ┤ (no outer │ after it) ===
        if line[-1] == '┤':
            if diff > 0:
                lines[i] = line[:-1] + '─' * diff + '┤'
            elif diff < 0:
                pre = line[:-1]
                j = len(pre) - 1
                while j >= 0 and pre[j] == '─':
                    j -= 1
                removable = len(pre) - 1 - j
                if removable >= abs(diff):
                    lines[i] = pre[:len(pre) + diff] + '┤'
            continue

        # === Content line ending with │ ===
        # Detect pattern: ...│  │ or ...│ │ or ...││ (inner border + spaces + outer border)
        # vs simple ...content  │ (just content + spaces + outer border)
        #
        # Strategy: find the second-to-last │. If there are only spaces between
        # second-to-last │ and last │, this is an "inner + outer border" pattern.
        # In that case, preserve the "  │" suffix and pad/trim the content before it.

        pipes = [j for j, c in enumerate(line) if c == '│']

        if len(pipes) >= 3:
            second_last = pipes[-2]
            last = pipes[-1]
            between = line[second_last + 1:last]

            # Check if between second-to-last and last │ there are only spaces
            if all(c == ' ' for c in between):
                # Pattern: content│{spaces}│
                # The suffix is line[second_last:] = │{spaces}│
                suffix = line[second_last:]
                suffix_dw = display_width(suffix)
                content = line[:second_last]
                content_dw = display_width(content)

                # Target content dw = target_dw - suffix_dw
                target_content_dw = target_dw - suffix_dw

                if content_dw < target_content_dw:
                    # Pad: add spaces before the suffix
                    pad = target_content_dw - content_dw
                    lines[i] = content + ' ' * pad + suffix
                elif content_dw > target_content_dw:
                    # Trim trailing spaces from content
                    trimmed = content.rstrip()
                    trimmed_dw = display_width(trimmed)
                    available = content_dw - trimmed_dw
                    needed = content_dw - target_content_dw
                    if available >= needed:
                        remaining_spaces = available - needed
                        lines[i] = trimmed + ' ' * remaining_spaces + suffix
                continue

        # Simple content line: pad/trim spaces before the last │
        before = line[:-1]
        if diff > 0:
            lines[i] = before + ' ' * diff + '│'
        elif diff < 0:
            trimmed = before.rstrip()
            available = len(before) - len(trimmed)
            if available >= abs(diff):
                lines[i] = trimmed + ' ' * (available + diff) + '│'


VERT_BORDERS = set('│┌┐└┘')
BORDER_FILL = set('─┬┴┼')


def split_at_vert(line):
    """Split a line at vertical border characters (│┌┐└┘).

    Returns: (borders, segments)
    - borders: list of border characters
    - segments: list of strings between consecutive borders
    The line structure is: border[0] + seg[0] + border[1] + seg[1] + ... + border[N]
    """
    borders = []
    segments = []
    current = []

    for ch in line:
        if ch in VERT_BORDERS:
            if borders:
                segments.append(''.join(current))
                current = []
            borders.append(ch)
        else:
            current.append(ch)

    return borders, segments


def fix_inner_columns(lines, start, end):
    """Fix inner column alignment within a box group.

    After outer alignment, inner columns (side-by-side boxes) may still have
    misaligned │ borders. This finds inner ┌ lines, extracts column widths,
    and adjusts content lines to match.
    """
    i = start + 1
    while i < end:
        line = lines[i]
        if not line:
            i += 1
            continue

        # Look for inner column template: line within box that contains ┌
        # but is not the outer ┌ line (which is at start)
        if line[0] != '│' or '┌' not in line or line[-1] != '│':
            i += 1
            continue

        # Parse template line to find column widths
        template_borders, template_segments = split_at_vert(line)
        if len(template_borders) < 4:  # Need outer + at least 1 inner box
            i += 1
            continue

        target_widths = [display_width(s) for s in template_segments]

        # Find matching inner └ line (same number of borders)
        end_inner = None
        for j in range(i + 1, end):
            if lines[j] and '└' in lines[j] and lines[j][0] == '│' and lines[j][-1] == '│':
                b, _ = split_at_vert(lines[j])
                if len(b) == len(template_borders):
                    end_inner = j
                    break

        if end_inner is None:
            i += 1
            continue

        # Fix all lines from template to footer (inclusive)
        for k in range(i, end_inner + 1):
            fix_line_columns(lines, k, target_widths)

        i = end_inner + 1


def fix_line_columns(lines, idx, target_widths):
    """Adjust a single line's column widths to match target widths."""
    line = lines[idx]
    borders, segments = split_at_vert(line)

    if len(segments) != len(target_widths):
        return  # Different structure, skip

    # Safety: skip if any column differs by more than 3 — likely a different
    # column structure rather than a padding issue
    for seg, target_w in zip(segments, target_widths):
        current_w = display_width(seg)
        if abs(current_w - target_w) > 3:
            return

    # Pre-validate: ensure ALL columns can be fixed before changing anything
    adjustments = []
    for seg, target_w in zip(segments, target_widths):
        current_w = display_width(seg)
        if current_w == target_w:
            adjustments.append(('ok', seg))
            continue

        diff = target_w - current_w
        is_fill = len(seg) > 0 and all(c in BORDER_FILL for c in seg)

        if is_fill:
            if diff > 0:
                adjustments.append(('ok', seg + '─' * diff))
            else:
                j = len(seg) - 1
                while j >= 0 and seg[j] == '─':
                    j -= 1
                removable = len(seg) - 1 - j
                if removable >= abs(diff):
                    adjustments.append(('ok', seg[:len(seg) + diff]))
                else:
                    return  # Can't fix, skip entire line
        else:
            if diff > 0:
                adjustments.append(('ok', seg + ' ' * diff))
            else:
                trimmed = seg.rstrip()
                trimmed_w = display_width(trimmed)
                available = current_w - trimmed_w
                needed = abs(diff)
                if available >= needed:
                    adjustments.append(('ok', trimmed + ' ' * (available - needed)))
                else:
                    return  # Can't fix, skip entire line

    # All columns can be fixed — apply
    new_segments = [adj[1] for adj in adjustments]

    # Reassemble: border[0] + seg[0] + border[1] + seg[1] + ... + border[N]
    result = ''
    for j, border in enumerate(borders):
        result += border
        if j < len(new_segments):
            result += new_segments[j]

    lines[idx] = result


def fix_code_block(lines):
    groups = []
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.lstrip()
        indent_len = len(line) - len(stripped)

        if indent_len == 0 and stripped and stripped[0] == '┌' and stripped[-1] == '┐':
            # Skip side-by-side boxes (multiple ┌ on the same line)
            if stripped.count('┌') > 1:
                i += 1
                continue
            header_dw = display_width(stripped)
            end = None
            for j in range(i + 1, len(lines)):
                sj = lines[j].lstrip()
                ij = len(lines[j]) - len(sj)
                if ij == 0 and sj and sj[0] == '└' and sj[-1] == '┘':
                    end = j
                    break
            if end is not None:
                # Find max display width across lines that end with
                # box border characters (│┤) — these define the box width.
                # Lines ending with ┐┘ are corner chars (inner sub-boxes or
                # connectors) and should not influence the target.
                # Lines ending with other chars (← comments, free-form text)
                # are "overflow" and should not influence the target.
                max_dw = header_dw
                for k in range(i, end + 1):
                    ln = lines[k]
                    if ln and ln[-1] in '│┤':
                        dw = display_width(ln)
                        if dw > max_dw:
                            max_dw = dw
                target_dw = max_dw
                groups.append((i, end, target_dw))
                i = end + 1
            else:
                i += 1
        else:
            i += 1

    for s, e, t in groups:
        fix_box_group(lines, s, e, t)
        fix_inner_columns(lines, s, e)
    return lines


def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')
    result = []
    in_code = False
    code_lines = []

    for line in lines:
        if line.strip().startswith('```'):
            if in_code:
                fixed = fix_code_block(code_lines)
                result.extend(fixed)
                code_lines = []
                in_code = False
                result.append(line)
            else:
                in_code = True
                result.append(line)
        elif in_code:
            code_lines.append(line)
        else:
            result.append(line)

    if code_lines:
        result.extend(code_lines)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write('\n'.join(result))


if __name__ == '__main__':
    for fp in sys.argv[1:]:
        fix_file(fp)
        print(f'Fixed: {fp}')
