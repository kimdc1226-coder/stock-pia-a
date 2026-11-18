# 공시자료 정리.xlsx → public/data/disclosures-data.js 변환 + 첨부파일을 public/disclosures/로 복사.
# 사용: python scripts/build-disclosures.py   (프로젝트 루트에서. openpyxl 필요)
# - 원본 폴더 `공시자료/`(엑셀 포함)는 로컬 전용이며 공개 폴더에 넣지 않는다. 엑셀은 절대 복사하지 않는다.
# - A열 제목은 셀의 값(텍스트)만 쓴다. 셀에 걸린 옛 사이트 하이퍼링크 주소는 읽지 않는다.
# - 모든 항목의 분류는 '경영공시'(management)로 일괄 지정한다.
# - D열 파일명은 앞뒤 공백·줄바꿈을 정리하고 NFC로 맞춘 뒤 실제 파일과 정확히 일치해야 한다.
#   일치하지 않으면 FILE_ALIASES에 확인된 대응만 적용하고, 그 밖에는 오류로 멈춘다.
import json, os, re, shutil, sys, unicodedata
from datetime import datetime, date
from urllib.parse import quote

import openpyxl

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, '공시자료')
XLSX = os.path.join(SRC, '공시자료 정리.xlsx')
OUT_DIR = os.path.join(ROOT, 'public', 'disclosures')
OUT_JS = os.path.join(ROOT, 'public', 'data', 'disclosures-data.js')
URL_BASE = '/disclosures/'

# 엑셀 D열 이름과 실제 파일 이름이 다른 경우(확인 후 등록). 2025-02-12 유상증자 공시 → 실제 파일은 0213(내용: 2025년 2월 유상증자 결정, 1부)
FILE_ALIASES = {'20250212 주요경영상황보고_유상증자.pdf': '20250213 주요경영상황보고_유상증자.pdf'}
# 사용자가 확인한 원본 오타 정정(엑셀 원본은 그대로 두고 변환할 때만 고침). (제목, 날짜) → [(틀린 문구, 바른 문구)]
TEXT_FIXES = {
    ('2023년 정기주주총회 결과 공시', '2023.03.31'): [('2022년 3월 31일 개최된', '2023년 3월 31일 개최된')],  # 47행, 2026-11-18 확인
}
# E열(기타) 지시: 본문 이미지·표
BODY_IMAGES = {  # (제목, 날짜) → (원본 이미지, 공개 파일명, 대체 텍스트)
    ('[안내]사무실이전 안내', '2026.03.03'): ('네이버 지도 이미지.png', 'office-map-20260226.png', '이전한 사무실 위치 지도: 서울시 강남구 테헤란로27길 8 (역삼역 인근)'),
}
BODY_TABLES = {  # (제목, 날짜) → 본문 첫 문장 + 표 (원본: 정관 이미지 내용.png)
    ('정관 변경 공시(공고방법)', '2025.07.11'): {
        'text': '당사의 정관이 다음과 같이 변경되었음을 공시합니다.',
        'table': {'head': ['현행', '변경'], 'rows': [[
            '제 4 조 (공고방법)\n이 회사의 공고는 회사의 인터넷 홈페이지(http://www.dkpasset.com)에 게재한다.',
            '제 4 조 (공고방법)\n이 회사의 공고는 회사의 인터넷 홈페이지(http://www.erumasset.com)에 게재한다.']]},
    },
}


def nfc(s):
    return unicodedata.normalize('NFC', s)


def clean_text(s):
    lines = [line.rstrip() for line in str(s).replace('\r\n', '\n').replace('\r', '\n').split('\n')]
    text = '\n'.join(lines).strip()
    return re.sub(r'\n{3,}', '\n\n', text)


def fmt_date(v):
    if isinstance(v, (datetime, date)):
        return v.strftime('%Y.%m.%d')
    m = re.match(r'^\s*(\d{4})\D+(\d{1,2})\D+(\d{1,2})', str(v or ''))
    if not m:
        raise ValueError(f'작성일자 형식을 알 수 없음: {v!r}')
    return f'{int(m[1]):04d}.{int(m[2]):02d}.{int(m[3]):02d}'


def size_label(n):
    return f'{n / 1048576:.1f}MB' if n >= 1048576 else f'{max(1, round(n / 1024))}KB'


