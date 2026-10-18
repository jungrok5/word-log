# House styles

Styles proven on real word-log films, packaged so a new film starts from a kit instead of a blank canvas.
Each folder: `kit.js` (the style's materials and rendering, any story), `STYLE.md` (look, meanings it carries, API,
pitfalls, performance), `template.html` + `script.example.js` (a minimal new scene), and a worked example film.

| slug | style | first film | carries well |
|---|---|---|---|
| `charcoal` | 고딕 목탄 드로잉 (숯·지우개, 붉은 파스텔 하나) | [문틈 A](../sermons/2026-10-18-1cor5/film/scenes/door-a.html) | 어둠과 빛, 유혹, 두려움, 지워짐·회복 |
| `hopper` | 호퍼풍 사실주의 (고요한 방, 투영된 빛) | [문틈 B](../sermons/2026-10-18-1cor5/film/scenes/door-b.html) | 고독, 기다림, 일상의 정적 속 한 번의 변화 |
| `bass` | 솔 바스 그래픽 (흑백 오린 종이, 박자에 맞춘 자막) | [문틈 C](../sermons/2026-10-18-1cor5/film/scenes/door-c.html) | 선명한 대비, 빠른 메시지, 숏츠형 리듬 |
| `puppet` | 그림자극 (빛나는 막, 뚫린 가죽 인형) | [문틈 D](../sermons/2026-10-18-1cor5/film/scenes/door-d.html) | 이야기·우화, 보이지 않는 존재, 무대 같은 극적 장면 |

Preview of all four: https://jungrok5.github.io/word-log/previews/2026-10-18-1cor5/

## Start a film from a style
```
python3 tools/new-film.py sermons/<YYYY-MM-DD>-<본문> --style charcoal --id seed
```
1. Write `scenes/script.js` (beats, lines, end card) from the storyboard.
2. In `scenes/<id>-<slug>.html` replace the template's placeholder subject with the film's one image, using the kit.
3. Stills → `python3 tools/preview.py sermons/<folder>` → push → send the preview link. MP4 only when asked.

`_shared/` holds what every film vendors: `lib.js` (canvas-film harness, phone-safe sizing) and `story.js`
(captions + end card). A film copies its kit and shared files, so improving a kit later never changes an old film.
Add a new house style when a film's style works: same four files, a row above.
