# Đóng góp & Quy trình Git (FPT trunk-based)

> **Trunk-based một nhánh.** Repo này chỉ có **`master`** trên remote — không có `dev`,
> không có `stage` (đo `git branch -r` 2026-09-03). Bản mô tả 3 nhánh trước đây tả một mô
> hình chưa từng tồn tại ở đây; đã sửa cho khớp thực tế.
>
> **Thông điệp chính:** Mọi thay đổi đi theo **Jira → branch ngắn hạn → commit hằng ngày
> → Merge Request → `master`**. `master` luôn là production-ready.

## 1. Mô hình branch

| Branch | Vai trò | Checkout từ | Merge vào |
|--------|---------|-------------|-----------|
| `master` | **Trunk duy nhất** — production-ready | — | chỉ nhận Merge Request |
| `feature/*` | Tính năng mới | `master` | `master` (qua MR) |
| `bugfix/*` | Sửa lỗi | `master` | `master` (qua MR) |
| `hotfix/*` | Sửa lỗi prod khẩn | `master` | `master` (qua MR) |
| `refactor/*` | Refactor không đổi behavior | `master` | `master` (qua MR) |
| `chore/*` | Config/CI/cleanup | `master` | `master` (qua MR) |
| `spike/*` | Nghiên cứu/thử nghiệm | `master` | (thường bỏ) |

### TUYỆT ĐỐI không push thẳng lên `master`

Kể cả khi commit đã đúng quy ước và test đã xanh. Mọi thay đổi đi qua nhánh riêng + Merge
Request — đó là chỗ duy nhất có review và pipeline gác.

Lỡ commit lên `master` local rồi thì **chưa mất gì**: tách sang nhánh riêng, trả `master` về
đúng remote, push nhánh:

```bash
git branch feature/<KEY>-<brief>          # nhánh mới trỏ vào commit vừa tạo
git checkout feature/<KEY>-<brief>
git branch -f master origin/master        # trả master về đúng remote
git push -u origin feature/<KEY>-<brief> -o merge_request.create -o merge_request.target=master
```

Chỉ áp dụng khi **chưa push**. Đã push lên `master` rồi thì không tự viết lại lịch sử nhánh
chung — báo Tech Lead.

## 2. Đặt tên branch

```
<type>/<JIRA-KEY>-<brief-3-words>
```
- Ví dụ đúng: `feature/B2B-123-notification-device-token`, `bugfix/B2B-456-null-payload`, `hotfix/B2B-789-login-prod-error`
- Sai: `feature/loginfix`, `duy-testnew`, `featuredev-duy` (thiếu Jira key, không truy vết được)

## 3. Commit message

```
[<JIRA-KEY>] <type>(<scope>): <summary>
```
`type` ∈ `feat | fix | refactor | test | docs | chore | perf | ci`

| Ví dụ |
|-------|
| `[B2B-123] feat(auth): add otp login` |
| `[B2B-456] fix(alarm): handle missing notification field` |
| `[B2B-321] refactor(worker): split alarm consumer` |
| `[B2B-666] ci(gitlab): add lint job` |

- ❌ Cấm message mơ hồ: `update code`, `fix bug`, `done`, `wip`, `test`, `abc`, `commit 1`.
- ✅ Đọc là biết **đã làm gì**. Commit nhỏ, ≥ 1 commit/ngày cho ticket đang *In Progress*; **push cuối ngày**.
- WIP được phép commit, **không tạo MR** nếu chưa chạy được / chưa self-test.

### Hook chặn message sai

`.githooks/commit-msg` (trong repo) chặn trước khi commit tồn tại. **Bật một lần mỗi clone** —
repo Go không có postinstall để tự chạy:

```bash
make hooks
```

Chặn: sai/thiếu type, thiếu dấu hai chấm, mô tả <10 ký tự, tên nhánh làm message, mô tả vô
nghĩa (`update code`, `wip`, `abc`…), dòng đầu >100 ký tự. Bỏ qua: commit git tự sinh
(`Merge`, `Revert "…"`, `fixup!`) và `chore(release): vX.Y.Z` do `make release` sinh.
Dòng đầu >72 ký tự chỉ **nhắc**, không chặn.

