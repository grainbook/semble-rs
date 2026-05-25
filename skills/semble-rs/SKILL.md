---
name: semble-rs
description: |
  Semantic code search via semble_rs. Triggers on: semantic search, code search,
  find in code, search code, search for, where is, find where, find related,
  codebase tree, project structure overview, log digest, CI log compress,
  dependency graph, impact analysis, blast radius, what depends on, what imports,
  find pattern, AST pattern, plan exploration, semble, 语义搜索, 代码搜索,
  查找代码, 项目结构, 依赖分析, 影响分析
argument-hint: "[search|tree|digest|deps|impact|find-related|find-pattern|plan] <args>"
context: fork
agent: Explore
---

# semble_rs — Semantic Code Search for AI Agents

Hybrid BM25 + Model2Vec engine. Single binary, no API keys, no GPU, runs locally.

## Quick Reference

| Command | What it does | Best for |
|---------|-------------|----------|
| `semble_rs search "<query>"` | Semantic search over codebase | Concept/meaning search |
| `semble_rs find-related <file>:<line>` | Find similar code to a location | "Find code like this" |
| `semble_rs tree` | Compact directory tree | Project overview |
| `semble_rs digest <file>` | Compress build/CI logs | Large log files |
| `semble_rs deps <file>` | What this file imports + defines | Module coupling |
| `semble_rs impact <file>` | Transitive reverse dependencies | Blast radius |
| `semble_rs find-pattern "<pat>"` | AST structural pattern (ast-grep) | Structural search |
| `semble_rs plan "<task>"` | Recommended exploration flow | Unfamiliar codebases |

## Common Flags

### search
```
  -k <N>               top N results (default 10)
  --json               machine-readable JSON
  --compact            minimal tokens: paths + scores + match lines only
  --outline            one signature per chunk (smallest footprint)
  --group              group by directory
  --strip              remove comments from code chunks
  --include-text-files also index .md, .yaml, .json, etc.
```

### tree
```
  --max-depth <N>      limit depth
  --lang <langs>       filter by language (e.g. rust,python)
  --symbols            append top-level symbols per file
  --dirs-only          directories only
```

### digest
```
  --format <fmt>       force format: cargo, pnpm, tsc, pytest, ci (default: auto-detect)
```

## Usage Patterns

### 1. Semantic Search (most common)
```
semble_rs search "how does authentication work"
semble_rs search "error handling pattern"
semble_rs search "数据库连接" src/
semble_rs search "login" --compact --group
```
Use for: concept search, finding relevant files by meaning, cross-language queries.
NOT for: exact string matching (use `grep`), symbol lookup (use LSP).

### 2. Codebase Tree
```
semble_rs tree --max-depth 3 --lang rust
semble_rs tree --symbols --lang rust,python
semble_rs tree --dirs-only
```
Use for: project overview, understanding directory layout, before drilling into specifics.
Prefer over: `ls -R`, `find . -type f`, `list` with deep recursion.

### 3. Log Digest
```
semble_rs digest build.log
semble_rs digest ci-output.txt
semble_rs digest --format cargo build.log
```
Use for: any log file > 10KB, CI output, build failures.
The digest preserves error signatures while removing timestamps, paths, and repetition.

### 4. Dependency / Impact Analysis
```
semble_rs deps src/auth/login.rs
semble_rs impact src/common/types.rs
```
Use for: understanding coupling before refactoring, assessing change blast radius.

### 5. Find Related / Structural Search
```
semble_rs find-related src/main.rs:42
semble_rs find-pattern "fn get_$$$($$$) -> $$$"
```

### 6. Plan Exploration
```
semble_rs plan "add OAuth2 login to the backend"
```
Use before exploring an unfamiliar codebase to get a token-efficient plan.

## Decision Tree

```
Need to find code by CONCEPT or MEANING?
  → semble_rs search "<natural language query>"

Need to find code SIMILAR to a known location?
  → semble_rs find-related <file>:<line>

Need to find code by STRUCTURAL PATTERN (AST)?
  → semble_rs find-pattern "<ast-grep pattern>"

Need to find exact STRING or SYMBOL?
  → grep

Need to understand PROJECT STRUCTURE?
  → semble_rs tree (for overview), then drill in with list/read

Need to understand a LOG FILE (>10KB)?
  → semble_rs digest, otherwise read

Need to understand MODULE COUPLING?
  → semble_rs deps / impact

Need to EXPLORE an unfamiliar codebase?
  → semble_rs plan "<your task>"
```

## Token Optimization

When using `semble_rs search` as a tool call, always prefer the most compact output format:
1. `--outline` — smallest, one line per result
2. `--compact` — paths + scores + match lines
3. `--group` — grouped by directory, caps at 3 lines per chunk
4. `--json` — when you need structured data to parse

## Installation (if missing)

```bash
cargo install --git https://github.com/johunsang/semble_rs
```

Check if already installed:
```bash
which semble_rs
```