def main():
    files = {nfc(f): f for f in os.listdir(SRC) if not f.lower().endswith('.xlsx') and not f.startswith('~$')}
    ws = openpyxl.load_workbook(XLSX, data_only=True).worksheets[0]
    header = [c.value for c in ws[1]][:5]
    assert [str(h).strip() if h else h for h in header[:4]] == ['제목', '작성일자', '내용(본문)', '파일명'], f'머리글이 예상과 다름: {header}'

    items, problems, aliased, fixed, used = [], [], [], [], set()
    for idx, row in enumerate(ws.iter_rows(min_row=2), start=2):
        a, b, c, d, e = (row[i].value if i < len(row) else None for i in range(5))
        if not any(v not in (None, '') for v in (a, b, c, d)):
            continue
        title = re.sub(r'\s+', ' ', str(a or '')).strip()
        if not title:
            problems.append(f'{idx}행: 제목 없음')
            continue
        item = {'id': '', 'category': 'management', 'label': '경영공시', 'title': title, 'date': fmt_date(b), 'content': clean_text(c or '')}
        key = (title, item['date'])
        for wrong, right in TEXT_FIXES.get(key, []):
            if wrong in item['content']:
                item['content'] = item['content'].replace(wrong, right)
                fixed.append((idx, wrong, right))
        if d not in (None, ''):
            name = nfc(str(d).strip())
            real = name if name in files else FILE_ALIASES.get(name)
            if real not in files:
                problems.append(f'{idx}행: 첨부파일을 찾을 수 없음 {d!r}')
                continue
            if real != name:
                aliased.append((idx, name, real))
            used.add(real)
            src = os.path.join(SRC, files[real])
            item.update(file=URL_BASE + quote(real), fileName=real, fileType=os.path.splitext(real)[1][1:].upper(), fileSize=size_label(os.path.getsize(src)))
        if key in BODY_IMAGES:
            img_src, img_out, alt = BODY_IMAGES[key]
            used.add(nfc(img_src))
            item['image'] = {'src': URL_BASE + 'images/' + img_out, 'alt': alt, '_src': img_src, '_out': img_out}
        if key in BODY_TABLES:
            item['content'] = BODY_TABLES[key]['text']
            item['table'] = BODY_TABLES[key]['table']
            used.add(nfc('정관 이미지 내용.png'))  # 표로 옮겨 적었으므로 이미지 자체는 게시하지 않음
        item['_row'] = idx
        items.append(item)

    if problems:
        print('변환 중단 — 확인 필요:\n  ' + '\n  '.join(problems))
        sys.exit(1)

    # 작성일자 최신순(같은 날짜는 엑셀 순서 유지)
    items.sort(key=lambda it: (it['date'], -it['_row']), reverse=True)
    for i, it in enumerate(items, 1):
        it['id'] = f"m{it['date'].replace('.', '')}-{i:02d}"

    # 공개 폴더 다시 만들기(이전 복사본 정리). 엑셀은 복사하지 않는다.
    if os.path.isdir(OUT_DIR):
        shutil.rmtree(OUT_DIR)
    os.makedirs(os.path.join(OUT_DIR, 'images'))
    for it in items:
        if 'fileName' in it:
            shutil.copy2(os.path.join(SRC, files[it['fileName']]), os.path.join(OUT_DIR, it['fileName']))
        if 'image' in it:
            shutil.copy2(os.path.join(SRC, files[nfc(it['image']['_src'])]), os.path.join(OUT_DIR, 'images', it['image']['_out']))
            del it['image']['_src'], it['image']['_out']
        del it['_row']
    assert not any(f.lower().endswith(('.xlsx', '.xls')) for f in os.listdir(OUT_DIR)), '공개 폴더에 엑셀이 들어감'

    body = json.dumps(items, ensure_ascii=False, indent=1)
    with open(OUT_JS, 'w', encoding='utf-8', newline='\n') as f:
        f.write('// 자동 생성 파일 — 직접 고치지 말고 `python scripts/build-disclosures.py`로 다시 만드세요.\n')
        f.write('// 원본: 공시자료/공시자료 정리.xlsx (로컬 전용). 분류는 모두 경영공시. 작성일자 최신순.\n')
        f.write(f'SITE_CONTENT.disclosures = {body};\n')

    unused = sorted(set(files) - used)
    print(f'엑셀 데이터 행: {len(items)}건 → 변환: {len(items)}건(모두 경영공시)')
    print(f'첨부파일 연결: {sum("file" in it for it in items)}건, 첨부 없음: {sum("file" not in it for it in items)}건, 본문 이미지: {sum("image" in it for it in items)}건, 본문 표: {sum("table" in it for it in items)}건')
    for idx, name, real in aliased:
        print(f'  파일명 불일치(대응 적용) {idx}행: {name} → {real}')
    for idx, wrong, right in fixed:
        print(f'  원본 오타 정정 {idx}행: {wrong} → {right}')
    print(f'  게시하지 않은 원본 파일: {unused or "없음"}')


if __name__ == '__main__':
    main()
