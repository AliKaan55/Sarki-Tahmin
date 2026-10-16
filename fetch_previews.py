import csv
import difflib
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

CSV_PATH = "NEON.csv"
OUT_PATH = "songs.json"
MISSED_PATH = "missed.txt"
COUNTRY = "TR"
DELAY = 3.5

# Daha katı eşik değerleri
TITLE_THRESHOLD = 0.75
ARTIST_THRESHOLD = 0.70
SHORT_TITLE_LEN = 3
SHORT_TITLE_THRESHOLD = 0.95

def norm(s: str) -> str:
    s = s.lower()
    s = re.sub(r"\(.*?\)|\[.*?\]", " ", s)
    s = re.sub(r"\b(feat|ft|remix|live|acoustic|instrumental)\.?\b.*", " ", s)
    s = s.translate(str.maketrans("çğıöşüâîû", "cgiosuaiu"))
    return " ".join("".join(c for c in s if c.isalnum() or c == " ").split())

def is_remix_or_unwanted(spotify_title, itunes_title):
    sp_lower = spotify_title.lower()
    it_lower = itunes_title.lower()
    
    unwanted_keywords = ["remix", "live", "akustik", "acoustic", "instrumental", "slowed", "reverb", "sped up", "mix"]
    
    # Eğer Spotify orijinal şarkıysa ama iTunes sonucu remix/live/vb. ise reddet
    for kw in unwanted_keywords:
        if kw in it_lower and kw not in sp_lower:
            return True
    return False

def read_songs():
    songs, seen = [], set()
    with open(CSV_PATH, encoding="utf-8-sig", newline="") as f:
        for row in csv.DictReader(f):
            uri = row.get("Track URI", "")
            title = row["Track Name"].strip()
            artists = [a.strip() for a in row["Artist Name(s)"].split(";") if a.strip()]
            key = uri or (norm(title), norm(artists[0]) if artists else "")
            if key in seen or not title or not artists:
                continue
            seen.add(key)
            songs.append({
                "uri": uri,
                "title": title,
                "artists": artists,
                "year": row.get("Release Date", "")[:4],
                "popularity": int(row.get("Popularity") or 0),
                "explicit": row.get("Explicit", "").lower() == "true",
                "genres": row.get("Genres", ""),
            })
    return songs

def title_score(song, cand):
    return difflib.SequenceMatcher(None, norm(song["title"]), norm(cand.get("trackName", ""))).ratio()

def artist_score(song, cand):
    cand_artist = norm(cand.get("artistName", ""))
    # Ana sanatçı (ilk sanatçı) eşleşmesi kritik
    primary_artist = norm(song["artists"][0])
    
    primary_match = primary_artist in cand_artist or difflib.SequenceMatcher(None, primary_artist, cand_artist).ratio() > 0.8
    if not primary_match:
        return 0.0 # Ana sanatçı uyuşmuyorsa direkt sıfır ver
        
    scores = [difflib.SequenceMatcher(None, norm(x), cand_artist).ratio() for x in song["artists"]]
    return max(scores) if scores else 0.0

def passes(song, cand):
    itunes_title = cand.get("trackName", "")
    if is_remix_or_unwanted(song["title"], itunes_title):
        return False, 0, 0
        
    t = title_score(song, cand)
    a = artist_score(song, cand)
    
    norm_title = norm(song["title"])
    t_threshold = SHORT_TITLE_THRESHOLD if len(norm_title) <= SHORT_TITLE_LEN else TITLE_THRESHOLD
    
    return (t >= t_threshold) and (a >= ARTIST_THRESHOLD), t, a

def combined(t, a):
    return 0.4 * a + 0.6 * t

def search(term):
    q = urllib.parse.urlencode({
        "term": term, "country": COUNTRY, "media": "music", "entity": "song", "limit": 20,
    })
    url = f"https://itunes.apple.com/search?{q}"
    req = urllib.request.Request(url, headers={"User-Agent": "rap-guess-game/1.0"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=15) as r:
                return json.loads(r.read().decode("utf-8")).get("results", [])
        except urllib.error.HTTPError as e:
            if e.code in (403, 429):
                wait = 30 * (attempt + 1)
                print(f"   hiz siniri ({e.code}), {wait} sn bekleniyor...")
                time.sleep(wait)
            else:
                raise
    raise RuntimeError("hiz siniri asilamadi")

def save(results):
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

def main():
    songs = read_songs()
    print(f"CSV'den {len(songs)} benzersiz sarki okundu.")
    if "--dry-run" in sys.argv:
        for s in songs[:5]:
            print(" ", ", ".join(s["artists"]), "-", s["title"], f"({s['year']})")
        return

    results, done = [], set()
    if os.path.exists(OUT_PATH):
        with open(OUT_PATH, encoding="utf-8") as f:
            results = json.load(f)
        done = {r["uri"] for r in results}

    used_track_ids = {}
    for r in results:
        key = r.get("itunesTrackId") or r.get("previewUrl")
        if key:
            used_track_ids[key] = norm(r["title"]) + "|" + norm(r["artist"])

    missed = []
    if os.path.exists(MISSED_PATH):
        with open(MISSED_PATH, encoding="utf-8") as f:
            missed = [l.strip() for l in f if l.strip()]
    missed_uris = {m.split("\t")[0] for m in missed}

    for i, s in enumerate(songs, 1):
        if s["uri"] in done or s["uri"] in missed_uris:
            continue
        label = f"{', '.join(s['artists'])} - {s['title']}"
        
        query = f"{s['artists'][0]} {s['title']}"
        try:
            cands = [c for c in search(query) if c.get("previewUrl")]
        except Exception as e:
            print(f"[{i}/{len(songs)}] HATA  {label}: {e}")
            time.sleep(DELAY * 2)
            continue

        scored = []
        for c in cands:
            ok, t, a = passes(s, c)
            if ok:
                scored.append((combined(t, a), c))
        scored.sort(key=lambda x: -x[0])

        my_key = norm(s["title"]) + "|" + norm(s["artists"][0])
        chosen = None
        for sc, c in scored:
            track_key = c.get("trackId") or c.get("previewUrl")
            claimed_by = used_track_ids.get(track_key)
            if claimed_by is not None and claimed_by != my_key:
                continue
            chosen = c
            break

        if chosen:
            used_track_ids[chosen.get("trackId") or chosen["previewUrl"]] = my_key
            results.append({
                "uri": s["uri"],
                "title": s["title"],
                "artist": ", ".join(s["artists"]),
                "year": s["year"],
                "popularity": s["popularity"],
                "explicit": s["explicit"],
                "genres": s["genres"],
                "previewUrl": chosen["previewUrl"],
                "itunesTrackId": chosen.get("trackId"),
                "artwork": chosen.get("artworkUrl100", "").replace("100x100", "300x300"),
            })
            print(f"[{i}/{len(songs)}] OK    {label}")
            save(results)
        else:
            missed.append(f"{s['uri']}\t{label}")
            print(f"[{i}/{len(songs)}] YOK   {label}")
            with open(MISSED_PATH, "w", encoding="utf-8") as f:
                f.write("\n".join(missed) + "\n")
        time.sleep(DELAY)

    print(f"\nBitti. {len(results)} sarki songs.json'a kaydedildi, {len(missed)} bulunamadi (missed.txt).")

if __name__ == "__main__":
    main()