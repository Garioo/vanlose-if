"""Shared helpers for the face tagging scripts.

Reads configuration from the project's .env.local so there is a single place
where Cloudinary and Supabase credentials live.
"""

from __future__ import annotations

import os
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import cv2
import numpy as np
import requests

PROJECT_ROOT = Path(__file__).resolve().parents[2]
GALLERY_PATH = Path(__file__).resolve().parent / "player_faces.json"
KIT_PATH = Path(__file__).resolve().parent / "kit_colours.json"

MEDIA_ROOT = "vanlose-if"

# Youth media is deliberately out of scope: the reference gallery is built from
# the first-team roster only, and any asset whose path looks like youth content
# is skipped outright. Widening this needs a consent decision first, not just a
# code change — see README.md.
YOUTH_PATTERN = re.compile(r"(^|/)(ungdom|u\d{1,2})(/|$)", re.IGNORECASE)


def load_env() -> None:
    """Loads .env.local into os.environ without adding a dependency."""
    env_path = PROJECT_ROOT / ".env.local"
    if not env_path.exists():
        sys.exit(f"Fandt ikke {env_path}")

    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip("\"'"))


def require_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        sys.exit(f"Mangler {name} i .env.local")
    return value


# --------------------------------------------------------------------------
# Supabase (REST, service role)
# --------------------------------------------------------------------------


def supabase_request(method: str, path: str, **kwargs) -> requests.Response:
    base = require_env("NEXT_PUBLIC_SUPABASE_URL").rstrip("/")
    key = require_env("SUPABASE_SERVICE_ROLE_KEY")
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        **kwargs.pop("headers", {}),
    }
    response = requests.request(method, f"{base}/rest/v1/{path}", headers=headers, timeout=60, **kwargs)
    if not response.ok:
        sys.exit(f"Supabase {method} {path} fejlede: {response.status_code} {response.text}")
    return response


def fetch_players() -> list[dict]:
    """First-team roster. Youth squads live elsewhere and stay out of scope."""
    response = supabase_request("GET", "players?select=id,name,number,status")
    return response.json()


# --------------------------------------------------------------------------
# Cloudinary
# --------------------------------------------------------------------------


@dataclass
class Asset:
    public_id: str
    url: str
    tags: list[str]
    resource_type: str


def fetch_assets() -> list[Asset]:
    """Every image under the club root, paging to the end of the cursor."""
    import cloudinary
    import cloudinary.api

    cloudinary.config(
        cloud_name=require_env("CLOUDINARY_CLOUD_NAME"),
        api_key=require_env("CLOUDINARY_API_KEY"),
        api_secret=require_env("CLOUDINARY_API_SECRET"),
        secure=True,
    )

    assets: list[Asset] = []
    cursor = None
    while True:
        kwargs = dict(type="upload", prefix=f"{MEDIA_ROOT}/", resource_type="image", tags=True, max_results=500)
        if cursor:
            kwargs["next_cursor"] = cursor
        result = cloudinary.api.resources(**kwargs)
        for r in result.get("resources", []):
            public_id = r["public_id"]
            if YOUTH_PATTERN.search(public_id):
                continue
            assets.append(
                Asset(
                    public_id=public_id,
                    url=r["secure_url"],
                    tags=r.get("tags") or [],
                    resource_type=r.get("resource_type", "image"),
                )
            )
        cursor = result.get("next_cursor")
        if not cursor:
            break
    return assets


def sized_url(url: str, width: int = 1920) -> str:
    """A downscaled delivery URL — detection does not need the full original."""
    marker = "/upload/"
    index = url.find(marker)
    if index == -1:
        return url
    head = url[: index + len(marker)]
    return f"{head}f_jpg,q_auto,c_limit,w_{width}/{url[index + len(marker):]}"


def download_image(url: str, width: int = 1920) -> np.ndarray | None:
    try:
        response = requests.get(sized_url(url, width), timeout=60)
        response.raise_for_status()
    except requests.RequestException:
        return None

    buffer = np.frombuffer(response.content, dtype=np.uint8)
    return cv2.imdecode(buffer, cv2.IMREAD_COLOR)


# --------------------------------------------------------------------------
# Faces
# --------------------------------------------------------------------------


def normalize_tag(value: str) -> str:
    return value.lower().strip()


def load_face_model(det_size: int = 1024):
    """InsightFace buffalo_l: detection + a 512-d recognition embedding.

    Chosen over dlib/face_recognition because match photography is mostly
    side-on, motion-blurred and distant, where dlib's accuracy drops sharply —
    and because it installs cleanly on Apple Silicon.

    1024 rather than 640, paired with the 1920px source above: measured on
    already-tagged photos, the larger size finds no extra faces but produces
    cleaner embeddings from the same ones — false proposals dropped from 5 to 3
    at an unchanged recall, which is the trade that matters for a review queue.
    """
    from insightface.app import FaceAnalysis

    app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
    app.prepare(ctx_id=-1, det_size=(det_size, det_size))
    return app


