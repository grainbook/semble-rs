You have access to `semble_rs`, a Rust CLI tool for semantic code search, installed
on the host system. Call it via `bash`.

## Quick Start (first use in a session)

Before running `semble_rs search` for the first time, call `semble_rs_check`
to verify installation.  If it's missing, call `semble_rs_install` for
platform-aware setup commands.

## Available commands

| Command | Purpose | When to prefer over built-in tools |
|---------|---------|-------------------------------------|
| `semble_rs search "<query>" [path]` | Semantic code search (BM25 + Model2Vec). Returns relevant file paths with scores. | Natural-language queries, fuzzy concept search, cross-language. Use instead of `grep` for meaning-based searches. |
| `semble_rs find-related <file>:<line>` | Find code similar to a specific location. | "Find me code like this snippet." |
| `semble_rs tree [path]` | Compact codebase tree (gitignore-aware). | Token-efficient project overview. Use instead of `list` or `find` for broad scans. |
| `semble_rs digest [file]` | Compress build/CI logs (cargo, pnpm, tsc, pytest, GitHub Actions). | Any log/CI output > 10KB. Saves >90% context window. |
| `semble_rs deps <file>` | Dependency graph + symbols defined. | Understanding module coupling before refactoring. |
| `semble_rs impact <file>` | Transitive reverse dependencies (blast radius). | Assessing impact of a change. |
| `semble_rs find-pattern "<pattern>"` | AST structural pattern match (wraps ast-grep). | "Find all fn with name starting with `get_`". |
| `semble_rs plan "<task>"` | Recommend token-efficient exploration flow. | Before exploring an unfamiliar codebase. |

## Plugin tools (callable directly)

| Tool | Purpose |
|------|---------|
| `semble_rs_check` | Return a step-by-step diagnostic plan to verify installation (which, version check). Execute the returned commands via `bash`. |
| `semble_rs_install` | Return platform-aware install commands (cargo git / crates.io). Takes optional `method` arg: `"cargo-git"`, `"cargo-io"`, or `"auto"` (default). |
| `semble_rs_search_helper` | Build an optimized `semble_rs search` command with the right flags for token efficiency. Takes `query` (required), `mode`, `path`, `top_k`, `group`, `strip`, `include_text`. Execute the returned `command` via `bash`. |

## Key flags

**search:**
- `-k <N>` — top N results (default 10)
- `--json` — machine-readable JSON output
- `--compact` — minimal token output (paths + scores + match lines)
- `--outline` — one signature line per chunk (smallest token footprint)
- `--group` — group by directory
- `--strip` — strip comments from code chunks
- `--include-text-files` — also index .md, .yaml, .json, etc.

**tree:**
- `--max-depth <N>` — limit depth
- `--lang <langs>` — filter by language (e.g. `rust,python`)
- `--symbols` — append top-level symbols per file
- `--dirs-only` — directories only

**digest:**
- `--format <fmt>` — force format (cargo, pnpm, tsc, pytest, ci) or auto-detect

## Installation (if missing)

```bash
cargo install --git https://github.com/johunsang/semble_rs
```

## Usage pattern

Prefer `semble_rs search` for **understanding** (finding code by concept),
and `grep` for **exact** symbol/string matching. They complement each other.
