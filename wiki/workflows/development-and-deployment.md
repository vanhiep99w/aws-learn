# Development và deployment

## Command map

Các scripts canonical nằm trong [`package.json`](../../package.json):

| Command | Việc thực hiện | Khi dùng |
|---|---|---|
| `npm ci` | Cài đúng dependency lockfile | Setup sạch/CI-like |
| `npm run prepare-content` | Chạy `scripts/prepare-content.mjs` | Kiểm tra catalog/content transform |
| `npm run dev` | `predev` prepare content, rồi `next dev` | Phát triển docs UI |
| `npm run build` | `prebuild` prepare content, rồi `next build` | Quality gate và tạo `dist/` |
| `npm run preview` | `wrangler pages dev dist` | Preview static output + Pages environment |
| `npm run deploy` | Build rồi `wrangler pages deploy dist` | Deploy thủ công Cloudflare Pages |

Dự án dùng Next.js/Fumadocs, React, Mermaid và TypeScript. `tsconfig.json` strict/noEmit; type checking nằm trong Next build.

## Generated artifacts

| Path | Producer | Policy |
|---|---|---|
| `content/docs/` | prepare-content | Generated, gitignored, không sửa trực tiếp |
| `public/diagrams/` | prepare-content | Copy generated, gitignored |
| `.source/` | Fumadocs MDX | Generated, gitignored |
| `.next/` | Next | Build cache, gitignored |
| `dist/` | Next static export | Deploy artifact, gitignored |

Khi debug build, trace từ source về generated output, nhưng fix phải nằm ở README/root Markdown/script/config. Nếu rename/remove docs, nên clean `content/docs/` trước để không bị stale file che lỗi:

```bash
rm -rf content/docs .source .next dist
npm run build
```

`public/diagrams/` được script tự clear trước khi copy.

## Build output và route ownership

[`next.config.mjs`](../../next.config.mjs) dùng static export và output `dist/`. Build hiện sinh khoảng một route mỗi unique document, static search route và not-found page; static files từ `public/` cũng được copy.

Điểm cần kiểm tra trực tiếp sau build:

```bash
# Root hiện phải là redirect do catch-all route
rg 'NEXT_REDIRECT.*fundamentals/aws-overview' dist/index.html

# Practice static page và diagrams phải tồn tại
test -f dist/practice/index.html
test -d dist/diagrams
```

`public/index.html` không đảm bảo là root output vì app router cũng generate `/`. Nếu đổi landing/root behavior, mở `dist/index.html` và test browser navigation/trailing slash, không chỉ nhìn source `public/index.html`.

## Cloudflare Pages architecture

[`wrangler.toml`](../../wrangler.toml) khai báo:

- Pages output directory `./dist`;
- D1 binding `DB` tới database `aws-question`.

Deployment gồm hai loại artifact:

```text
Static dist/                    Pages Functions
────────────                    ───────────────
docs routes                    functions/api/questions.js
/api/search static asset       functions/api/practice-history.js
/practice/ HTML                D1 binding env.DB
/diagrams/*
```

Lịch sử git cho thấy project đã chuyển từ Worker assets sang Cloudflare Pages; do đó dùng `wrangler pages dev/deploy`, không quay lại `wrangler dev/deploy` Worker-style nếu chưa thiết kế migration mới.

README mô tả push `main` auto-deploy. Repository không track `.github/workflows` hay Cloudflare project settings, nên branch integration/build environment phải được xác minh trong dashboard khi có sự cố deploy.

## D1 provisioning và migrations

Base schema nằm ở [`schema.sql`](../../schema.sql). Comment trong file đưa command:

```bash
npx wrangler d1 execute aws-question --file=schema.sql
```

Khi thực thi thực tế, chỉ rõ local/remote theo Wrangler version và review target trước khi chạy.

[`scripts/migrate-question-numbers.mjs`](../../scripts/migrate-question-numbers.mjs) backfill sequence number:

