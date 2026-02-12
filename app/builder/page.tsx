"use client";

import { useState, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Connection,
  addEdge,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Sparkles, Download, Loader2, RefreshCw, GitBranch } from "lucide-react";
import { toPng } from "html-to-image";

// Flowchart node types with proper shapes
const ProcessNode = ({ data }: { data: any }) => (
  <div className="px-4 py-3 rounded-lg border-2 border-purple-400 bg-purple-500/20 shadow-lg min-w-[120px] text-center">
    <Handle type="target" position={Position.Top} className="!bg-purple-400" />
    <div className="font-medium text-white text-sm">{data.label}</div>
    <Handle type="source" position={Position.Bottom} className="!bg-purple-400" />
  </div>
);

const DecisionNode = ({ data }: { data: any }) => (
  <div 
    className="w-32 h-32 flex items-center justify-center border-2 border-cyan-400 bg-cyan-500/20 shadow-lg"
    style={{ transform: "rotate(45deg)" }}
  >
    <Handle type="target" position={Position.Top} className="!bg-cyan-400" style={{ transform: "rotate(-45deg)" }} />
    <div 
      className="font-medium text-white text-xs text-center px-2"
      style={{ transform: "rotate(-45deg)" }}
    >
      {data.label}
    </div>
    <Handle type="source" position={Position.Bottom} className="!bg-cyan-400" style={{ transform: "rotate(-45deg)" }} />
    <Handle type="source" position={Position.Right} className="!bg-cyan-400" style={{ transform: "rotate(-45deg)" }} />
    <Handle type="source" position={Position.Left} className="!bg-cyan-400" style={{ transform: "rotate(-45deg)" }} />
  </div>
);

const StartEndNode = ({ data }: { data: any }) => (
  <div className="px-6 py-3 rounded-full border-2 border-emerald-400 bg-emerald-500/20 shadow-lg min-w-[100px] text-center">
    <Handle type="target" position={Position.Top} className="!bg-emerald-400" />
    <div className="font-medium text-white text-sm">{data.label}</div>
    <Handle type="source" position={Position.Bottom} className="!bg-emerald-400" />
  </div>
);

const InputOutputNode = ({ data }: { data: any }) => (
  <div 
    className="px-4 py-3 border-2 border-amber-400 bg-amber-500/20 shadow-lg min-w-[120px] text-center"
    style={{ clipPath: "polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%)" }}
  >
    <Handle type="target" position={Position.Top} className="!bg-amber-400" />
    <div className="font-medium text-white text-sm px-2">{data.label}</div>
    <Handle type="source" position={Position.Bottom} className="!bg-amber-400" />
  </div>
);

const nodeTypes = {
  process: ProcessNode,
  decision: DecisionNode,
  startEnd: StartEndNode,
  inputOutput: InputOutputNode,
};

const getNodeColor = (type: string) => {
  switch (type) {
    case "process": return "#a855f7";
    case "decision": return "#22d3ee";
    case "startEnd": return "#34d399";
    case "inputOutput": return "#fbbf24";
    default: return "#6b7280";
  }
};

export default function BuilderPage() {
  const [prompt, setPrompt] = useState("");
  const [diagramType, setDiagramType] = useState<
    "roadmap" | "org-chart" | "process" | "mind-map"
  >("process");
  const [isGenerating, setIsGenerating] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [usedAI, setUsedAI] = useState("");

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, diagramType }),
      });

      const data = await response.json();

      if (data.success) {
        setNodes(data.nodes);
        setEdges(data.edges);
        setHasGenerated(true);
        setUsedAI(data.usedAI || "");
      }
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async () => {
    const flowElement = document.querySelector(".react-flow__viewport") as HTMLElement;
    if (flowElement) {
      const dataUrl = await toPng(flowElement, {
        backgroundColor: "#0f172a",
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `flowchart-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-purple-400" />
            <span className="font-bold text-xl">AI Flowchart Builder</span>
          </div>
          <a href="/" className="text-sm text-white/60 hover:text-white transition">
            ← Back to Home
          </a>
        </div>
      </header>

      <div className="flex h-[calc(100vh-65px)]">
        {/* Sidebar */}
        <div className="w-96 border-r border-white/10 bg-black/20 p-6 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4">Create Your Diagram</h2>

          {/* Diagram Type */}
          <div className="mb-4">
            <label className="block text-sm text-white/60 mb-2">Diagram Type</label>
            <select
              value={diagramType}
              onChange={(e) => setDiagramType(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="process">Process Flow</option>
              <option value="roadmap">Product Roadmap</option>
              <option value="org-chart">Org Chart</option>
              <option value="mind-map">Mind Map</option>
            </select>
          </div>

          {/* Prompt Input */}
          <div className="mb-4">
            <label className="block text-sm text-white/60 mb-2">
              Describe what you need
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Order processing flow with stock check and payment validation..."
              className="w-full h-32 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 disabled:cursor-not-allowed rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Diagram
              </>
            )}
          </button>

          {/* Example Prompts */}
          {!hasGenerated && (
            <div className="mt-6">
              <p className="text-sm text-white/40 mb-3">Try an example:</p>
              <div className="space-y-2">
                {[
                  "Order processing: receive order → check stock → (if in stock) check payment → (if valid) process → deliver",
                  "Customer support flow: ticket created → categorize → (if urgent) escalate → assign agent → resolve → close",
                  "User signup: visit site → register → verify email → (if valid) create profile → onboarding → dashboard",
                  "Content approval: draft → submit → review → (if approved) publish, (if rejected) revise",
                ].map((example, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPrompt(example)}
                    className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-white/70 transition text-wrap"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Export Options */}
          {hasGenerated && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-sm text-white/40 mb-3">Export</p>
              <div className="space-y-2">
                <button
                  onClick={handleExport}
                  className="w-full py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 flex items-center gap-2 text-sm transition"
                >
                  <Download className="w-4 h-4" />
                  Download as PNG
                </button>
                <button
                  onClick={handleGenerate}
                  className="w-full py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 flex items-center gap-2 text-sm transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  Regenerate
                </button>
              </div>
              {usedAI && (
                <p className="mt-3 text-xs text-white/30">
                  Generated by:{" "}
                  <span className="text-purple-400/70 font-mono">
                    {usedAI === "nvidia-nim"
                      ? "NVIDIA NIM (GLM 4.7)"
                      : usedAI === "kimi-via-nim"
                      ? "Kimi K2 (via NIM)"
                      : usedAI === "kimi"
                      ? "Kimi (Moonshot)"
                      : "Local engine"}
                  </span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-slate-900/50">
          {hasGenerated ? (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-right"
            >
              <Background color="#475569" gap={20} size={1} />
              <Controls className="bg-slate-800 border-slate-700" />
              <MiniMap
                className="bg-slate-800 border-slate-700"
                nodeColor={(node) => getNodeColor(node.type || "process")}
                maskColor="rgb(15, 23, 42, 0.8)"
              />
            </ReactFlow>
          ) : (
            <div className="h-full flex items-center justify-center text-white/30">
              <div className="text-center">
                <GitBranch className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Enter a prompt to generate your diagram</p>
                <p className="text-sm mt-2 text-white/20">
                  Process flows, roadmaps, org charts, and more
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
