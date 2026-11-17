"""Offline CTC observations, including a separately observed word separator.

No annotation word times are inputs. A forced character path alone is never
evidence that the expected word was freely recognized.
"""
import itertools
import unicodedata
import numpy as np


def normalize(text, labels):
    return ''.join(c for c in unicodedata.normalize('NFKD', text.upper())
                   if c in labels and c not in ('-', '|'))


def observed_words(emission, words, labels, start):
    vocab = {c: i for i, c in enumerate(labels)}
    spellings = [normalize(w['text'], vocab) for w in words]
    if not words or any(not s for s in spellings):
        return []
    tokens = [vocab[c] for c in '|'.join(spellings)]
    ownership = []
    for i, spelling in enumerate(spellings):
        ownership.extend([i] * len(spelling))
        if i < len(words) - 1:
            ownership.append(-1)
    states = np.zeros(2 * len(tokens) + 1, dtype=int)
    states[1::2] = tokens
    frames, count = len(emission), len(states)
    if frames < len(tokens) or frames * count > 12000000:
        return []
    previous = np.full(count, -1e20)
    previous[0] = 0
    history = np.zeros((frames, count), dtype=np.int8)
    indices = np.arange(count)
    skip = (indices >= 2) & (states != np.roll(states, 2)) & (states != 0)
    for frame in range(frames):
        one = np.r_[-1e20, previous[:-1]]
        two = np.r_[-1e20, -1e20, previous[:-2]]
        two[~skip] = -1e20
        options = np.vstack([previous, one, two])
        move = np.argmax(options, axis=0)
        history[frame] = move
        previous = options[move, indices] + emission[frame, states]
    state = count - 1 if previous[-1] >= previous[-2] else count - 2
    path = []
    for frame in range(frames - 1, -1, -1):
        path.append((frame, state, float(emission[frame, states[state]])))
        state -= int(history[frame, state])
    path.reverse()
    def greedy(lo, hi):
        return ''.join(labels[int(k)] for k, _ in itertools.groupby(
            emission[lo:hi].argmax(axis=1)) if int(k) != 0).replace('|', '')
    output = []
    for i, word in enumerate(words):
        actual = [(f, s, p) for f, s, p in path
                  if s % 2 and ownership[(s - 1) // 2] == i]
        if not actual:
            continue
        lo, hi = actual[0][0], actual[-1][0]
        before = [f for f, s, _ in path if s % 2 and ownership[(s-1)//2] == i-1] if i else []
        after = [f for f, s, _ in path if s % 2 and ownership[(s-1)//2] == i+1] if i+1 < len(words) else []
        context = path[before[-1]+1 if before else lo:after[0] if after else hi+1]
        token_indices = [j for j, owner in enumerate(ownership) if owner == i]
        following, prior = token_indices[-1]+1, token_indices[0]-1
        separator = [f for f, s, _ in path if s % 2 and (s-1)//2 == following] if following < len(tokens) else []
        prior_separator = [f for f, s, _ in path if s % 2 and (s-1)//2 == prior] if prior >= 0 else []
        boundary = [f for f in separator if emission[f, tokens[following]] >= np.log(.8)]
        decoded = greedy(prior_separator[-1]+1 if prior_separator else lo,
                         separator[0] if separator else hi+1)
        output.append({**word, 't': start+lo*.02, 'end': start+(hi+1)*.02,
            'separatorAt': start+boundary[0]*.02 if boundary else None,
            'separatorConfidence': float(np.exp(emission[boundary[0], tokens[following]])) if boundary else None,
            'boundaryGreedyExact': decoded == spellings[i],
            'greedyExact': greedy(lo, hi+1) == spellings[i],
            'confidence': float(np.exp(np.mean([p for _, _, p in actual]))),
            'wholeFrameConfidence': float(np.exp(np.mean([p for _, _, p in path[lo:hi+1]]))),
            'contextConfidence': float(np.exp(np.mean([p for _, _, p in context]))),
            'contextMaximumLogRatio': max(float(np.max(emission[f])-p) for f, _, p in context)})
    return output
