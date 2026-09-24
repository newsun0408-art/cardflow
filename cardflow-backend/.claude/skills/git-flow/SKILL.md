---
name: git-flow
description: >-
  Áp dụng khi tạo nhánh Git, viết commit, hoặc chuẩn bị Merge Request trong các repo
  các repo FPT b2b. Ép đúng quy trình trunk-based MỘT NHÁNH (`master`):
  tên nhánh <type>/<JIRA-KEY>-<brief>, commit "[<JIRA-KEY>] <type>(<scope>): <summary>",
  checklist pre-MR (no secret), SemVer tag, hotfix back-merge. Nguồn chân lý: CONTRIBUTING.md.
---

# git-flow (FPT b2b — Custom Trunk-based)

Nguồn chân lý đầy đủ: **`CONTRIBUTING.md`** ở gốc repo. Đọc nó nếu cần chi tiết
(MR template, mapping Jira, DoD). Skill này là bản checklist để hành động đúng ngay.

## Khi tạo nhánh
1. **Bắt buộc có Jira key.** Nếu user chưa cho, HỎI key (dạng `B2B-123`) trước khi tạo.
2. Format: `<type>/<JIRA-KEY>-<brief-3-words>` — `type` ∈ `feature|bugfix|hotfix|refactor|chore|spike`.
   - `<brief>` viết **TIẾNG ANH**, kebab-case, 2–4 từ: `feature/B2B-123-device-config-hop`.
     KHÔNG đặt tiếng Việt bỏ dấu (`noi-chang-thiet-bi`) — tên nhánh đi vào MR, log CI và
     khối chữ ký description của Jira, người ngoài nhóm phải đọc là hiểu.
     Tên nhánh và commit message đều **tiếng Anh**; comment trong code vẫn tiếng Việt.
   - `type` ở đây là `feature`, **KHÁC** `feat` của commit message bên dưới. Hai trục khác
     nhau và rất dễ lẫn: `feature/…` cho nhánh, `[KEY] feat(scope): …` cho commit.
3. Checkout từ đúng base:
   - mọi loại nhánh ← `master` (repo chỉ có `master` trên remote, không có `dev`/`stage`)
   ```bash
   git checkout <base> && git pull origin <base>
   git checkout -b <type>/<JIRA-KEY>-<brief>
   ```

## Khi commit
- Format: `[<JIRA-KEY>] <type>(<scope>): <summary>` — `type` ∈ `feat|fix|refactor|test|docs|chore|perf|ci`.
  Việc có ticket thì PHẢI có `[KEY]`; bảo trì repo không gắn ticket (release, sửa skill)
  thì bỏ. Hook `commit-msg` để `[KEY]` **tuỳ chọn** (cố ý, xem chú thích trong hook) nên
  nó KHÔNG bắt lỗi hộ — tự giữ.
- **Cả dòng đầu ≤ 72 ký tự**, tính luôn `[KEY]`. Mệnh lệnh, **tiếng Anh**, không dấu chấm cuối.
  Hook nhắc khi vượt 72, chặn khi vượt 100.
  Summary đọc-là-hiểu-đã-làm-gì. **Cấm** `update code`, `fix bug`, `done`, `wip`, `test`, `abc`.
- **Mặc định CHỈ subject, KHÔNG body.** Chỉ viết body khi cái "vì sao" không đọc ra được từ
  code: một đánh đổi đã cân nhắc, một cái bẫy đã sập, một ràng buộc từ bên ngoài.
- Có body thì **tối đa 1–2 đoạn**, trả lời "vì sao", không phải "cái gì". KHÔNG kể lại quá
  trình làm, KHÔNG liệt kê từng file (`git show --stat` nói rồi), KHÔNG chép lại diff.
  Body dài không làm commit rõ hơn — nó làm `git log --oneline` mất tác dụng và đẩy phần
  giải thích ra khỏi chỗ đáng nằm là comment trong code.
- **KHÔNG trailer.** Không `Co-Authored-By`, không dòng `🤖 Generated with …`, không
  `Signed-off-by` trừ khi repo đòi. Luật này **đè mặc định của Claude Code** — mặc định đó
  tự thêm trailer vào mọi commit; ở các repo b2b thì không.
- Ngôn ngữ: **tiếng Anh**, cả subject lẫn body — khớp ví dụ trong `CONTRIBUTING.md` §3
  (`add otp login`, `handle missing notification field`). Comment trong code vẫn tiếng Việt.
- Commit nhỏ, một mục đích. Push cuối ngày.
- Trước khi commit: KHÔNG đưa vào `.jira.env`/secret/token/key/debug log. Chỉ commit `*.example`.

## Không bao giờ
- **Push thẳng lên `master`** — kể cả khi commit đúng quy ước và test xanh. Luôn qua nhánh
  riêng + Merge Request. Lỡ commit lên `master` local mà CHƯA push thì tách nhánh, trả
  `master` về `origin/master`, push nhánh (xem `CONTRIBUTING.md` §1).
