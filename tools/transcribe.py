#!/usr/bin/env python3
"""Fetch a sermon transcript with the Gemini API (it reads the public YouTube URL itself).

For every sermons/*/sermon.json that has no transcript.md yet, ask Gemini for the sermon part of the
service, verbatim, with timestamps, plus the key messages. Needs GEMINI_API_KEY.
  python3 tools/transcribe.py            # all sermons missing a transcript
  python3 tools/transcribe.py --check    # only check that the key works (tiny request)
"""
import glob, json, os, sys, time, urllib.error, urllib.request

API = "https://generativelanguage.googleapis.com/v1beta"
MODELS = ["gemini-3.5-flash-lite", "gemini-3.8-flash"]  # first that works wins; cheapest first

PROMPT = """이 영상은 한국 교회의 주일예배 실황입니다. 설교 제목: "{title}" (본문: {passage}, 설교: {preacher}).
1) 예배 중 '설교' 부분만 찾아 시작/끝 시각을 적으세요.
2) 설교를 처음부터 끝까지 들리는 그대로 한국어로 받아 적으세요. 요약하거나 다듬지 말고, 문단마다 [mm:ss] 시각을 붙이세요.
   성경 봉독 구절도 들리는 그대로 적으세요.
3) 마지막에 '## 핵심 메시지' (3줄), '## 인용하기 좋은 문장' (설교자의 말 그대로 5–8개, 각 [mm:ss])를 덧붙이세요.
출력은 마크다운: '# 설교 받아쓰기', '설교 구간: [시작]–[끝]', '## 본문' 순서."""


def call(model, body, key, timeout=900):
    req = urllib.request.Request(f"{API}/models/{model}:generateContent", data=json.dumps(body).encode(),
                                 headers={"Content-Type": "application/json", "x-goog-api-key": key})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.load(r)


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

    for meta_path in sorted(glob.glob("sermons/*/sermon.json")):
        out = os.path.join(os.path.dirname(meta_path), "transcript.md")
        if os.path.exists(out):
            continue
        meta = json.load(open(meta_path, encoding="utf-8"))
        body = {
            "contents": [{"parts": [{"file_data": {"file_uri": meta["url"], "mime_type": "video/*"}},
                                    {"text": PROMPT.format(**meta)}]}],
            "generationConfig": {"mediaResolution": "MEDIA_RESOLUTION_LOW", "maxOutputTokens": 65536,
                                 "temperature": 0.2},
        }
        for m in [ok] + [x for x in MODELS if x != ok]:
            print(f"… {meta_path}: transcribing with {m}")
            t0 = time.time()
            try:
                try:
                    txt, why = text_of(call(m, body, key))
                except urllib.error.HTTPError as e:
                    if e.code != 400:
                        raise
                    print(f"⚠️  {m}: {err(e)} — retrying with default settings")
                    txt, why = text_of(call(m, {"contents": body["contents"]}, key))
            except urllib.error.HTTPError as e:
                print(f"⚠️  {m}: {err(e)}")
                continue
            if not txt.strip():
                print(f"⚠️  {m}: empty answer ({why})")
                continue
            open(out, "w", encoding="utf-8").write(txt.strip() + f"\n\n<!-- {m}, finish={why}, {time.time()-t0:.0f}s -->\n")
            print(f"✅ wrote {out} ({len(txt)} chars, finish={why})")
            break
        else:
            sys.exit(f"❌ could not transcribe {meta_path}")


if __name__ == "__main__":
    main()