Đo trên 60 commit gần nhất: **53 đạt / 7 chặn** — 6 cái nhồi nhiều việc (dài nhất 174 ký tự)
và 1 cái sai format. Hook nằm trong `SKILL_FILES` nên `make verify-skill` canh bản core và
bản template không lệch.

**Không dùng `--no-verify`.** Message bị chặn thì **commit chưa được tạo** — chạy lại
`git commit` với message đúng, đừng `--amend` (commit mới không tồn tại nên nó sẽ gộp thay
đổi vào commit TRƯỚC và giữ message cũ).

⚠ Jira key trong commit: mục trên ghi **bắt buộc**, nhưng đo được chỉ **3/60** commit gần nhất
có. Hook tạm để **tuỳ chọn** — chốt bắt buộc thì bỏ một dấu `?` trong `PATTERN` của hook
(có ghi chú tại chỗ).

## 4. Quy trình feature (tóm tắt)

```bash
git checkout master && git pull origin master
git checkout -b feature/B2B-123-notification-device-token
# ... code, commit nhỏ hằng ngày ...
git push origin feature/B2B-123-notification-device-token
# tạo MR feature -> master, chuyển Jira sang trạng thái review
```
Cập nhật theo master: `git fetch origin && git rebase origin/master` (giai đoạn đầu có thể `git merge origin/master`).

## 5. Điều kiện tạo Merge Request

- [ ] Code chạy được local, đã self-test case chính
- [ ] Không còn debug log thừa
- [ ] **Không commit** `.env`, `.jira.env`, secret, token, private config, key
- [ ] Đã cập nhật migration nếu đổi DB (ghi file + rollback plan trong MR)
- [ ] Đã cập nhật tài liệu API nếu đổi contract
- [ ] Jira đã chuyển *In Review*

Template MR: xem mục 7.2 tài liệu gốc (Jira / Mục tiêu / Nội dung / Cách test / Ảnh hưởng / Checklist).

## 6. Promote & Release

Repo một nhánh nên không có bậc promote dev → stage → master. Thay vào đó:

- MR `feature/*` → `master` được merge khi review xong và pipeline xanh.
- Release = **tag trên `master`** (xem mục 8), kèm release note + rollback plan.
- Muốn có bậc UAT/Regression thì phải tạo nhánh `stage` trên remote trước và cập nhật lại
  mục này — đừng viết quy trình cho nhánh không tồn tại.

## 7. Hotfix Production

```bash
git checkout master && git pull origin master
git checkout -b hotfix/B2B-789-fix-prod-login-error
# fix, MR hotfix -> master, release
```
Không có nhánh `stage`/`dev` nên không cần back-merge. Nhánh feature đang mở thì rebase theo
`origin/master` sau khi hotfix merge, tránh tái phát lỗi.

## 8. Version / Tag (SemVer `vMAJOR.MINOR.PATCH`)

| Loại | Khi dùng | Ví dụ |
|------|----------|-------|
| PATCH | hotfix / bug tương thích ngược | `v1.2.0 → v1.2.1` |
| MINOR | feature mới, không breaking | `v1.2.1 → v1.3.0` |
| MAJOR | breaking API/DB/behavior | `v1.3.0 → v2.0.0` |

Tag **chỉ tạo trên master**, dùng annotated tag:
```bash
git checkout master && git pull origin master
git tag -a v1.3.0 -m "Release v1.3.0 - <mô tả>"
git push origin v1.3.0
```

## 8b. Cập nhật go-kit theo tag (service tiêu thụ gokit)

Khi go-kit ra tag mới, service cập nhật bằng **một lệnh** (cần VPN + `GOPRIVATE=github.com/bangdinh`):

```bash
make sync-gokit VERSION=v1.3.0    # (A) bump thư viện go.mod + (B) kéo asset dùng chung
git diff                          # review: go.mod/go.sum + skill/docs/CONTRIBUTING/release.sh
git add -p && git commit          # tự quyết nhận gì
```

