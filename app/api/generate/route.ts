import { NextRequest, NextResponse } from "next/server";

export interface FlowchartNode {
  id: string;
  type: "process" | "decision" | "startEnd" | "inputOutput";
  position: { x: number; y: number };
  data: {
    label: string;
  };
}

export interface FlowchartEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
}

export interface GenerateRequest {
  prompt: string;
  diagramType: "roadmap" | "org-chart" | "process" | "mind-map";
}

interface AIGeneratedFlow {
  nodes: FlowchartNode[];
  edges: FlowchartEdge[];
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

const VALID_NODE_TYPES = new Set(["process", "decision", "startEnd", "inputOutput"]);

/** Build the system prompt that every AI provider sees. */
function buildSystemPrompt(diagramType: string): string {
  return `You are a professional flowchart / diagram generator.
Given a user description, produce a structured flowchart as **pure JSON** (no markdown, no explanation, no prose — ONLY the JSON object).

The JSON must match this schema exactly:
{
  "nodes": [
    {
      "id": "<unique string>",
      "type": "<one of: process | decision | startEnd | inputOutput>",
      "position": { "x": <number>, "y": <number> },
      "data": { "label": "<short text>" }
    }
  ],
  "edges": [
    {
      "id": "<unique string>",
      "source": "<node id>",
      "target": "<node id>",
      "label": "<optional text>",
      "animated": true
    }
  ]
}

Rules:
- Every diagram MUST start with a "startEnd" node labelled "Start" and end with a "startEnd" node labelled "End".
- Use "process" for action steps (rectangle), "decision" for yes/no questions (diamond), "startEnd" for start/end (oval), "inputOutput" for data I/O (parallelogram).
- Layout: main flow goes top-to-bottom at x=250. Branch left to x=50 and right to x=450. Space nodes ~120px apart vertically.
- Aim for 5-10 nodes — enough detail without clutter.
- Decision nodes MUST have at least two outgoing edges with labels like "Yes"/"No".
- Edge ids should be like "e-<source>-<target>".
- Every edge should have "animated": true.
- Keep node labels concise (max 30 chars).
- Diagram type requested: "${diagramType}".

Respond with ONLY the JSON object. No markdown fences, no text before or after.`;
}

/** Try multiple strategies to pull valid JSON from an AI response string. */
function extractJSON(raw: string): AIGeneratedFlow | null {
  if (!raw || typeof raw !== "string") return null;

  // Strategy 1: Try parsing the entire response as JSON directly
  try {
    const parsed = JSON.parse(raw.trim());
    if (parsed.nodes && parsed.edges) return parsed;
  } catch { /* continue */ }

  // Strategy 2: Extract from ```json ... ``` markdown fence
  const fenceMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (fenceMatch) {
    try {
      const parsed = JSON.parse(fenceMatch[1].trim());
      if (parsed.nodes && parsed.edges) return parsed;
    } catch { /* continue */ }
  }

  // Strategy 3: Find the first { ... } block that contains "nodes"
  const braceMatch = raw.match(/(\{[\s\S]*"nodes"[\s\S]*\})/);
  if (braceMatch) {
    // Find the balanced closing brace
    let depth = 0;
    let start = -1;
    for (let i = 0; i < raw.length; i++) {
      if (raw[i] === "{") {
        if (depth === 0) start = i;
        depth++;
      } else if (raw[i] === "}") {
        depth--;
        if (depth === 0 && start >= 0) {
          const candidate = raw.slice(start, i + 1);
          if (candidate.includes('"nodes"')) {
            try {
              const parsed = JSON.parse(candidate);
              if (parsed.nodes && parsed.edges) return parsed;
            } catch { /* continue trying */ }
          }
        }
      }
    }
  }

  return null;
}

/** Validate and sanitize AI-generated flowchart data. */
function validateFlowchart(data: AIGeneratedFlow): AIGeneratedFlow | null {
  if (!data || !Array.isArray(data.nodes) || !Array.isArray(data.edges)) return null;
  if (data.nodes.length === 0) return null;

  const nodeIds = new Set<string>();

  const nodes: FlowchartNode[] = data.nodes
    .filter((n: any) => n && n.id && n.data?.label)
    .map((n: any) => {
      nodeIds.add(String(n.id));
      return {
        id: String(n.id),
        type: VALID_NODE_TYPES.has(n.type) ? n.type : "process",
        position: {
          x: typeof n.position?.x === "number" ? n.position.x : 250,
          y: typeof n.position?.y === "number" ? n.position.y : 0,
        },
        data: { label: String(n.data.label).slice(0, 40) },
      };
    });

  if (nodes.length === 0) return null;

  const edges: FlowchartEdge[] = data.edges
    .filter((e: any) => e && e.source && e.target && nodeIds.has(String(e.source)) && nodeIds.has(String(e.target)))
    .map((e: any) => ({
      id: e.id ? String(e.id) : `e-${e.source}-${e.target}`,
      source: String(e.source),
      target: String(e.target),
      ...(e.label ? { label: String(e.label) } : {}),
      animated: true,
    }));

  return { nodes, edges };
}

/** Fetch with a timeout via AbortController. */
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 30000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// ─── AI Provider: NVIDIA NIM ──────────────────────────────────────────────────

async function callNvidiaNIM(
  prompt: string,
  diagramType: string,
  model = "z-ai/glm4.7"
): Promise<AIGeneratedFlow | null> {
  const apiKey = process.env.NVIDIA_NIM_API_KEY;
  if (!apiKey) {
    console.log("[NVIDIA NIM] API key not configured — skipping");
    return null;
  }

  const label = `[NVIDIA NIM / ${model}]`;
  console.log(`${label} Sending request...`);

  try {
    const response = await fetchWithTimeout(
      "https://integrate.api.nvidia.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: buildSystemPrompt(diagramType) },
            {
              role: "user",
              content: `Generate a ${diagramType} diagram for: ${prompt}`,
            },
          ],
          temperature: 0.3,
          max_tokens: 8000,
        }),
      },
      30000
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error(`${label} HTTP ${response.status}: ${errText}`);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error(`${label} Empty response content`);
      return null;
    }

    console.log(`${label} Got response (${content.length} chars)`);

    const extracted = extractJSON(content);
    if (!extracted) {
      console.error(`${label} Failed to extract JSON from response`);
      console.error(`${label} Raw content (first 500 chars):`, content.slice(0, 500));
      return null;
    }

    const validated = validateFlowchart(extracted);
    if (!validated) {
      console.error(`${label} Validation failed for extracted data`);
      return null;
    }

    console.log(`${label} Success — ${validated.nodes.length} nodes, ${validated.edges.length} edges`);
    return validated;
  } catch (error: any) {
    if (error?.name === "AbortError") {
      console.error(`${label} Request timed out (30s)`);
    } else {
      console.error(`${label} Error:`, error?.message || error);
    }
    return null;
  }
}

