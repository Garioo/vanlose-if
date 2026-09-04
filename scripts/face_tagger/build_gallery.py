"""Builds a reference face for every first-team player.

The media library already carries player-name tags applied by hand, so those
tags are the training labels: for each player, every photo tagged with their
name is embedded, the dominant face cluster across those photos is taken to be
that player, and its centroid becomes the reference.

The result is written to player_faces.json next to this script. That file is
gitignored on purpose — face embeddings are biometric data under GDPR Art. 9,
so they stay on the machine that generated them and never reach the database.

    python scripts/face_tagger/build_gallery.py
"""

from __future__ import annotations

import argparse
import json
from collections import defaultdict

import numpy as np

from common import (
    GALLERY_PATH,
    download_image,
    embed_faces,
    fetch_assets,
    fetch_players,
    largest_cluster,
    load_env,
    load_face_model,
    normalize_tag,
)


def main() -> None:
    parser = argparse.ArgumentParser(description="Byg referenceansigter for førsteholdet")
    parser.add_argument(
        "--cluster-threshold",
        type=float,
        default=0.45,
        help="Cosine-lighed for at to ansigter regnes som samme person (standard: 0.45)",
    )
    parser.add_argument(
        "--min-samples",
        type=int,
        default=3,
        help="Mindste antal ansigter i klyngen før en spiller optages (standard: 3)",
    )
    parser.add_argument("--limit-per-player", type=int, default=40, help="Maks. fotos pr. spiller")
    args = parser.parse_args()

    load_env()

    players = fetch_players()
    tag_to_player = {normalize_tag(p["name"]): p for p in players}
    print(f"Førsteholdstrup: {len(players)} spillere")

    assets = fetch_assets()
    print(f"Medier i biblioteket: {len(assets)} (ungdom er filtreret fra)")

    # Group photos by the player tags they already carry.
    by_player: dict[str, list] = defaultdict(list)
    for asset in assets:
        for tag in asset.tags:
            key = normalize_tag(tag)
            if key in tag_to_player:
                by_player[key].append(asset)

    missing = sorted(set(tag_to_player) - set(by_player))
    if missing:
        print(f"Uden taggede fotos (springes over): {', '.join(missing)}")

    app = load_face_model()
    gallery: dict[str, dict] = {}

    # A group photo is tagged with several players, so embed each photo once and
    # reuse the result rather than re-downloading it per player.
    face_cache: dict[str, list[np.ndarray]] = {}

    def faces_for(asset) -> list[np.ndarray]:
        if asset.public_id not in face_cache:
            image = download_image(asset.url)
            face_cache[asset.public_id] = [] if image is None else embed_faces(app, image)
        return face_cache[asset.public_id]

    for tag in sorted(by_player):
        # Photos tagged with exactly one player are the cleanest signal, so use
        # those first and only top up with group shots when there are too few.
        photos = by_player[tag]
        solo = [a for a in photos if sum(1 for t in a.tags if normalize_tag(t) in tag_to_player) == 1]
        solo_ids = {a.public_id for a in solo}
        ordered = solo + [a for a in photos if a.public_id not in solo_ids]
        ordered = ordered[: args.limit_per_player]

        embeddings: list[np.ndarray] = []
        for asset in ordered:
            embeddings.extend(faces_for(asset))

        if not embeddings:
            print(f"  {tag}: ingen ansigter fundet i {len(ordered)} fotos — springes over")
            continue

        cluster = largest_cluster(embeddings, args.cluster_threshold)
        if len(cluster) < args.min_samples:
            print(
                f"  {tag}: største klynge er kun {len(cluster)} ansigt(er) "
                f"af {len(embeddings)} — for usikkert, springes over"
            )
            continue

        centroid = np.mean([embeddings[i] for i in cluster], axis=0)
        centroid = centroid / np.linalg.norm(centroid)

        gallery[tag] = {
            "player_id": tag_to_player[tag]["id"],
            "name": tag_to_player[tag]["name"],
            "embedding": [float(x) for x in centroid],
            "samples": len(cluster),
            "photos": len(ordered),
            "faces_seen": len(embeddings),
        }
        print(f"  {tag}: {len(cluster)}/{len(embeddings)} ansigter fra {len(ordered)} fotos")

    GALLERY_PATH.write_text(json.dumps(gallery, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nSkrev {len(gallery)} referenceansigter til {GALLERY_PATH}")
    if len(gallery) < len(tag_to_player):
        print("Spillere uden reference bliver ikke foreslået — tag flere fotos af dem i hånden først.")


if __name__ == "__main__":
    main()