| Loại nội dung | Cập nhật bằng |
|---|---|
| **A. Thư viện core** (httpx, middleware, module…) | `make sync-gokit` → `go get go-kit@tag` + `go mod tidy` |
| **B. Asset dùng chung** (`Makefile` · skill · `docs/architecture.md` · `CONTRIBUTING.md` · `scripts/release.sh` · `.jira.env.example`) | `make sync-gokit` → ghi đè từ tag |
| **C. Khung owned** (`internal/` · `cmd/` · config · `README.md` · `CLAUDE.md` · `Makefile.local`) | KHÔNG tự động — áp tay theo migration-notes ở CHANGELOG (hiếm) |

> Quy ước: **không sửa tay asset loại B** ở service (sẽ bị `sync` ghi đè). Cần đổi thì đổi ở **core** rồi sync — nguồn chân lý ở core.
> Target Makefile RIÊNG của service → để trong **`Makefile.local`** (được `-include`, sync không đụng).

## 9. Mapping Jira ↔ Git Flow

`To Do` → `In Progress` (checkout branch) → review (tạo MR) → `Done` (merge `master` + release).

⚠ Tên trạng thái/transition khác nhau theo từng project Jira — **đọc bằng
`jira transitions <KEY>` thay vì gõ theo tên ở đây**.

## 10. Definition of Done (Developer)

Code đã merge `master` · MR đã review · pipeline không lỗi nghiêm trọng · đã self-test ·
đã cập nhật Jira · không còn secret/debug · có hướng dẫn test cho QA · có migration/config note nếu cần.

## 11. Secrets & ENV

Không hardcode host/domain/endpoint/token/secret/DB conn/Kafka·RabbitMQ·OpenSearch endpoint/Firebase·S3 key.
Repo chỉ commit `*.example` (vd `example.config.json`, `example.env`). **Không** commit `.env`, `.jira.env`, `config.json` thật, `*.pem`, `id_rsa`, `firebase-secret.json`.

## 12. Jira CLI (tuỳ chọn, tăng tốc)

Thao tác Jira từ terminal bằng `.claude/skills/git-flow/jira.sh`
(comment / subtask / task / worklog / transition). Auth bằng **Personal Access Token cá nhân** —
**token KHÔNG bao giờ commit**.

**Mô hình:** 1 token cho 1 *Jira instance* (`jira.fcam.vn`), dùng chung cho MỌI project (RPA, B2B, ...).
Project key chỉ cần cho lệnh `task` (tạo issue mới); các lệnh khác suy ra project từ issue key (`RPA-123`).

### Setup (mỗi member, 1 lần)
1. Tạo PAT: `jira.fcam.vn` → avatar → **Profile → Personal Access Tokens → Create token**.
2. Đặt token vào **`.jira.env`** ở gốc repo (đã `.gitignore`, script tự nạp). Copy từ mẫu:
   ```bash
   cp .jira.env.example .jira.env      # rồi điền FCAM_JIRA_PAT
   ```
   `.jira.env`:
   ```
   FCAM_JIRA_PAT=<token-của-bạn>
   FCAM_JIRA_PROJECT=RPA      # project mặc định cho 'jira task' (tuỳ chọn)
   ```
   *(Hoặc export trong `~/.zshrc` nếu muốn dùng chung mọi repo — token vẫn không commit.)*
3. Alias cho tiện:
   ```bash
   alias jira='bash /ABS/PATH/TO/REPO/.claude/skills/git-flow/jira.sh'
   ```
4. Test: `jira me` → in tên bạn nếu token đúng. Xem lệnh: `jira help`.

### Project key cho `jira task`
Thứ tự ưu tiên: **arg tường minh** → **`$FCAM_JIRA_PROJECT`** → **file `.jira-project`** ở gốc repo.
Mỗi service khai project riêng: commit `.jira-project` (1 dòng, vd `RPA`) — không phải secret.

> Token là **cá nhân**, đúng quyền Jira của bạn — mọi thao tác ghi (comment/log/transition) đứng tên bạn.
