# PixelLab foundation workflow

User requested PixelLab for the next foundational game assets on 2026-10-08. Characters briefly moved to ComfyUI the same day and came back to PixelLab after the user rejected the ComfyUI base as off theme. Current main characters: docs/design/character-rig.md (create_character v3 with reference). The Medium rotations below are superseded. scripts/pixellab.ps1 needs -UseBasicParsing under Windows PowerShell 5.1 non-interactive sessions (added).

## Connection

User-level Codex config: ~/.codex/config.toml, server `pixellab`. Windows uses npx.cmd with mcp-remote, HTTP-only transport and AUTH_HEADER. No credential belongs in repository or frontend.

MCP initialize and tools/list succeeded against https://api.pixellab.ai/mcp. Codex CLI recognizes the configured server. Current chat tool catalog does not automatically expose newly configured tools; foundation calls use the same MCP endpoint through scripts/pixellab.ps1 until the app refreshes its tool catalog.

The helper initializes a session, calls one named tool and prints text blocks only. It reads credentials from the user configuration. Tool failures stop execution. Do not print config, bearer headers or inline image data.

## Scope

First: 64px Medium, standard mode, eight directions, low top-down view, selective outline and detailed shading. Second: 64px thin sandstone isometric ground tile, moss and restrained turquoise ritual inlay. Prompts/IDs are recorded alongside this document.

Use standard mode for this initial trial. Account currently allows only one generation job concurrently. Queue assets sequentially; do not switch to expensive pro mode or upgrade subscription without user instruction.

Download completed artifacts under apps/client/public/assets/pixellab. Inspect dimensions, alpha, view direction and palette. An isometric tile needs placement anchors and collision metadata before a playable map. Character rotations are not a walk animation.

Keep the current concept preview intact until a modular playable map exists. Do not represent exported PixelLab art as runtime-connected gameplay.

The preview now uses PixelLab Medium's south rotation on the existing imagegen environment. Requested size was 64, but returned common canvas is 92x92; use actual output dimensions. All eight idle directions are saved locally; no walking animation was requested.

Sandstone tile completed: 2606fd72-385f-47ab-8ccc-09abeb6f3eff, saved to apps/client/public/assets/pixellab/sandstone-v1.png. Kept as a modular map foundation asset; it does not replace the concept backdrop. Both generations completed; no jobs are pending from this setup.

## Sources

- PixelLab MCP live initialize and tools/list responses (catalog snapshot in pixellab-tool-catalog.json).
- Official Codex MCP configuration: https://learn.chatgpt.com/docs/extend/mcp?surface=cli
