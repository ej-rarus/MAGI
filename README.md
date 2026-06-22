# MAGI

MAGI는 React, TypeScript, Vite로 만든 Evangelion-inspired 의사결정 콘솔입니다. 질문을 입력하면 `MELCHIOR•1`, `BALTHASAR•2`, `CASPER•3` 세 노드가 각각 판단을 내리고, 다수결로 최종 결과를 보여줍니다.

배포 URL:

[https://magi-sooty.vercel.app](https://magi-sooty.vercel.app)

이 프로젝트는 원작 분위기에서 영감을 받은 팬메이드 UI 실험이며, 원작 및 권리자와 공식적인 관련은 없습니다.

## 주요 기능

- CRT 필터가 적용된 MAGI 스타일 콘솔 UI
- 데스크톱과 모바일에 맞춘 노드 배치 및 연결선
- `可決`, `否決`, `保留` 세 가지 판정 상태
- 각 노드의 판정 상태를 색상 변화로 표시
- 판정 완료 후 노드 hover, focus, tap으로 판단 근거 패널 표시
- API 키가 없어도 내부 판단 엔진으로 동작
- Vercel 환경변수를 설정하면 Gemini, Claude, OpenAI 실제 API 호출 가능

## 노드 구성

| 노드 | 연결 모델 | 역할 |
| --- | --- | --- |
| `MELCHIOR•1` | Gemini | 시스템 분석, 실행 가능성, 비용과 구조 판단 |
| `BALTHASAR•2` | Claude | 위험, 안전장치, 윤리적 제동 판단 |
| `CASPER•3` | ChatGPT / OpenAI | 사용자 의도, 효용, 대화적 균형 판단 |

최종 판정은 다수결로 결정됩니다.

- `可決`이 2개 이상이면 최종 가결
- `否決`이 2개 이상이면 최종 부결
- 그 외에는 최종 보류

## 기술 스택

- React 19
- TypeScript
- Vite
- Vitest
- ESLint
- Vercel Functions: `api/judgement.ts`

## 프로젝트 구조

```text
api/
  judgement.ts                 # Vercel API route. 실제 모델 호출과 노드별 폴백 처리

src/
  lib/
    magiClient.ts              # 브라우저에서 /api/judgement 호출, 실패 시 내부 판단으로 전환
    magiJudgement.ts           # 판정 타입, 다수결 로직, 내부 판단 엔진
  pages/
    Magi.tsx                   # 메인 MAGI 콘솔 UI
  styles/
    magi.css                   # 레이아웃, CRT 효과, 노드 도형, 반응형 스타일

tests/
  apiJudgementSelfContained.test.ts
  mobileLinkGeometry.test.ts
  nodeInsightDismiss.test.ts
  nodeInsightOverflow.test.ts
  nodeStateVisuals.test.ts
```

## 로컬 실행

의존성을 설치합니다.

```bash
npm install
```

개발 서버를 실행합니다.

```bash
npm run dev
```

Vite가 출력하는 로컬 URL을 브라우저에서 열면 됩니다.

일반 `npm run dev`는 Vercel 서버리스 함수인 `api/judgement.ts`를 실행하지 않습니다. 그래서 로컬 Vite 개발 서버에서는 기본적으로 내부 판단 엔진으로 동작합니다.

## 환경변수

필요하면 예시 파일을 복사합니다.

```bash
cp .env.example .env.local
```

클라이언트 옵션:

```bash
VITE_MAGI_API_MODE=local
VITE_MAGI_API_TIMEOUT_MS=6000
VITE_MAGI_API_ENDPOINT=/api/judgement
```

`VITE_MAGI_API_MODE` 값:

- `local`: API를 호출하지 않고 항상 내부 판단 엔진 사용
- `auto`: API가 가능하면 호출하고, 실패하면 내부 판단으로 전환
- `api`: API 호출을 먼저 시도하고, 실패하면 내부 판단으로 전환

서버 API 키:

```bash
GEMINI_API_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
```

선택 모델 오버라이드:

```bash
GEMINI_MODEL=gemini-3.5-flash
ANTHROPIC_MODEL=claude-sonnet-4-6
OPENAI_MODEL=gpt-5.4-mini
```

선택 base URL 오버라이드:

```bash
GEMINI_BASE_URL=
ANTHROPIC_BASE_URL=
OPENAI_BASE_URL=
```

## 실제 API 연결

프로덕션은 Vercel에서 실행됩니다. 실제 모델 호출을 켜려면 Vercel 프로젝트에 provider API 키를 넣고 다시 배포하면 됩니다.

먼저 Vercel CLI는 최신 버전을 권장합니다.

```bash
npm i -g vercel@latest
```

현재 로그인 계정을 확인합니다.

```bash
vercel whoami
```

프로덕션 환경변수를 추가합니다.

```bash
vercel env add GEMINI_API_KEY production --sensitive
vercel env add ANTHROPIC_API_KEY production --sensitive
vercel env add OPENAI_API_KEY production --sensitive
```

다시 배포합니다.

```bash
vercel deploy --prod
```

배포 후 API route를 직접 확인할 수 있습니다.

```bash
curl -sS -X POST https://magi-sooty.vercel.app/api/judgement \
  -H 'Content-Type: application/json' \
  --data '{"question":"이 판단을 실행해도 되는가?"}'
```

응답의 `source` 의미:

- `"api"`: 세 노드 모두 실제 provider API 응답 사용
- `"mixed"`: 일부 노드는 API, 일부 노드는 내부 판단 사용
- `"fallback"`: 세 노드 모두 내부 판단 사용

API 키가 없거나 provider 호출이 실패해도 앱은 멈추지 않습니다. 해당 노드만 내부 판단으로 대체되고, 최종 판정은 계속 완료됩니다.

## 검증

전체 검증:

```bash
npm test
npm run lint
npm run build
```

주요 개별 테스트:

```bash
npm test -- tests/mobileLinkGeometry.test.ts
npm test -- tests/nodeInsightOverflow.test.ts
npm test -- tests/apiJudgementSelfContained.test.ts
```

## 배포 메모

- `.vercel/`은 로컬 링크 정보이므로 커밋하지 않습니다.
- 현재 Vercel 프로젝트는 `ej-rarus-projects/magi`로 연결되어 있습니다.
- 공개 프로덕션 alias는 `https://magi-sooty.vercel.app`입니다.
- API 키는 저장소가 아니라 Vercel 환경변수에만 저장합니다.
- 내부 판단 엔진은 의도된 기능입니다. API 키가 없거나 외부 provider가 실패해도 데모가 계속 동작해야 합니다.

## 라이선스

MIT