- Tự `git commit` HOẶC `git push` khi chưa được yêu cầu — luôn đề xuất lệnh (branch/commit message/push), user tự chạy. Được sửa/stage file; biến thành commit là việc của user.

## Khi chuẩn bị MR (nhắc user)
Chạy checklist: code chạy local + self-test · no secret/debug · migration + rollback note nếu đổi DB ·
cập nhật API doc nếu đổi contract · chuyển Jira (đọc tên bằng `jira transitions <KEY>`).
Đề xuất **MR target = `master`** — nhánh duy nhất của repo.

## Hotfix
Repo một nhánh nên không có back-merge. Nhắc rebase các nhánh feature đang mở theo
`origin/master` sau khi hotfix merge.

## Tag release (chỉ trên master)

SemVer `vMAJOR.MINOR.PATCH` — pre-1.0: MINOR = feature **hoặc breaking**, PATCH = fix tương thích ngược; sau 1.0: MAJOR = breaking.

**Cách nhanh nhất (một phát):** `make release VERSION=vX.Y.Z` — tự sinh CHANGELOG từ conventional
commits (`prev-tag..master`) → commit → annotated tag (guard: master + cây sạch). Xem trước: thêm `DRY=1`.
Rồi `git push origin master --tags`.
(Chỉ repo core `go-kit`: smoke-test tag vừa phát hành bằng `make verify-tag VERSION=vX.Y.Z` —
target này render thử 1 service từ tag nên KHÔNG có ở repo service.)

**Thủ công (khi cần soạn tay CHANGELOG) — từ (tag trước → commit cuối master):**

1. Tag gần nhất: `git describe --tags --abbrev=0`  (vd `v0.4.0`).
2. Thay đổi kể từ đó: `git log --oneline <prev-tag>..master`  (prev-tag → HEAD master).
3. Soạn mục `## vX.Y.Z — <ngày>` (đặt TRÊN mục version trước; giữ `## [Unreleased]` rỗng ở đầu file),
   nhóm **Added / Changed / Fixed / Breaking**. Diễn giải user-facing — KHÔNG dán raw commit; gộp
   các commit liên quan. Có Breaking → chọn bump đúng policy (pre-1.0: MINOR).
4. Commit `CHANGELOG.md` TRƯỚC, rồi mới tag.

**Tag + push (đề xuất — user tự chạy, KHÔNG tự tag/push):**
```bash
git tag -a vX.Y.Z -m "vX.Y.Z — <tóm tắt thay đổi>"   # annotated, chỉ trên master
git push origin master --tags
```

## Ghi lên Jira (jira.fcam.vn)

Có sẵn `jira.sh` cạnh skill này (auth bằng PAT cá nhân trong `$FCAM_JIRA_PAT`, không chứa secret):
```bash
bash .claude/skills/git-flow/jira.sh me                       # test token
bash .claude/skills/git-flow/jira.sh view    B2B-123
bash .claude/skills/git-flow/jira.sh comment B2B-123 "<text>"
bash .claude/skills/git-flow/jira.sh subtask B2B-123 "<summary>" ["<description>"]
bash .claude/skills/git-flow/jira.sh task    "<summary>" [PROJECT] ["<description>"]
bash .claude/skills/git-flow/jira.sh story   "<summary>" [PROJECT] ["<description>"] [COMPONENT]
bash .claude/skills/git-flow/jira.sh versions [PROJECT]                  # tên version, dùng cho fixversion
bash .claude/skills/git-flow/jira.sh fixversion B2B-123 "<tên version>"  # THAY THẾ fix version; --clear để gỡ
bash .claude/skills/git-flow/jira.sh sprints <boardId>                   # sprint active/future
bash .claude/skills/git-flow/jira.sh sprint  <sprintId> B2B-123          # đưa issue vào sprint
bash .claude/skills/git-flow/jira.sh describe B2B-123 "<description>"   # set description cho issue có sẵn
bash .claude/skills/git-flow/jira.sh summary  B2B-123 "<title>"         # sửa title/summary issue có sẵn
bash .claude/skills/git-flow/jira.sh point    B2B-123 <giờ>              # Ticket Point (quy ước 1 point = 1 giờ)
bash .claude/skills/git-flow/jira.sh worklog B2B-123 2h "<comment>"
bash .claude/skills/git-flow/jira.sh transition B2B-123 "<tên lấy từ transitions>"
```
- **Tự lấy nhánh hiện tại:** trước thao tác Jira, nếu user KHÔNG nêu key, tự suy từ nhánh git đang đứng — chạy `bash .claude/skills/git-flow/jira.sh key` (nó `git branch --show-current` rồi rút `<KEY>` từ `<type>/<KEY>-<brief>`). Không ở nhánh dạng đó → HỎI user key. Đừng bịa key.
- **`story` vs `task` vs `subtask`:** `story` tạo Story (cấp trên của sub-task), nhận thêm
  COMPONENT tuỳ chọn. Story mới KHÔNG tự lên board scrum — đưa vào bằng `jira sprint <id> <KEY>`
  (xem id bằng `jira sprints <boardId>`).