def embed_faces(app, image: np.ndarray, min_det_score: float = 0.5) -> list[np.ndarray]:
    """L2-normalised embeddings for every confidently detected face."""
    faces = app.get(image)
    embeddings = []
    for face in faces:
        if face.det_score < min_det_score:
            continue
        vector = np.asarray(face.normed_embedding, dtype=np.float32)
        embeddings.append(vector)
    return embeddings


def cosine(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b))


def largest_cluster(embeddings: Iterable[np.ndarray], threshold: float) -> list[int]:
    """Indices of the biggest group of mutually similar faces.

    A player appears in every photo tagged with their name; everyone else
    varies. So the dominant cluster across those photos is the player, which is
    what lets the gallery be built from existing tags without hand-labelling
    individual faces.
    """
    vectors = list(embeddings)
    if not vectors:
        return []

    neighbours = []
    for i, vector in enumerate(vectors):
        members = [j for j, other in enumerate(vectors) if cosine(vector, other) >= threshold]
        neighbours.append(members)

    seed = max(range(len(vectors)), key=lambda i: len(neighbours[i]))
    return neighbours[seed]


# --------------------------------------------------------------------------
# Shirt colour and numbers
# --------------------------------------------------------------------------


def torso_box(bbox, image_shape) -> tuple[int, int, int, int] | None:
    """A patch of shirt below a face box.

    Used both to learn the club's kit colours and to check the shirt a detected
    number sits on. Roughly one face-height below the chin and one face-width
    wide, which lands on the chest for an upright player.
    """
    x1, y1, x2, y2 = [int(v) for v in bbox]
    fw, fh = x2 - x1, y2 - y1
    if fw <= 0 or fh <= 0:
        return None

    height, width = image_shape[:2]
    tx1 = max(0, int(x1 - fw * 0.25))
    tx2 = min(width, int(x2 + fw * 0.25))
    ty1 = min(height, int(y2 + fh * 0.35))
    ty2 = min(height, int(y2 + fh * 1.5))
    if tx2 - tx1 < 4 or ty2 - ty1 < 4:
        return None
    return tx1, ty1, tx2, ty2


def dominant_hsv(image: np.ndarray, box: tuple[int, int, int, int]) -> tuple[float, float, float] | None:
    """Median HSV of a patch, ignoring the darkest and lightest pixels.

    The median resists shadow, grass showing through and sponsor print far
    better than a mean would.
    """
    x1, y1, x2, y2 = box
    patch = image[y1:y2, x1:x2]
    if patch.size == 0:
        return None

    hsv = cv2.cvtColor(patch, cv2.COLOR_BGR2HSV)
    v = hsv[:, :, 2]
    keep = (v > 30) & (v < 245)
    if keep.sum() < 10:
        keep = np.ones_like(v, dtype=bool)

    pixels = hsv[keep]
    return tuple(float(x) for x in np.median(pixels, axis=0))


def hsv_distance(a: tuple[float, float, float], b: tuple[float, float, float]) -> float:
    """Distance between two HSV colours, with hue wrapping at 180 (OpenCV).

    Hue dominates, but a washed-out or near-black shirt has unstable hue, so
    saturation and value carry weight too.
    """
    dh = abs(a[0] - b[0])
    dh = min(dh, 180 - dh) / 90.0
    ds = abs(a[1] - b[1]) / 255.0
    dv = abs(a[2] - b[2]) / 255.0
    return float(np.sqrt(2.0 * dh * dh + ds * ds + dv * dv))


def load_ocr():
    """RapidOCR runs on the ONNX runtime already installed for InsightFace."""
    from rapidocr_onnxruntime import RapidOCR

    return RapidOCR()


def read_numbers(ocr, image: np.ndarray) -> list[tuple[str, tuple[int, int, int, int], float]]:
    """Shirt-number candidates as (digits, box, score).

    Only 1-2 digit runs are kept: squad numbers are at most two digits, and
    longer strings are sponsor text or advertising hoardings.
    """
    result, _ = ocr(image)
    found = []
    for entry in result or []:
        box, text, score = entry[0], str(entry[1]).strip(), float(entry[2])
        digits = "".join(ch for ch in text if ch.isdigit())
        if not digits or len(digits) > 2 or digits != text:
            continue
        xs = [int(p[0]) for p in box]
        ys = [int(p[1]) for p in box]
        found.append((str(int(digits)), (min(xs), min(ys), max(xs), max(ys)), score))
    return found


def number_shirt_box(box: tuple[int, int, int, int], image_shape) -> tuple[int, int, int, int]:
    """The shirt immediately around a number, for the kit colour check."""
    x1, y1, x2, y2 = box
    w, h = x2 - x1, y2 - y1
    height, width = image_shape[:2]
    return (
        max(0, x1 - w),
        max(0, y1 - int(h * 0.4)),
        min(width, x2 + w),
        min(height, y2 + int(h * 0.4)),
    )
