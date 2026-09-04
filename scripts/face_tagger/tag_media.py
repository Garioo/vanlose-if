"""Proposes player tags for media, by matching faces against the gallery.

Nothing is applied automatically. Matches are written to
public.media_tag_suggestions with a confidence score, and an admin accepts or
rejects each one in the media library — a wrong player tag is worse than a
missing one, so the threshold is deliberately set for precision over recall.

    python scripts/face_tagger/tag_media.py --dry-run
    python scripts/face_tagger/tag_media.py --folder "2026-08-08 Naesby vs Vanlose"
"""

from __future__ import annotations

import argparse
import json

import numpy as np

from common import (
    GALLERY_PATH,
    KIT_PATH,
    cosine,
    dominant_hsv,
    download_image,
    embed_faces,
    fetch_assets,
    fetch_players,
    hsv_distance,
    load_env,
    load_face_model,
    load_ocr,
    normalize_tag,
    number_shirt_box,
    read_numbers,
    supabase_request,
)


def load_gallery() -> dict[str, np.ndarray]:
    if not GALLERY_PATH.exists():
        raise SystemExit(f"Fandt ingen {GALLERY_PATH}. Kør build_gallery.py først.")
    raw = json.loads(GALLERY_PATH.read_text(encoding="utf-8"))
    return {tag: np.asarray(entry["embedding"], dtype=np.float32) for tag, entry in raw.items()}


def load_kit_profile():
    """Kit colours from calibrate_kit.py, or None when it has not been run."""
    if not KIT_PATH.exists():
        return None
    data = json.loads(KIT_PATH.read_text(encoding="utf-8"))
    kits = [tuple(k["hsv"]) for k in data.get("kits", [])]
    return (kits, float(data.get("tolerance", 0.35))) if kits else None


def numbers_to_tags(ocr, image, players_by_number, kit, min_score: float):
    """Player tags read off shirt numbers, keyed to the best OCR score.

    Both teams appear in every match photo, so a number is only accepted when
    the shirt it sits on matches one of the club's kit colours. Without that
    check about half the numbers found would belong to the opposition.
    """
    matches: dict[str, float] = {}
    for digits, box, score in read_numbers(ocr, image):
        if score < min_score or digits not in players_by_number:
            continue
        if kit is not None:
            colour = dominant_hsv(image, number_shirt_box(box, image.shape))
            if colour is None:
                continue
            kits, tolerance = kit
            if not any(hsv_distance(colour, k) <= tolerance for k in kits):
                continue
        tag = players_by_number[digits]
        matches[tag] = max(matches.get(tag, 0.0), score)
    return matches


def existing_suggestions() -> tuple[set[tuple[str, str]], dict[tuple[str, str], str]]:
    """Splits what is already on file into decided and still-pending.

    A pair the admin has accepted or rejected is settled and must never come
    back. A pair still pending is different: if a second signal now corroborates
    it, refreshing it is exactly the point of running both detectors, so those
    stay eligible for an upgrade rather than being skipped as duplicates.
    """
    response = supabase_request("GET", "media_tag_suggestions?select=public_id,tag,status,source")
    decided: set[tuple[str, str]] = set()
    pending: dict[tuple[str, str], str] = {}
    for row in response.json():
        key = (row["public_id"], row["tag"])
        if row["status"] == "pending":
            pending[key] = row.get("source") or "face"
        else:
            decided.add(key)
    return decided, pending


def emit(args, payload: dict) -> None:
    """Final machine-readable line, so the admin button can report a result."""
    if args.json:
        print("RESULT " + json.dumps(payload))


