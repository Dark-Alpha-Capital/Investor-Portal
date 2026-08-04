/**
 * The chat UI message/tool types now live in `apps/web/lib/chat/message-types.ts`,
 * derived from the full tool registry in `apps/web/lib/chat/tools/registry.ts`.
 *
 * ai-core owns the model registry, prompts, and provider wiring only — the UI
 * message shape is an app-layer concern (it must match the tools the app ships).
 */