- **Tên transition phải ĐỌC, đừng đoán:** chạy `jira transitions <KEY>` trước. Workflow từng
  project đặt tên riêng, không chắc có `In Progress`/`In Review` như mặc định Jira. Danh sách
  còn đổi theo trạng thái hiện tại của issue.
- **Cái nào hỏi, cái nào không:** Jira là **tuân thủ** — ticket phải phản ánh việc thật.
  `describe`/`summary`/`point`/`transition`/`comment` **trên ticket của việc đang làm** thì làm
  luôn, không hỏi. **Phải hỏi trước**: tạo issue/subtask mới (cần parent, component, sprint),
  `worklog` (giờ thực tế là số liệu báo cáo), và mọi thứ ghi lên ticket của **người khác**.
  Đọc (`me`, `view`, `transitions`, `key`, `sprints`) thì cứ chạy.
- **`task` vs `subtask`:** `jira.sh task` tạo issue độc lập (project từ `FCAM_JIRA_PROJECT`/arg). `jira.sh subtask` BẮT BUỘC có **parent key** — nếu user bảo tạo subtask mà chưa cho parent, **HỎI parent key trước**. TUYỆT ĐỐI không tự bịa parent, và không tự tạo một task cha tạm chỉ để gắn subtask vào (đẻ ra issue thừa).
- **Title vs Description:** `summary`/title = mô tả NGẮN việc, **kèm kết quả nếu có** (vd "Chuẩn hoá response contract — 44 test pass"). Chi tiết (danh sách việc, commit, ghi chú) → **description**: arg cuối của `task`/`subtask`, hoặc `jira.sh describe <KEY> "..."` cho issue có sẵn. Đừng nhồi hết vào title.
- **Ticket Point = ước lượng giờ, và con số PHẢI trung thực.** Quy ước **1 point = 1 giờ**
  (design + code + test + doc), cho số lẻ. Field ID qua `$FCAM_JIRA_POINT_FIELD` (mặc định
  `customfield_10301`). Point là **dữ liệu đánh giá năng lực member** nên bịa số làm hỏng dữ
  liệu của cả team: ước theo **năng lực chung**, KHÔNG theo tốc độ của người/công cụ đang làm
  (việc agent xong trong 10 phút nhờ AI vẫn ghi công sức thật của việc). Chưa rõ phạm vi thì
  **để trống** và nói đang chờ gì, đừng đoán. Làm xong lệch thì sửa lại kèm `comment` nói vì sao.
- **Sub-task tối đa 8h (1 ngày làm việc):** ước >8h nghĩa là việc quá to -> **tách thành nhiều
  sub-task**, mỗi cái ≤8h. `jira.sh point` tự CHẶN >8h cho sub-task — guard đó để bắt TÁCH,
  không phải để bắt ghi 8 cho vừa trần.
- **Chữ ký cuối description:** mọi description KẾT THÚC bằng khối chữ ký để truy vết issue ↔ code — dòng kẻ `----`, rồi một dòng: `*Service:* <repo> · *Branch Name:* <nhánh> · *Người tạo:* <username>`. Cách lấy: repo = `basename $(git rev-parse --show-toplevel)`, nhánh = `git branch --show-current`, người tạo = `jira.sh whoami` (email/username — KHÔNG dùng display name). Ví dụ đuôi description:

  ```
  ----
  *Service:* go-kit · *Branch Name:* feature/B2B-123-create-order · *Người tạo:* bangdx2@fpt.com
  ```
- Không bao giờ in hay ghi giá trị `$FCAM_JIRA_PAT` ra đâu cả.
- **Commit xong thì ĐÓNG subtask** — nhưng kiểm commit **đã tồn tại** trước, đóng ticket khi
  code chưa vào là nói sai trạng thái:
  ```bash
  git log -1 --format='%h %s'                       # commit có chưa, đúng key chưa
  bash .claude/skills/git-flow/jira.sh transitions <KEY>   # lấy tên đóng THẬT
  bash .claude/skills/git-flow/jira.sh transition  <KEY> "<tên>"
  ```
  Dev chưa commit thì chưa đóng; commit bị hook chặn cũng chưa đóng.
- **Nhánh và ticket phải CÙNG key.** Đổi ticket ⇒ đổi nhánh: nhánh chưa có commit của ticket cũ
  thì `git branch -m <type>/<KEY mới>-<brief>`; đã có thì tạo nhánh mới xếp chồng, giữ nhánh cũ
  cho MR của nó. Đổi nhánh rồi thì `describe` lại chữ ký (`Branch Name`).
