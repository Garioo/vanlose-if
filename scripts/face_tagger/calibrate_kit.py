"""Derives the club's kit colours from photos, so shirt numbers can be trusted.

Both teams appear in every match photo and OCR reads an opponent's number just
as clearly as ours, so without a way to tell the shirts apart about half the
numbers found would land on the wrong squad.

A face matching a gallery reference is one of our players, so the shirt below
it is our kit. Clustering those patches gives the colours actually seen in the
photos, home and away, without either being described by hand.

    python scripts/face_tagger/calibrate_kit.py
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
    fetch_assets,
    hsv_distance,
    load_env,
    load_face_model,
    torso_box,
)


def main() -> None:
    parser = argparse.ArgumentParser(description="Udled klubbens spilletøjsfarver fra fotos")
    parser.add_argument("--threshold", type=float, default=0.55, help="Ansigtslighed før et torso-udsnit tælles med")
    parser.add_argument("--max-photos", type=int, default=150, help="Maks. fotos at gennemgå")
    parser.add_argument("--merge-distance", type=float, default=0.35, help="Hvornår to farveprøver hører til samme sæt")
    parser.add_argument("--min-samples", type=int, default=8, help="Mindste antal prøver før et farvesæt gemmes")
    args = parser.parse_args()

    load_env()

    if not GALLERY_PATH.exists():
        raise SystemExit(f"Fandt ingen {GALLERY_PATH}. Kør build_gallery.py først.")
    gallery = json.loads(GALLERY_PATH.read_text(encoding="utf-8"))
    refs = {t: np.asarray(v["embedding"], dtype=np.float32) for t, v in gallery.items()}
    print(f"Reference for {len(refs)} spillere")

    # Only already-tagged photos are worth sampling.
    assets = [a for a in fetch_assets() if a.tags]
    assets = assets[: args.max_photos]
    print(f"Gennemgår {len(assets)} fotos")

    app = load_face_model()
    samples: list[tuple[float, float, float]] = []

    for asset in assets:
        image = download_image(asset.url)
        if image is None:
            continue
        for face in app.get(image):
            if face.det_score < 0.5:
                continue
            vector = np.asarray(face.normed_embedding, dtype=np.float32)
            if not any(cosine(vector, r) >= args.threshold for r in refs.values()):
                continue
            box = torso_box(face.bbox, image.shape)
            if box is None:
                continue
            colour = dominant_hsv(image, box)
            if colour is not None:
                samples.append(colour)

    print(f"Indsamlede {len(samples)} torso-farveprøver fra bekræftede spillere")
    if len(samples) < args.min_samples:
        raise SystemExit("For få prøver til at udlede farver. Tag flere fotos i hånden og prøv igen.")

    # Greedy clustering: home and away kits mean more than one group is normal.
    clusters: list[list[tuple[float, float, float]]] = []
    for colour in samples:
        for cluster in clusters:
            centre = tuple(np.median(cluster, axis=0))
            if hsv_distance(colour, centre) <= args.merge_distance:
                cluster.append(colour)
                break
        else:
            clusters.append([colour])

    kept = [c for c in sorted(clusters, key=len, reverse=True) if len(c) >= args.min_samples]
    if not kept:
        raise SystemExit("Ingen farveklynge var stor nok til at være pålidelig.")

    profile = []
    for cluster in kept:
        centre = [float(x) for x in np.median(cluster, axis=0)]
        profile.append({"hsv": centre, "samples": len(cluster)})
        h, s, v = centre
        print(f"  kitfarve HSV({h:.0f}, {s:.0f}, {v:.0f}) fra {len(cluster)} prøver")

    KIT_PATH.write_text(
        json.dumps({"tolerance": args.merge_distance, "kits": profile}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"\nSkrev {len(profile)} kitfarve(r) til {KIT_PATH}")
    ignored = len(samples) - sum(len(c) for c in kept)
    if ignored:
        print(f"{ignored} prøver lå spredt og blev set bort fra (skygge, nærbilleder, målmandstrøje).")


if __name__ == "__main__":
    main()
