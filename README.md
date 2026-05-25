# semble-rs

A grain plugin that gives the agent access to `semble_rs`, a semantic code
search CLI built on BM25 + Model2Vec. It complements exact regex matching
(`grep`) with meaning-based queries that work across languages.

## What it provides

| Capability | How the agent uses it |
|---|---|
| **Semantic search** (`semble_rs search`) | Natural-language queries like "where is auth middleware" — returns ranked file paths, no regex needed |
| **Find related code** (`semble_rs find-related`) | Drop a file:line and get similar snippets elsewhere |
| **Compact tree** (`semble_rs tree`) | Token-efficient project overview (gitignore-aware), replaces `ls -R` / `find` |
| **Log digest** (`semble_rs digest`) | Compress build/CI output (>10 KB) — saves >90% context window |
| **Dependency graph** (`semble_rs deps`) | "What does this file depend on, and what symbols does it define?" |
| **Blast radius** (`semble_rs impact`) | Transitive reverse dependencies — "if I change this, what breaks?" |
| **AST pattern match** (`semble_rs find-pattern`) | Structural search via ast-grep — "find every fn whose name starts with `get_`" |
| **Exploration plan** (`semble_rs plan`) | Token-efficient file traversal plan for an unfamiliar codebase |

Additionally the plugin registers three **built-in tools** the agent can call directly:

| Tool | Purpose |
|---|---|
| `semble_rs_check` | Diagnostic plan to verify `semble_rs` is installed on PATH |
| `semble_rs_install` | Platform-aware install commands (`cargo-git`, `cargo-io`, or `auto`) |
| `semble_rs_search_helper` | Build an optimised `semble_rs search` command with the right flags for token efficiency |

## Prerequisites

None — `semble_rs` is invoked via `bash` on the host. If it's missing the
agent can call `semble_rs_install` to get setup instructions.

## Install

```toml
# .grain/plugin.toml
[[plugin]]
name = "semble-rs"
src = "https://github.com/grainbook/semble-rs.git"
```

Or from inside grain:

```
lazy_install("semble-rs", "https://github.com/grainbook/semble-rs")
```

## Usage pattern

Prefer `semble_rs search` when the question is about **concepts** ("how does
error recovery work?") and `grep` when the question is about **exact
symbols** ("where is `handle_timeout` defined?"). The two tools complement
each other.

## Key flags

**search** — `-k <N>` top N, `--json` / `--compact` / `--outline` output
modes, `--group` group by directory, `--strip` strip comments,
`--include-text-files` also index .md/.yaml/.json/etc.

**tree** — `--max-depth <N>`, `--lang <langs>`, `--symbols`, `--dirs-only`.

**digest** — `--format <fmt>` force-parse as cargo / pnpm / tsc / pytest / ci
(or auto-detect).

## License

MIT OR Apache-2.0
