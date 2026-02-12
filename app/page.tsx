import { Sparkles, Zap, GitBranch, Download } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-purple-400" />
            <span className="font-bold text-xl">AI Flowchart Builder</span>
          </div>
          <nav className="flex gap-6 text-sm text-white/70">
            <Link href="/builder" className="hover:text-white transition">Builder</Link>
            <a href="#features" className="hover:text-white transition">Features</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-4xl mx-auto px-4 pt-20 pb-32 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm mb-8">
          <Sparkles className="w-4 h-4" />
          <span>Powered by NVIDIA NIM & Kimi K2</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
          Describe it.<br />We diagram it.
        </h1>
        
        <p className="text-xl text-white/60 mb-12 max-w-2xl mx-auto">
          Create beautiful tree-style flowcharts, roadmaps, and diagrams with AI. 
          Just describe what you need — no design skills required.
        </p>
        
        <Link 
          href="/builder"
          className="inline-flex items-center gap-2 px-8 py-4 bg-purple-600 hover:bg-purple-500 rounded-xl font-semibold text-lg transition-all hover:scale-105"
        >
          <Zap className="w-5 h-5" />
          Start Building
        </Link>

        {/* Example prompt */}
        <div className="mt-16 p-6 rounded-2xl bg-white/5 border border-white/10 text-left max-w-2xl mx-auto">
          <p className="text-sm text-white/40 mb-2">Example prompt:</p>
          <p className="text-white/80 italic">
            "I need a roadmap for a customer support AI company. Show phases from MVP to scale, 
            including key milestones like AI agent training, widget deployment, and enterprise features."
          </p>
        </div>
      </main>

      {/* Features */}
      <section id="features" className="border-t border-white/10 bg-black/20">
        <div className="max-w-6xl mx-auto px-4 py-20">
          <h2 className="text-3xl font-bold text-center mb-16">Why AI Flowchart Builder?</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">AI-Powered</h3>
                  <p className="text-white/60">Multiple AI models working together to generate the perfect diagram structure for your needs.</p>
            </div>
            
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
                <GitBranch className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Tree-Style Layouts</h3>
              <p className="text-white/60">Beautiful hierarchical diagrams perfect for roadmaps, org charts, and process flows.</p>
            </div>
            
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
                <Download className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Export Anywhere</h3>
              <p className="text-white/60">Download as PNG, SVG, or JSON. Use in FigJam, Notion, presentations, or docs.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-white/40 text-sm">
        <p>Built with Next.js, NVIDIA NIM & Kimi</p>
      </footer>
    </div>
  );
}