def main() -> None:
    parser = argparse.ArgumentParser(description="Foreslå spillertags ud fra ansigter")
    parser.add_argument(
        "--threshold",
        type=float,
        # Measured against hand-applied tags: 0.55 gives ~88% agreement at ~29%
        # recall, against ~75% at ~31% for 0.45. Recall barely moves, so the
        # higher bar just buys fewer wrong proposals to reject by hand.
        default=0.55,
        help="Mindste cosine-lighed før et match foreslås (standard: 0.55)",
    )
    parser.add_argument("--folder", help="Begræns til én undermappe")
    parser.add_argument("--no-numbers", action="store_true", help="Slå aflæsning af rygnumre fra")
    parser.add_argument(
        "--number-score",
        type=float,
        default=0.6,
        help="Mindste OCR-sikkerhed for et rygnummer (standard: 0.6)",
    )
    parser.add_argument(
        "--kit-tolerance",
        type=float,
        # Separate from the clustering distance used to *find* the kit colours:
        # that one decides which samples belong together, this one decides how
        # far a shirt may sit from the result and still count as ours. Raising
        # it admits more of our own players in shadow — and more opponents.
        default=None,
        help="Hvor langt en trøjefarve må ligge fra kitfarven (standard: fra kit_colours.json)",
    )
    parser.add_argument("--only-untagged", action="store_true", help="Spring medier over der allerede har tags")
    parser.add_argument("--dry-run", action="store_true", help="Vis forslag uden at gemme dem")
    parser.add_argument(
        "--json",
        action="store_true",
        help="Afslut med én JSON-linje med resultatet (bruges af knappen i admin)",
    )
    args = parser.parse_args()

    load_env()
    gallery = load_gallery()
    print(f"Reference for {len(gallery)} spillere")

    players_by_number: dict[str, str] = {}
    kit = None
    ocr = None
    if not args.no_numbers:
        players_by_number = {
            str(p["number"]).strip(): normalize_tag(p["name"])
            for p in fetch_players()
            if str(p.get("number") or "").strip().isdigit()
        }
        kit = load_kit_profile()
        if kit is not None and args.kit_tolerance is not None:
            kit = (kit[0], args.kit_tolerance)
        if kit is None:
            print(
                "Advarsel: ingen kit_colours.json — rygnumre kan ikke skelnes fra modstanderens.\n"
                "          Kør calibrate_kit.py, eller brug --no-numbers."
            )
            players_by_number = {}
        else:
            ocr = load_ocr()
            print(f"Aflæser rygnumre for {len(players_by_number)} spillere ({len(kit[0])} kitfarve(r))")

    assets = fetch_assets()
    if args.folder:
        prefix = f"vanlose-if/{args.folder}/"
        assets = [a for a in assets if a.public_id.startswith(prefix)]
    if args.only_untagged:
        assets = [a for a in assets if not a.tags]
    print(f"Gennemgår {len(assets)} medier")

    # A dry run reports every match it finds, including ones already queued.
    decided, pending = (set(), {}) if args.dry_run else existing_suggestions()
    app = load_face_model()

    rows: list[dict] = []
    new_pairs: list[tuple[str, str]] = []
    upgraded: list[tuple[str, str]] = []
    for index, asset in enumerate(assets, start=1):
        image = download_image(asset.url)
        if image is None:
            continue

        # Best face score per player across all faces in the photo.
        by_face: dict[str, float] = {}
        for face in embed_faces(app, image):
            for tag, reference in gallery.items():
                score = cosine(face, reference)
                if score >= args.threshold and score > by_face.get(tag, 0.0):
                    by_face[tag] = score

        by_number = (
            numbers_to_tags(ocr, image, players_by_number, kit, args.number_score)
            if ocr is not None
            else {}
        )
        if not by_face and not by_number:
            continue

        current = {normalize_tag(t) for t in asset.tags}
        best: dict[str, tuple[float, str]] = {}
        for tag in set(by_face) | set(by_number):
            face_score, number_score = by_face.get(tag), by_number.get(tag)
            if face_score is not None and number_score is not None:
                # Two independent signals agreeing is the strongest evidence
                # available here, so it outranks either on its own.
                source = "face+number"
                confidence = min(0.99, max(face_score, number_score) + 0.15)
            elif face_score is not None:
                source, confidence = "face", face_score
            else:
                source, confidence = "number", number_score
            best[tag] = (confidence, source)

        for tag, (confidence, source) in sorted(best.items(), key=lambda kv: -kv[1][0]):
            key = (asset.public_id, tag)
            if tag in current or key in decided:
                continue

            note = ""
            if key in pending:
                # Already queued. Only worth rewriting when a second signal has
                # since confirmed it, which raises it up the reviewer's list.
                if source != "face+number" or pending[key] == "face+number":
                    continue
                note = " — bekræftet"
                upgraded.append(key)
            else:
                new_pairs.append(key)

            rows.append(
                {
                    "public_id": asset.public_id,
                    "tag": tag,
                    "confidence": round(confidence, 4),
                    "status": "pending",
                    "source": source,
                }
            )
            print(f"  [{index}/{len(assets)}] {asset.public_id} -> {tag} ({confidence:.2f}, {source}){note}")

    if not rows:
        print("\nIngen nye forslag.")
        emit(args, {"suggestions": 0, "scanned": len(assets)})
        return

    if args.dry_run:
        print(f"\n{len(rows)} forslag (dry run — intet gemt).")
        emit(args, {"suggestions": len(rows), "scanned": len(assets), "dry_run": True})
        return

    # on_conflict keeps an existing review rather than resetting it to pending.
    for start in range(0, len(rows), 200):
        supabase_request(
            "POST",
            "media_tag_suggestions?on_conflict=public_id,tag",
            # merge rather than ignore: decided pairs are already filtered out
            # above, so the only rows this can overwrite are pending ones being
            # upgraded, which is intended.
            headers={"Prefer": "resolution=merge-duplicates,return=minimal"},
            data=json.dumps(rows[start : start + 200]),
        )
    summary = f"\nGemte {len(new_pairs)} nye forslag"
    if upgraded:
        summary += f" og bekræftede {len(upgraded)} eksisterende"
    print(summary + " til gennemsyn i mediebiblioteket.")
    emit(args, {"suggestions": len(new_pairs), "upgraded": len(upgraded), "scanned": len(assets)})


if __name__ == "__main__":
    main()
