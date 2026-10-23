#!/usr/bin/env python3
"""Summarise a sermon with the Gemini API (it watches the public YouTube URL itself).

For every sermons/*/source.json (or sermon.json) of type sermon with a "url" and no material.md yet, ask Gemini for a detailed summary of the
sermon part of the service plus the preacher's own key sentences, verbatim, with timestamps. Needs GEMINI_API_KEY.
Writes material.md (Gemini's film material from the video); summary.md stays for material given by hand (app summary, script, text).
  python3 tools/summarize.py            # all sermons missing a summary
  python3 tools/summarize.py --check    # only check that the key works (tiny request)
"""
import glob, json, os, subprocess, sys, tempfile, time, urllib.error, urllib.request

API = "https://generativelanguage.googleapis.com/v1beta"
MODELS = ["gemini-3.5-flash-lite", "gemini-3.8-flash"]  # first that works wins; cheapest first
if os.environ.get("GEMINI_MODEL"):   # workflow_dispatch input: use exactly this model (e.g. gemini-3.8-flash for accuracy)
    MODELS = [os.environ["GEMINI_MODEL"]]
ONLY = os.path.basename(os.environ.get("ONLY", "").strip().rstrip("/"))   # sermons/<folder> or <folder>: only that one
FORCE = os.environ.get("FORCE", "") in ("1", "true")  # redo even if material.md exists (the old one is kept as material.prev.md)

PROMPT = """이 영상은 한국 교회의 예배 실황입니다. 설교 제목: "{title}" (본문: {passage}, 설교: {preacher}).
이 설교로 30초짜리 임팩트 있는 짧은 영상을 만들려고 합니다. 요약보다 '영상으로 보여 줄 재료'가 필요합니다.
예배 영상 안에서 설교가 시작하는 곳부터 끝나는 곳까지(대개 30–50분) 설교 전체를 끝까지 보고 마크다운으로 정리하세요.
설교에서 실제로 나온 것만 쓰고, 일반론으로 채우지 마세요. 예화·비유·인용(책·저자·인물 포함)은 하나도 빠짐없이 모두 적으세요.
시각은 영상 전체 기준 [h:mm:ss]로 쓰세요.
# 영상 재료
설교 구간: [시작 h:mm:ss]–[끝 h:mm:ss]
## 핵심 메시지 (한 문장)
## 예화·비유·이미지 (설교자가 든 이야기, 비유, 장면 묘사 — 각 [h:mm:ss], 무엇을 어떻게 묘사했는지 구체적으로)
## 인용 (책·인물·영화 등에서 인용한 것: 출처 이름, 설교자가 말한 그대로의 문장, [h:mm:ss])
## 설교자의 말 그대로 (짧고 힘 있는 문장 6–10개, 들리는 그대로, 각 [h:mm:ss])
## 인용된 성경 구절 (장절과 들리는 그대로의 문구)
## 흐름 (도입 → 대지 → 결론, 각 2–3줄)"""


def call(model, body, key, timeout=900):
    req = urllib.request.Request(f"{API}/models/{model}:generateContent", data=json.dumps(body).encode(),
                                 headers={"Content-Type": "application/json", "x-goog-api-key": key})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.load(r)


def interact(model, prompt, url, key, config=None, timeout=900):
    body = {"model": model, "input": [{"type": "text", "text": prompt}, {"type": "video", "uri": url}]}
    if config:
        body["generation_config"] = config
    for attempt in range(4):   # 503 / 429 = the model is overloaded right now: wait and try again (1, 2, 4 min)
        req = urllib.request.Request(f"{API}/interactions", data=json.dumps(body).encode(),
                                     headers={"Content-Type": "application/json", "x-goog-api-key": key})
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code not in (429, 503) or attempt == 3:
                raise
            print(f"   {model}: HTTP {e.code} (busy) — retrying in {60 * 2 ** attempt} s")
            time.sleep(60 * 2 ** attempt)


def upload(path, mime, key):
    """Gemini Files API resumable upload → file uri."""
    size = os.path.getsize(path)
    start = urllib.request.Request(
        f"{API.replace('/v1beta', '/upload/v1beta')}/files", method="POST",
        data=json.dumps({"file": {"display_name": os.path.basename(path)}}).encode(),
        headers={"x-goog-api-key": key, "Content-Type": "application/json", "X-Goog-Upload-Protocol": "resumable",
                 "X-Goog-Upload-Command": "start", "X-Goog-Upload-Header-Content-Length": str(size),
                 "X-Goog-Upload-Header-Content-Type": mime})
    with urllib.request.urlopen(start, timeout=60) as r:
        up = r.headers["X-Goog-Upload-URL"]
    put = urllib.request.Request(up, method="POST", data=open(path, "rb").read(),
                                 headers={"Content-Length": str(size), "X-Goog-Upload-Offset": "0",
                                          "X-Goog-Upload-Command": "upload, finalize"})
    with urllib.request.urlopen(put, timeout=600) as r:
        f = json.load(r)["file"]
    while f.get("state") == "PROCESSING":
        time.sleep(5)
        with urllib.request.urlopen(urllib.request.Request(f"{API}/{f['name']}", headers={"x-goog-api-key": key})) as r:
            f = json.load(r)
    return f["uri"]


