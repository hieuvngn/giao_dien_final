#!/usr/bin/env python3
"""Self-host Google Fonts: download woff2 + rewrite CSS to local files.
Output: public/fonts/fonts.css + public/fonts/*.woff2
"""
import re
import os
import hashlib
import urllib.request

OUT_DIR = "/home/z/my-project/public/fonts"
UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)

FAMILIES = [
    "https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&display=swap",
    "https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap",
    "https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&display=swap",
]


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    css_parts = []
    seen = {}
    for css_url in FAMILIES:
        css = fetch(css_url).decode("utf-8")
        urls = re.findall(r"url\((https://[^)]+)\)", css)
        for u in urls:
            if u in seen:
                continue
            data = fetch(u)
            name = (
                hashlib.md5(u.encode()).hexdigest()[:10]
                + "-"
                + u.rsplit("/", 1)[-1].split("?")[0]
            )
            if not name.endswith(".woff2"):
                name += ".woff2"
            with open(os.path.join(OUT_DIR, name), "wb") as f:
                f.write(data)
            seen[u] = name
            print(f"downloaded {name} ({len(data)} bytes)")
        for u, name in seen.items():
            css = css.replace(u, f"/fonts/{name}")
        css_parts.append(f"/* source: {css_url} */\n{css}")
    out = "\n".join(css_parts)
    with open(os.path.join(OUT_DIR, "fonts.css"), "w") as f:
        f.write(out)
    print(f"\nwrote fonts.css ({len(out)} bytes), {len(seen)} font files")


if __name__ == "__main__":
    main()