// ─── AI Provider: Kimi (via Moonshot direct API) ──────────────────────────────

async function callKimi(prompt: string, diagramType: string): Promise<AIGeneratedFlow | null> {
  const apiKey = process.env.KIMI_API_KEY;
  if (!apiKey) {
    console.log("[Kimi] API key not configured — skipping");
    return null;
  }

  console.log("[Kimi] Sending request to Moonshot API...");

  try {
    const response = await fetchWithTimeout(
      "https://api.moonshot.ai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "moonshot-v1-8k",
          messages: [
            { role: "system", content: buildSystemPrompt(diagramType) },
            {
              role: "user",
              content: `Generate a ${diagramType} diagram for: ${prompt}`,
            },
          ],
          temperature: 0.3,
          response_format: { type: "json_object" },
        }),
      },
      30000
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Kimi] HTTP ${response.status}: ${errText}`);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("[Kimi] Empty response content");
      return null;
    }

    console.log(`[Kimi] Got response (${content.length} chars)`);

    const extracted = extractJSON(content);
    if (!extracted) {
      console.error("[Kimi] Failed to extract JSON from response");
      console.error("[Kimi] Raw content (first 500 chars):", content.slice(0, 500));
      return null;
    }

    const validated = validateFlowchart(extracted);
    if (!validated) {
      console.error("[Kimi] Validation failed for extracted data");
      return null;
    }

    console.log(`[Kimi] Success — ${validated.nodes.length} nodes, ${validated.edges.length} edges`);
    return validated;
  } catch (error: any) {
    if (error?.name === "AbortError") {
      console.error("[Kimi] Request timed out (30s)");
    } else {
      console.error("[Kimi] Error:", error?.message || error);
    }
    return null;
  }
}

// ─── Fallback: Local generation ───────────────────────────────────────────────

function generateLocalFlowchart(prompt: string, type: string): AIGeneratedFlow {
  const nodes: FlowchartNode[] = [];
  const edges: FlowchartEdge[] = [];

  // Parse by arrows or commas
  const parts = prompt
    .split(/→|->|,/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (parts.length >= 3) {
    // Start node
    nodes.push({
      id: "start",
      type: "startEnd",
      position: { x: 250, y: 0 },
      data: { label: parts[0].replace(/[()]/g, "").slice(0, 25) },
    });

    let currentY = 120;
    let lastNodeId = "start";

    for (let i = 1; i < Math.min(parts.length, 8); i++) {
      const part = parts[i];
      const isDecision =
        part.includes("check") ||
        part.includes("verify") ||
        part.includes("validate") ||
        part.includes("if ") ||
        part.includes("?");
      const nodeId = `step-${i}`;

      if (isDecision && i < parts.length - 1) {
        nodes.push({
          id: nodeId,
          type: "decision",
          position: { x: 250, y: currentY },
          data: { label: part.replace(/[()]/g, "").slice(0, 25) },
        });

        edges.push({
          id: `e-${lastNodeId}-${nodeId}`,
          source: lastNodeId,
          target: nodeId,
          animated: true,
        });

        const yesId = `${nodeId}-yes`;
        nodes.push({
          id: yesId,
          type: "process",
          position: { x: 50, y: currentY + 120 },
          data: { label: "Continue" },
        });
        edges.push({
          id: `e-${nodeId}-${yesId}`,
          source: nodeId,
          target: yesId,
          label: "Yes",
          animated: true,
        });

        const noId = `${nodeId}-no`;
        nodes.push({
          id: noId,
          type: "process",
          position: { x: 450, y: currentY + 120 },
          data: { label: "Handle" },
        });
        edges.push({
          id: `e-${nodeId}-${noId}`,
          source: nodeId,
          target: noId,
          label: "No",
          animated: true,
        });

        currentY += 240;
        const mergeId = `merge-${i}`;
        nodes.push({
          id: mergeId,
          type: i === parts.length - 2 ? "startEnd" : "process",
          position: { x: 250, y: currentY },
          data: {
            label:
              i === parts.length - 2
                ? "End"
                : parts[i + 1]?.slice(0, 25) || "Next",
          },
        });

        edges.push({
          id: `e-${yesId}-${mergeId}`,
          source: yesId,
          target: mergeId,
          animated: true,
        });
        edges.push({
          id: `e-${noId}-${mergeId}`,
          source: noId,
          target: mergeId,
          animated: true,
        });

        lastNodeId = mergeId;
        i++;
      } else {
        const isEnd = i === parts.length - 1;
        nodes.push({
          id: nodeId,
          type: isEnd ? "startEnd" : "process",
          position: { x: 250, y: currentY },
          data: { label: part.replace(/[()]/g, "").slice(0, 25) },
        });

        edges.push({
          id: `e-${lastNodeId}-${nodeId}`,
          source: lastNodeId,
          target: nodeId,
          animated: true,
        });

        lastNodeId = nodeId;
        currentY += 120;
      }
    }
  } else {
    // Default simple flow
    nodes.push(
      {
        id: "start",
        type: "startEnd",
        position: { x: 250, y: 0 },
        data: { label: "Start" },
      },
      {
        id: "process",
        type: "process",
        position: { x: 250, y: 120 },
        data: { label: prompt.slice(0, 25) || "Process" },
      },
      {
        id: "end",
        type: "startEnd",
        position: { x: 250, y: 240 },
        data: { label: "End" },
      }
    );
    edges.push(
      { id: "e1", source: "start", target: "process", animated: true },
      { id: "e2", source: "process", target: "end", animated: true }
    );
  }

  return { nodes, edges };
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { prompt, diagramType } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    let flowchart: AIGeneratedFlow | null = null;
    let usedAI = "";

    // 1) Try NVIDIA NIM with GLM 4.7 (primary)
    console.log("=== Trying NVIDIA NIM (GLM 4.7) ===");
    flowchart = await callNvidiaNIM(prompt, diagramType, "z-ai/glm4.7");
    if (flowchart) usedAI = "nvidia-nim";

    // 2) Try NVIDIA NIM with Kimi K2 (fallback via NVIDIA)
    if (!flowchart) {
      console.log("=== Trying NVIDIA NIM (Kimi K2) ===");
      flowchart = await callNvidiaNIM(prompt, diagramType, "moonshotai/kimi-k2-instruct");
      if (flowchart) usedAI = "kimi-via-nim";
    }

    // 3) Try Kimi direct API (if user has a valid Moonshot API key)
    if (!flowchart) {
      console.log("=== Trying Kimi direct API ===");
      flowchart = await callKimi(prompt, diagramType);
      if (flowchart) usedAI = "kimi";
    }

    // 4) Final fallback — local generation
    if (!flowchart) {
      console.log("=== Using local generation (fallback) ===");
      flowchart = generateLocalFlowchart(prompt, diagramType);
      usedAI = "local";
    }

    return NextResponse.json({
      success: true,
      nodes: flowchart.nodes,
      edges: flowchart.edges,
      prompt,
      diagramType,
      usedAI,
    });
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate flowchart" },
      { status: 500 }
    );
  }
}
