// semble_rs plugin — enhanced check.js
// Registers three tools the agent can call:
//   semble_rs_check         — verify installation, detect platform, return a diagnostic plan
//   semble_rs_install       — provide platform-aware install commands
//   semble_rs_search_helper — build an optimized `semble_rs search` command
//
// Because the Boa sandbox has no shell access, each tool returns structured
// guidance.  The agent reads the response and executes commands via `bash`.

// ── Platform detection (best-effort from available globals) ──────────────
// Boa does not expose process.platform, so we provide a generic plan that
// covers Linux / macOS / Windows (MSYS2 / WSL).  The agent adapts at runtime.

var PLATFORM_HINT = "unknown (try Linux/macOS commands first; fall back to Windows or WSL)";

// ── Tool: check ──────────────────────────────────────────────────────────
grain.register_tool({
    name: "semble_rs_check",
    description:
        "Check if semble_rs (or its npm variant semble-rs) is installed on PATH. " +
        "Returns a step-by-step diagnostic plan the agent should execute via bash. " +
        "Use this before calling `semble_rs search` for the first time in a session.",
    schema: {
        type: "object",
        properties: {},
        required: []
    },
    run: function(_args) {
        return JSON.stringify({
            title: "semble_rs Installation Diagnostic Plan",
            note: "Execute steps 1-3 in order via bash. Stop early if a step succeeds.",
            steps: [
                {
                    step: 1,
                    label: "Check PATH for semble_rs",
                    command: "which semble_rs 2>/dev/null || where.exe semble_rs 2>/dev/null || echo 'NOT_FOUND'",
                    expect: "If it returns a filesystem path → semble_rs is installed. Skip to step 3 for the version.",
                    fallback: "If 'NOT_FOUND' → proceed to step 2."
                },
                {
                    step: 2,
                    label: "Check PATH for semble-rs (npm / alternative name)",
                    command: "which semble-rs 2>/dev/null || where.exe semble-rs 2>/dev/null || echo 'NOT_FOUND'",
                    note: "Some distributions or npm packages use the hyphenated name 'semble-rs'.",
                    expect: "If a path is returned → use 'semble-rs' as the binary name going forward.",
                    fallback: "If 'NOT_FOUND' → semble_rs is not installed. Proceed to step 4 (install)."
                },
                {
                    step: 3,
                    label: "Get installed version",
                    command: "semble_rs --version 2>/dev/null || semble-rs --version 2>/dev/null || echo 'VERSION_UNKNOWN'",
                    expect: "Version string (e.g. 'semble_rs 0.2.1'). Use this to decide whether to upgrade."
                },
                {
                    step: 4,
                    label: "Install semble_rs (only if steps 1-2 both returned NOT_FOUND)",
                    note: "Call the `semble_rs_install` tool for detailed install commands, or run the shell command below:",
                    command: "cargo install --git https://github.com/johunsang/semble_rs",
                    prerequisite: "Rust toolchain (rustc + cargo). If missing: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y",
                    verify: "After install, run: semble_rs --version"
                }
            ],
            recommendation: "Run steps 1-3 first. Report findings to the user, then offer to install if missing."
        }, null, 2);
    }
});

// ── Tool: install ────────────────────────────────────────────────────────
grain.register_tool({
    name: "semble_rs_install",
    description:
        "Return platform-aware install commands for semble_rs. " +
        "Supports cargo (git / crates.io), and describes prerequisites.",
    schema: {
        type: "object",
        properties: {
            method: {
                type: "string",
                description: "Install source: 'cargo-git' (recommended, latest), 'cargo-io' (crates.io), or 'auto'.",
                enum: ["cargo-git", "cargo-io", "auto"]
            }
        },
        required: []
    },
    run: function(args) {
        var method = (args && args.method) || "auto";

        var plans = {
            "cargo-git": {
                label: "Install from GitHub (latest commit)",
                steps: [
                    {
                        label: "Ensure Rust is installed",
                        check: "rustc --version && cargo --version",
                        install_rust: "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y\n# Then restart your shell or run:\nsource \"$HOME/.cargo/env\""
                    },
                    {
                        label: "Install semble_rs from git",
                        command: "cargo install --git https://github.com/johunsang/semble_rs"
                    },
                    {
                        label: "Verify",
                        command: "semble_rs --version"
                    }
                ]
            },
            "cargo-io": {
                label: "Install from crates.io (published release)",
                steps: [
                    {
                        label: "Ensure Rust is installed",
                        check: "rustc --version && cargo --version",
                        install_rust: "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y\nsource \"$HOME/.cargo/env\""
                    },
                    {
                        label: "Install semble_rs from crates.io",
                        command: "cargo install semble_rs"
                    },
                    {
                        label: "Verify",
                        command: "semble_rs --version"
                    }
                ]
            },
            "auto": {
                label: "Auto-detect and install",
                description: "Installs Rust if needed, then tries git first (latest). Falls back to crates.io.",
                command: [
                    "# 1. Ensure Rust toolchain",
                    "rustc --version 2>/dev/null && cargo --version 2>/dev/null || {",
                    "  echo 'Installing Rust...'",
                    "  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y",
                    "  source \"$HOME/.cargo/env\"",
                    "}",
                    "",
                    "# 2. Install semble_rs (prefer git for latest features)",
                    "cargo install --git https://github.com/johunsang/semble_rs 2>/dev/null || \\",
                    "cargo install semble_rs",
                    "",
                    "# 3. Verify",
                    "semble_rs --version && echo '✅ semble_rs installed successfully'"
                ].join("\n")
            }
        };

        var plan = plans[method] || plans["auto"];
        return JSON.stringify({
            method: method,
            plan: plan,
            note: "Execute the shell commands above via bash. The agent should copy-paste the command block and run it."
        }, null, 2);
    }
});