1. thử thêm `question_number` (được phép fail nếu column đã tồn tại);
2. tạo `question_sequence`;
3. insert sequence rows cho question chưa có;
4. backfill `questions.question_number`;
5. tạo indexes;
6. in thống kê.

Dùng:

```bash
node scripts/migrate-question-numbers.mjs --local
# hoặc sau khi backup/review:
node scripts/migrate-question-numbers.mjs --remote
```

**Cảnh báo:** script mặc định chọn `--remote` nếu không truyền `--local` hoặc `--remote`. Không chạy trần lệnh này để thử nghiệm.

History API còn tự tạo `practice_answer_history` và `practice_question_notes` trên request. `schema.sql` hiện thiếu notes table; khi thêm migration mới phải so sánh schema declarative với DDL runtime để tránh drift.

## Quality gates theo loại thay đổi

Repository chưa có automated tests hoặc lint script riêng. Dùng matrix sau làm minimum:

### Root Markdown/README/diagram

```bash
npm run build
```

Sau đó kiểm tra route, TOC, links, source citation và diagram cụ thể. Với README, đọc log `Parsed N files` và mọi `SKIP (not found)`.

### `src/`, MDX config hoặc Next config

- `npm run build` để compile/type-check/static-generate.
- Smoke test root redirect, một docs route, 404, search, Mermaid và responsive docs layout.
- Nếu đổi search payload, kiểm tra kích thước asset trong `dist/api/search/`.

### Practice UI

- Build để chắc page được copy.
- Preview qua Wrangler khi cần Function/D1 integration.
- Test cả Practice và Review.
- Test single/multi-select, submit/retry/next, username reload, score, notes, filters, lookup ID/number, pagination, theme và mobile layout theo phạm vi thay đổi.
- Test record notes cũ nếu đổi parser.

### Pages Functions/API

- Test OPTIONS/CORS và method-not-allowed.
- Questions: GET list/detail/number, pagination/sort/count/labels, POST validation, PATCH partial fields/labels.
- History: missing username, answer upsert, note toggle, single delete và reset scopes.
- Dùng local D1 cho destructive test; không dùng production database làm test fixture.
- Review auth/input/HTML rendering trust boundary.

### Schema/migration

- Backup hoặc snapshot trước remote migration.
- Chạy local trên empty DB và DB đã migrate để kiểm tra idempotency.
- Verify counts, uniqueness và indexes.
- Sau deploy, smoke test question create/read và history persistence.

## Operational caveats

- Questions POST/PATCH hiện public, CORS `*`, không có API key. Đây không phải lỗi cấu hình local; source/history xác nhận auth đã bị gỡ. Bất kỳ hardening nào cũng phải cập nhật AWS explain producer và CORS/client behavior.
- Username Practice không phải identity bảo mật. Người dùng biết cùng username sẽ dùng chung history/notes.
- Không có foreign keys giữa question và labels/history; migration/xóa thủ công phải tự bảo toàn consistency.
- `practice_question_notes` chưa nằm trong schema file.
- Filter mode của UI lấy tối đa 500 open questions. Nếu dataset vượt ngưỡng, semantics filter hiện không bao phủ toàn bộ tập dữ liệu.
- Search cố ý không index paragraph contents để tránh Cloudflare Pages asset limit.
- Hard-coded document counts trên landing/metadata không tự đồng bộ với README.

## Checklist trước khi hoàn tất một change

1. Xem `git diff` và xác nhận không có generated artifacts bị stage.
2. Chạy quality gate phù hợp, tối thiểu `npm run build` cho code/content build changes.
3. Kiểm tra thủ công business flow đã sửa.
4. Nếu có schema/API contract change, cập nhật producer/consumer và migration cùng lúc.
5. `git pull --rebase`, giải quyết conflict và chạy lại gate nếu source thay đổi.
6. Commit, push và xác nhận branch up to date theo repository landing instructions.
