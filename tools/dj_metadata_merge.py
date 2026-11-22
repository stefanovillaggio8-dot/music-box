"""Merge BASIC analyzer output without granting it authority over audio proofs."""
ADVANCED_FIELDS = ("musicalContent", "structuralBeatPlans", "pcmBeatPlans",
                   "pcmTransition", "pcmIntroSeconds")


def merge_basic_entry(old, incoming):
    if old and old.get("sha") == incoming.get("sha") and old.get("status") == "ok" and incoming.get("status") != "ok":
        return old
    if old and old.get("checkedAt", "") > incoming.get("checkedAt", ""):
        return old
    # A batch can carry a snapshot of older certificates even when its
    # waveform analysis is fresh. The current remote extensions win,
    # including an intentionally removed/revoked extension. A basic writer
    # must never resurrect certificates from its old checkout.
    result = {k: v for k, v in incoming.items() if k not in ADVANCED_FIELDS}
    if old and old.get("sha") == incoming.get("sha") and incoming.get("status") == "ok":
        result.update({k: old[k] for k in ADVANCED_FIELDS if k in old})
    return result