// ── Tool: search_helper ──────────────────────────────────────────────────
grain.register_tool({
    name: "semble_rs_search_helper",
    description:
        "Build an optimized `semble_rs search` command for a natural-language query. " +
        "Returns the exact shell command string plus flag rationale. " +
        "The agent should then execute the returned command via bash.",
    schema: {
        type: "object",
        properties: {
            query: {
                type: "string",
                description: "Semantic search query in natural language."
            },
            mode: {
                type: "string",
                description: "Output format. 'outline' = smallest token footprint; 'compact' = paths+scores (default); 'json' = machine-readable; 'full' = all chunks.",
                enum: ["outline", "compact", "json", "full"]
            },
            path: {
                type: "string",
                description: "Optional subdirectory to restrict search to."
            },
            top_k: {
                type: "integer",
                description: "Max results (1-50, default 10)."
            },
            group: {
                type: "boolean",
                description: "Group results by directory for cleaner output."
            },
            strip: {
                type: "boolean",
                description: "Strip comments from returned code chunks (saves tokens)."
            },
            include_text: {
                type: "boolean",
                description: "Also index .md, .yaml, .json, .toml, etc."
            }
        },
        required: ["query"]
    },
    run: function(args) {
        if (!args || !args.query) {
            return JSON.stringify({
                error: "Missing required parameter: query"
            });
        }

        var query = args.query;
        var flags = [];

        // ── Output mode ──────────────────────────────────────────────
        var mode = args.mode || "compact";
        if (mode === "outline") {
            flags.push("--outline");
        } else if (mode === "compact") {
            flags.push("--compact");
        } else if (mode === "json") {
            flags.push("--json");
        }
        // "full" → no compact/json/outline flag → verbose output

        // ── Top-K ────────────────────────────────────────────────────
        if (args.top_k && typeof args.top_k === "number" && args.top_k > 0) {
            flags.push("-k " + args.top_k);
        }

        // ── Flags ────────────────────────────────────────────────────
        if (args.group)  { flags.push("--group"); }
        if (args.strip)  { flags.push("--strip"); }
        if (args.include_text) { flags.push("--include-text-files"); }

        // ── Path ─────────────────────────────────────────────────────
        var path = args.path || "";

        // ── Assemble ─────────────────────────────────────────────────
        var flagStr = flags.join(" ");
        var cmd = "semble_rs search \"" + query.replace(/"/g, "\\\"") + "\"";
        if (flagStr) { cmd += " " + flagStr; }
        if (path)    { cmd += " " + path; }

        // ── Token budget guidance ────────────────────────────────────
        var tokenNotes = {
            outline: "~1 line per result — best for scanning large codebases quickly",
            compact: "paths + scores + match lines — good default balance",
            json:   "structured, machine-readable — use when parsing results",
            full:   "full code chunks — highest token cost, use only for deep inspection"
        };

        return JSON.stringify({
            command: cmd,
            mode: mode,
            mode_token_budget: tokenNotes[mode] || "",
            flags_used: flags,
            notes: [
                "Execute the 'command' above via bash to get semantic search results.",
                "For exact symbol matching, prefer grep over semble_rs search.",
                "Add --include-text-files to also search docs, configs, and data files.",
                "Combine with `semble_rs tree` for project overview before searching.",
                "If search returns 0 results, try broadening the query or removing the path restriction."
            ]
        }, null, 2);
    }
});

// ── Notify host that tools are ready ─────────────────────────────────────
grain.push_notification({
    type: "plugin_loaded",
    plugin: "semble_rs",
    tools: ["semble_rs_check", "semble_rs_install", "semble_rs_search_helper"]
});