def via_audio(model, prompt, url, key):
    """Fallback when Gemini refuses the YouTube link: download the audio here and send that."""
    d = tempfile.mkdtemp()
    src = os.path.join(d, "a.%(ext)s")
    subprocess.run(["yt-dlp", "-q", "--no-playlist", "-f", "bestaudio", "-o", src, url], check=True)
    raw = next(os.path.join(d, x) for x in os.listdir(d))
    mp3 = os.path.join(d, "sermon.mp3")
    subprocess.run(["ffmpeg", "-v", "error", "-i", raw, "-ac", "1", "-ar", "16000", "-b:a", "32k", mp3], check=True)
    print(f"   audio {os.path.getsize(mp3) / 1e6:.1f} MB")
    uri = upload(mp3, "audio/mpeg", key)
    body = {"contents": [{"parts": [{"file_data": {"file_uri": uri, "mime_type": "audio/mpeg"}},
                                    {"text": prompt.replace("이 영상은", "이 녹음은")}]}],
            "generationConfig": {"maxOutputTokens": 16384, "temperature": 0.2}}
    txt, why = text_of(call(model, body, key))
    return txt


def output_text(resp):
    """The text of the model_output step(s) of an Interactions API response."""
    if isinstance(resp.get("output_text"), str):
        return resp["output_text"]
    found = []

    def walk(x, in_output):
        if isinstance(x, dict):
            here = in_output or x.get("type") in ("model_output", "output_text") or x.get("role") == "model"
            if here and x.get("type") in (None, "text", "output_text") and isinstance(x.get("text"), str):
                found.append(x["text"])
            for k, v in x.items():
                walk(v, here or k in ("outputs", "output"))
        elif isinstance(x, list):
            for v in x:
                walk(v, in_output)
    walk(resp, False)
    return "".join(found)


def text_of(resp):
    c = resp.get("candidates") or [{}]
    return "".join(p.get("text", "") for p in c[0].get("content", {}).get("parts", [])), c[0].get("finishReason")


def err(e):
    try:
        return f"HTTP {e.code}: {json.load(e).get('error', {}).get('message', '')[:500]}"
    except Exception:
        return str(e)


def main():
    key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not key:
        sys.exit("❌ GEMINI_API_KEY is empty — add it under Settings → Secrets and variables → Actions → Repository secrets.")
    ok = None
    for m in MODELS:
        try:
            call(m, {"contents": [{"parts": [{"text": "Reply with OK."}]}]}, key, 60)
            ok = m
            print(f"✅ key works ({m})")
            break
        except urllib.error.HTTPError as e:
            print(f"⚠️  {m}: {err(e)}")
    if not ok:
        sys.exit("❌ the key did not work with any model")
    if "--check" in sys.argv:
        return

    paths = {os.path.dirname(p): p for p in sorted(glob.glob("sermons/*/sermon.json"))}
    paths.update({os.path.dirname(p): p for p in sorted(glob.glob("sermons/*/source.json"))})   # source.json wins
    for meta_path in sorted(paths.values()):
        out = os.path.join(os.path.dirname(meta_path), "material.md")
        folder = os.path.basename(os.path.dirname(meta_path))
        if ONLY and folder != ONLY:
            continue
        if os.path.exists(out):
            if not (FORCE and ONLY):
                continue
            os.replace(out, os.path.join(os.path.dirname(meta_path), "material.prev.md"))
        meta = json.load(open(meta_path, encoding="utf-8"))
        if not meta.get("url") or meta.get("type", "sermon") != "sermon" or meta.get("material"):
            continue   # material: "<other folder>" = this film reuses that folder's material
        prompt = PROMPT.format(**meta)
        config = {"temperature": 0.2, "max_output_tokens": 16384, "thinking_level": os.environ.get("THINKING", "low")}
        for m in [ok] + [x for x in MODELS if x != ok]:
            print(f"… {meta_path}: summarising with {m}")
            t0 = time.time()
            try:
                try:
                    resp = interact(m, prompt, meta["url"], key, config)
                except urllib.error.HTTPError as e:
                    if e.code != 400:
                        raise
                    print(f"⚠️  {m}: {err(e)} — retrying with default settings")
                    resp = interact(m, prompt, meta["url"], key)
            except urllib.error.HTTPError as e:
                print(f"⚠️  {m}: {err(e)}")
                continue
            txt = output_text(resp)
            if not txt.strip():
                print(f"⚠️  {m}: no text found; response keys: {list(resp)} · {json.dumps(resp, ensure_ascii=False)[:1500]}")
                continue
            open(out, "w", encoding="utf-8").write(txt.strip() + f"\n\n<!-- {m}, {time.time()-t0:.0f}s -->\n")
            print(f"✅ wrote {out} ({len(txt)} chars)")
            break
        else:
            print(f"… YouTube link refused; trying the audio route with {ok}")
            try:
                txt = via_audio(ok, prompt, meta["url"], key)
                if txt.strip():
                    open(out, "w", encoding="utf-8").write(txt.strip() + f"\n\n<!-- {ok}, audio route -->\n")
                    print(f"✅ wrote {out} ({len(txt)} chars, audio route)")
                    continue
                print("⚠️  audio route: empty answer")
            except Exception as e:
                print(f"⚠️  audio route failed: {err(e) if isinstance(e, urllib.error.HTTPError) else e}")
            sys.exit(f"❌ could not summarise {meta_path}")


if __name__ == "__main__":
    main()
