"""Relabel aligner words with the script's own spelling.

The Kokoro path times words with Whisper, which re-spells what it hears ("twenty thousand dollars" -> "$20 ,000",
"in-home" -> "and Home", "two to three" -> "2 -3"). On-screen text must say exactly what the script says, so each
line's Whisper words are matched against the line's script tokens and the script tokens inherit the timing.
"""
import difflib, re
import numpy as np

norm = lambda s: re.sub(r'[^a-z0-9]', '', s.lower())


def relabel(words, lines):
    by_line = {}
    for w in words: by_line.setdefault(w.get('line'), []).append(w)
    out = []
    for ln in lines:
        W = by_line.get(ln['id'], [])
        toks = ln['text'].replace('"', '').split()
        if not W:
            continue
        sm = difflib.SequenceMatcher(a=[norm(w['w']) for w in W], b=[norm(t) for t in toks], autojunk=False)
        for op, i1, i2, j1, j2 in sm.get_opcodes():
            if op == 'equal':
                out += [{**W[i1 + k], 'w': toks[j1 + k]} for k in range(i2 - i1)]
            elif op in ('replace', 'insert'):
                if op == 'replace': a, b = W[i1]['t0'], W[i2 - 1]['t1']
                else:   # script words Whisper never heard: squeeze them in at the boundary
                    prev = out[-1]['t1'] if out else (W[0]['t0'] if W else ln['t0'])
                    nxt = W[i1]['t0'] if i1 < len(W) else prev + 0.2
                    a, b = prev, max(prev + 0.05 * (j2 - j1), nxt)
                L = [max(1, len(norm(t))) for t in toks[j1:j2]]; tot = sum(L); t = a
                for tok, l in zip(toks[j1:j2], L):
                    d = (b - a) * l / tot
                    out.append({'w': tok, 't0': round(t, 3), 't1': round(t + d, 3), 'line': ln['id']}); t += d
            # 'delete': Whisper heard something the script doesn't say -> drop it
    return out


def relabel_full(words, lines):
    """Like relabel, for one continuous take: Whisper words carry no line id, so the whole script is aligned at once and
    each script token keeps the id of the line it came from; line t0/t1 follow from their first/last word."""
    toks = [(t, ln['id']) for ln in lines for t in ln['text'].replace('"', '').split()]
    W = [{**w, 'line': '_'} for w in words]
    out = relabel(W, [{'id': '_', 'text': ' '.join(t for t, _ in toks), 't0': W[0]['t0'] if W else 0}])
    for w, (_, lid) in zip(out, toks): w['line'] = lid
    L = []
    for ln in lines:
        ws = [w for w in out if w['line'] == ln['id']]
        if ws: L.append({'id': ln['id'], 'text': ln['text'], 't0': ws[0]['t0'], 't1': ws[-1]['t1']})
    return out, L


def tighten(wav, sr, words, lines, max_gap):
    """Shorten pauses longer than max_gap (by the level envelope) and move every word/line time with them."""
    hop = int(0.01 * sr); n = len(wav) // hop
    db = 20 * np.log10(np.sqrt(np.mean(wav[:n * hop].reshape(n, hop) ** 2, axis=1)) + 1e-9)
    quiet = db < (np.percentile(db, 95) - 38)
    cuts, i = [], 0                       # (start_s, removed_s)
    while i < n:
        if quiet[i]:
            j = i
            while j < n and quiet[j]: j += 1
            dur = (j - i) * 0.01
            if dur > max_gap and i > 0 and j < n:
                keep = max_gap; a0 = i * 0.01 + keep / 2; cuts.append((a0, dur - keep))
            i = j
        else: i += 1
    if not cuts: return wav, words, lines
    shift = lambda t: t - sum(r for (c, r) in cuts if c < t)
    out, last = [], 0
    for (c, r) in cuts:
        a_ = int(c * sr); out.append(wav[last:a_]); last = a_ + int(r * sr)
    out.append(wav[last:])
    for w in words: w['t0'], w['t1'] = round(shift(w['t0']), 3), round(shift(w['t1']), 3)
    for l in lines: l['t0'], l['t1'] = round(shift(l['t0']), 3), round(shift(l['t1']), 3)
    print(f'tightened {len(cuts)} pauses, -{sum(r for _, r in cuts):.2f}s')
    return np.concatenate(out), words, lines
