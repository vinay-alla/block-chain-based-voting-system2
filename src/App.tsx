import React, { useState, useEffect, useCallback } from "react";
import { Terminal, Shield, ShieldCheck, Database, Award, BookOpen, AlertTriangle, RefreshCw, Cpu, Clock } from "lucide-react";
import { Candidate, Voter, Block, SystemStatus, DocContent } from "./types";
import ResultsDashboard from "./components/ResultsDashboard";
import VoterPortal from "./components/VoterPortal";
import BlockchainVisualizer from "./components/BlockchainVisualizer";
import AdminPanel from "./components/AdminPanel";
import DocsReport from "./components/DocsReport";

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "voter" | "blockchain" | "admin" | "docs">("dashboard");

  // Core global data states
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [blockchain, setBlockchain] = useState<Block[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [docContent, setDocContent] = useState<DocContent | null>(null);

  // Loading & error trackers
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState("");

  // Sync date time in mono format
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toISOString().replace("T", " | ").substring(0, 21) + " UTC");
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch functions wrapped in useCallback to prevent infinite render loops
  const fetchCandidates = useCallback(async () => {
    try {
      const res = await fetch("/api/candidates");
      if (res.ok) {
        const data = await res.json();
        setCandidates(data);
      }
    } catch (e) {
      console.error("Error loading candidates list", e);
    }
  }, []);

  const fetchVoters = useCallback(async () => {
    try {
      const res = await fetch("/api/voters");
      if (res.ok) {
        const data = await res.json();
        setVoters(data);
      }
    } catch (e) {
      console.error("Error loading voter directory", e);
    }
  }, []);

  const fetchBlockchain = useCallback(async () => {
    try {
      const res = await fetch("/api/blockchain");
      if (res.ok) {
        const data = await res.json();
        setBlockchain(data);
      }
    } catch (e) {
      console.error("Error loading blockchain stream", e);
    }
  }, []);

  const fetchSystemStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/system-status");
      if (res.ok) {
        const data = await res.json();
        setSystemStatus(data);
      }
    } catch (e) {
      console.error("Error loading status parameters", e);
    }
  }, []);

  const fetchDocs = useCallback(async () => {
    try {
      const res = await fetch("/api/docs");
      if (res.ok) {
        const data = await res.json();
        setDocContent(data);
      }
    } catch (e) {
      console.error("Error loading thesis parameters", e);
    }
  }, []);

  // Sync absolute state
  const syncConsensusMatrix = useCallback(async () => {
    try {
      await Promise.all([
        fetchCandidates(),
        fetchVoters(),
        fetchBlockchain(),
        fetchSystemStatus(),
        fetchDocs(),
      ]);
      setLoadError(null);
    } catch (err) {
      setLoadError("Handshake with decentralized system failed.");
    } finally {
      setIsLoading(false);
    }
  }, [fetchCandidates, fetchVoters, fetchBlockchain, fetchSystemStatus, fetchDocs]);

  // Initial load and background polling to keep consensus up-to-date!
  useEffect(() => {
    syncConsensusMatrix();
    const pollInterval = setInterval(() => {
      syncConsensusMatrix();
    }, 4000); // Poll every 4 seconds to maintain precise live charts
    return () => clearInterval(pollInterval);
  }, [syncConsensusMatrix]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050608] text-[#10b981] font-mono p-4 space-y-4">
        <div className="cyber-noise" />
        <div className="scanline" />
        <Cpu className="w-12 h-12 animate-spin text-[#34d399]" />
        <p className="text-sm tracking-widest text-white text-glitch uppercase">
          INITIALIZING SECURE Handshake TUNNEL...
        </p>
        <p className="text-[10px] text-emerald-600/70">Node height query: establishing consensus</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050608] text-[#cbd5e1] crt-screen p-3 md:p-6 pb-12 flex flex-col justify-between">
      {/* Visual Glitch effects overlay */}
      <div className="cyber-noise" />
      <div className="scanline" />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto w-full space-y-6">
        {/* Heads Up Display Header */}
        <header className="border-b border-white/5 pb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="inline-block w-2.5 h-2.5 bg-[#10b981] animate-ping rounded-full" />
              <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-widest font-mono text-glitch flex items-center gap-2">
                NEO-VOTE LEDGER <span className="text-[#34d399] text-sm md:text-base border border-[#10b981]/30 px-1.5 py-0.5 rounded font-mono font-bold bg-[#10b981]/5">V0.2</span>
              </h1>
            </div>
            <p className="text-[10px] text-emerald-500/70 font-mono tracking-wider uppercase">
              Decentralized Peer-to-Peer Cryptographic Balloting Node
            </p>
          </div>

          {/* System status details ticker */}
          <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono text-slate-400">
            <div className="flex items-center gap-1.5 border border-[#10b981]/20 px-2.5 py-1 rounded bg-[#10b981]/5">
              <Clock className="w-3.5 h-3.5 text-[#10b981]" />
              <span className="text-[#34d399] font-bold">{currentTime}</span>
            </div>

            <div className="flex items-center gap-1.5 border border-white/5 px-2.5 py-1 rounded bg-[#0b0e14]">
              <Database className="w-3.5 h-3.5 text-emerald-500" />
              <span>CHAIN HEIGHT: <span className="text-white font-bold">{blockchain.length} Blocks</span></span>
            </div>

            <div className="flex items-center gap-1.5 border border-[#10b981]/10 px-2.5 py-1 rounded bg-[#0b0e14] text-[#10b981]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="font-semibold">STATUS: ONLINE</span>
            </div>
          </div>
        </header>

        {loadError && (
          <div className="p-3 border border-dashed border-red-500/30 bg-red-950/20 text-red-400 font-mono text-xs flex items-center gap-2 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-500" /> {loadError}
          </div>
        )}

        {/* Tab Controllers Navigation */}
        <nav className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
          <button
            id="tab-dashboard"
            onClick={() => setActiveTab("dashboard")}
            className={`py-3 px-1 text-center font-bold font-mono text-xs tracking-wider transition-all border rounded-lg cursor-pointer ${
              activeTab === "dashboard"
                ? "bg-[#10b981] text-[#050608] border-[#10b981] shadow-lg shadow-[#10b981]/20"
                : "border-white/5 bg-[#0b0e14] text-slate-400 hover:text-[#10b981] hover:border-emerald-500/30"
            }`}
          >
            <div className="flex items-center justify-center gap-1.5 uppercase">
              <Award className="w-3.5 h-3.5" /> RESULTS BOARD
            </div>
          </button>

          <button
            id="tab-voter"
            onClick={() => setActiveTab("voter")}
            className={`py-3 px-1 text-center font-bold font-mono text-xs tracking-wider transition-all border rounded-lg cursor-pointer ${
              activeTab === "voter"
                ? "bg-[#10b981] text-[#050608] border-[#10b981] shadow-lg shadow-[#10b981]/20"
                : "border-white/5 bg-[#0b0e14] text-slate-400 hover:text-[#10b981] hover:border-emerald-500/30"
            }`}
          >
            <div className="flex items-center justify-center gap-1.5 uppercase">
              <Shield className="w-3.5 h-3.5" /> Voter Portal
            </div>
          </button>

          <button
            id="tab-blockchain"
            onClick={() => setActiveTab("blockchain")}
            className={`py-3 px-1 text-center font-bold font-mono text-xs tracking-wider transition-all border rounded-lg cursor-pointer ${
              activeTab === "blockchain"
                ? "bg-[#10b981] text-[#050608] border-[#10b981] shadow-lg shadow-[#10b981]/20"
                : "border-white/5 bg-[#0b0e14] text-slate-400 hover:text-[#10b981] hover:border-emerald-500/30"
            }`}
          >
            <div className="flex items-center justify-center gap-1.5 uppercase">
              <Database className="w-3.5 h-3.5" /> Blockchain Ledger
            </div>
          </button>

          <button
            id="tab-admin"
            onClick={() => setActiveTab("admin")}
            className={`py-3 px-1 text-center font-bold font-mono text-xs tracking-wider transition-all border rounded-lg cursor-pointer ${
              activeTab === "admin"
                ? "bg-[#10b981] text-[#050608] border-[#10b981] shadow-lg shadow-[#10b981]/20"
                : "border-white/5 bg-[#0b0e14] text-slate-400 hover:text-[#10b981] hover:border-emerald-500/30"
            }`}
          >
            <div className="flex items-center justify-center gap-1.5 uppercase">
              <Terminal className="w-3.5 h-3.5" /> ADMIN STATION
            </div>
          </button>

          <button
            id="tab-docs"
            onClick={() => setActiveTab("docs")}
            className={`py-3 px-1 text-center font-bold font-mono text-xs tracking-wider transition-all border rounded-lg col-span-2 md:col-span-1 cursor-pointer ${
              activeTab === "docs"
                ? "bg-white text-black border-white shadow-lg"
                : "border-white/5 bg-[#0b0e14] text-slate-400 hover:text-white hover:border-white/40"
            }`}
          >
            <div className="flex items-center justify-center gap-1.5 uppercase">
              <BookOpen className="w-3.5 h-3.5" /> DOCS & REPORT
            </div>
          </button>
        </nav>

        {/* Dashboard Active View Panels */}
        <main className="min-h-[450px]">
          {activeTab === "dashboard" && (
            <ResultsDashboard candidates={candidates} blockchain={blockchain} />
          )}

          {activeTab === "voter" && (
            <VoterPortal
              candidates={candidates}
              blockchain={blockchain}
              onVoteCast={syncConsensusMatrix}
            />
          )}

          {activeTab === "blockchain" && (
            <BlockchainVisualizer
              blockchain={blockchain}
              candidates={candidates}
              onRefresh={syncConsensusMatrix}
            />
          )}

          {activeTab === "admin" && (
            <AdminPanel
              voters={voters}
              candidates={candidates}
              systemStatus={systemStatus}
              onRefresh={syncConsensusMatrix}
            />
          )}

          {activeTab === "docs" && <DocsReport docContent={docContent} />}
        </main>
      </div>

      {/* Retro Sci-fi Footer Indicators */}
      <footer className="max-w-7xl mx-auto w-full mt-12 border-t border-white/5 pt-4 flex flex-col md:flex-row justify-between items-center text-[9px] font-mono text-slate-500 gap-2">
        <span>© 2026 NEO-VOTE SECURITY CORES. ALL INTELLECTUAL MATRIX RESERVED.</span>
        <span className="flex items-center gap-1 text-[#10b981] animate-pulse">
          <Terminal className="w-3 h-3" /> SECURE AUDIT PROTOCOL: ACTIVE (SHA-256)
        </span>
      </footer>
    </div>
  );
}
