import React, { useState } from "react";
import { UserPlus, PlusCircle, AlertOctagon, Users, ShieldAlert, Cpu, Layers, RefreshCw } from "lucide-react";
import { Voter, Candidate, SystemStatus } from "../types";

interface AdminPanelProps {
  voters: Voter[];
  candidates: Candidate[];
  systemStatus: SystemStatus | null;
  onRefresh: () => void;
}

export default function AdminPanel({ voters, candidates, systemStatus, onRefresh }: AdminPanelProps) {
  // New Voter state
  const [voterName, setVoterName] = useState("");
  const [voterSector, setVoterSector] = useState("SECTOR-09 (CORE)");
  const [isRegisteringVoter, setIsRegisteringVoter] = useState(false);
  const [newVoterResult, setNewVoterResult] = useState<Voter | null>(null);

  // New Candidate state
  const [candName, setCandName] = useState("");
  const [candParty, setCandParty] = useState("");
  const [candBio, setCandBio] = useState("");
  const [candManifesto, setCandManifesto] = useState("");
  const [isRegisteringCandidate, setIsRegisteringCandidate] = useState(false);
  const [candResult, setCandResult] = useState<string | null>(null);

  // Reset state
  const [isResetting, setIsResetting] = useState(false);

  const handleRegisterVoter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voterName) return;
    setIsRegisteringVoter(true);
    setNewVoterResult(null);

    try {
      const res = await fetch("/api/voters/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: voterName, division: voterSector }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewVoterResult(data.voter);
        setVoterName("");
        onRefresh();
      } else {
        alert(data.error || "Failed to register voter.");
      }
    } catch (err) {
      alert("Network exception registering voter.");
    } finally {
      setIsRegisteringVoter(false);
    }
  };

  const handleRegisterCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candName || !candParty) return;
    setIsRegisteringCandidate(true);
    setCandResult(null);

    try {
      const res = await fetch("/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: candName,
          party: candParty,
          bio: candBio,
          manifesto: candManifesto,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCandResult(`Candidate registered as ID: [${data.candidate.candidateId}]`);
        setCandName("");
        setCandParty("");
        setCandBio("");
        setCandManifesto("");
        onRefresh();
      } else {
        setCandResult(`[ERROR] ${data.error}`);
      }
    } catch (err) {
      setCandResult("[FATAL] Network error compiling registration.");
    } finally {
      setIsRegisteringCandidate(false);
    }
  };

  const handleMasterReset = async () => {
    if (!window.confirm("CRITICAL INTERVENTION: This will purge ALL voter rosters and rewrite the blockchain ledger back to Genesis Block #0. Proceed?")) {
      return;
    }
    setIsResetting(true);
    try {
      const res = await fetch("/api/admin/reset", { method: "POST" });
      const data = await res.json();
      alert(data.message || "Ledger initialized back to genesis.");
      setNewVoterResult(null);
      setCandResult(null);
      onRefresh();
    } catch (err) {
      alert("Reset call failed.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Telemetry Stats Rows */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="cyber-panel p-4 bg-[#0b0e14] flex flex-col justify-between">
          <span className="text-[9px] text-[#10b981] font-mono tracking-widest uppercase">LEDGER STATE</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold font-mono text-white">
              {systemStatus?.ledgerHeight ?? "..."}
            </span>
            <span className="text-xs text-slate-400 font-mono">Blocks</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[8px] text-green-400 font-mono">
            <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
            SYNCHRONIZED CONSENSUS
          </div>
        </div>

        <div className="cyber-panel p-4 bg-[#0b0e14] flex flex-col justify-between">
          <span className="text-[9px] text-[#10b981] font-mono tracking-widest uppercase">ACTIVE NODES</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold font-mono text-white">
              {systemStatus?.voterCount ?? "..."}
            </span>
            <span className="text-xs text-slate-400 font-mono">Peers</span>
          </div>
          <div className="text-[8px] text-slate-500 font-mono mt-2 uppercase">
            VOTER INDEX RECORD SIZE
          </div>
        </div>

        <div className="cyber-panel p-4 bg-[#0b0e14] flex flex-col justify-between">
          <span className="text-[9px] text-[#10b981] font-mono tracking-widest uppercase">MINING STRENGTH</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold font-mono text-white">
              {systemStatus?.hashrateEst ?? "..."}
            </span>
            <span className="text-xs text-slate-400 font-mono">Hashrate</span>
          </div>
          <div className="text-[8px] text-slate-400 font-mono mt-2">
            DIFFICULTY: {systemStatus?.difficulty ?? "..."} (Hex Zeros)
          </div>
        </div>

        <div className="cyber-panel-magenta p-4 bg-[#0b0e14] flex flex-col justify-between">
          <span className="text-[9px] text-[#34d399] font-mono tracking-widest uppercase">PROTOCOL MODEL</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-xl font-bold font-mono text-white truncate max-w-full">
              SHA-256 v1.0
            </span>
          </div>
          <div className="text-[8px] text-slate-500 font-mono mt-2">
            STRICT CRYPTO SHIELD
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Forms */}
        <div className="lg:col-span-7 space-y-6">
          {/* Register Voters Card */}
          <div className="cyber-panel p-5 bg-[#0b0e14] space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <UserPlus className="w-4 h-4 text-[#10b981]" />
              <h3 className="text-xs font-bold text-white tracking-widest font-mono uppercase">
                ALLOCATE NEW SECURE VOTER CERTIFICATE
              </h3>
            </div>

            <form onSubmit={handleRegisterVoter} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] text-slate-400 font-mono">LEGAL CITIZEN FULL NAME</label>
                  <input
                    type="text"
                    required
                    placeholder="E.G. CHRIS MILLER"
                    value={voterName}
                    onChange={(e) => setVoterName(e.target.value)}
                    className="cyber-input text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] text-slate-400 font-mono">REGISTRY DIVISION SECTOR</label>
                  <select
                    value={voterSector}
                    onChange={(e) => setVoterSector(e.target.value)}
                    className="cyber-input text-xs"
                  >
                    <option value="SECTOR-09 (CORE)" className="bg-[#0b0e14] text-white">SECTOR-09 (CORE)</option>
                    <option value="SECTOR-12 (OUTER)" className="bg-[#0b0e14] text-white">SECTOR-12 (OUTER)</option>
                    <option value="SECTOR-05 (ORBITAL)" className="bg-[#0b0e14] text-white">SECTOR-05 (ORBITAL)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isRegisteringVoter}
                className="w-full cyber-button text-xs py-2.5 flex items-center justify-center gap-1.5"
              >
                {isRegisteringVoter ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> GENERATING KEYPAIR...
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-3.5 h-3.5" /> EMIT SYSTEM CREDENTIAL MATRIX
                  </>
                )}
              </button>
            </form>

            {/* Generated Voter Keypair Output */}
            {newVoterResult && (
              <div className="border border-dashed border-[#10b981]/30 p-3.5 bg-[#080a0f] font-mono text-xs space-y-2 relative overflow-hidden rounded-lg">
                <div className="absolute top-0 right-0 bg-[#10b981] text-[#050608] px-1.5 py-0.5 text-[8px] font-bold rounded-bl">
                  ACTIVE_CRED
                </div>
                <h4 className="text-[10px] font-bold text-[#10b981] tracking-widest">
                  SECURE METADATA CREDENTIAL ENVELOPE:
                </h4>
                <div className="space-y-1 text-xs">
                  <p className="text-slate-400">
                    NAME: <span className="text-white">{newVoterResult.name}</span>
                  </p>
                  <p className="text-slate-400 flex items-center gap-1.5">
                    VOTER ID: <span className="text-white font-bold bg-[#0b0e14] px-1 py-0.5 border border-white/5 select-all rounded">{newVoterResult.voterId}</span>
                  </p>
                  <p className="text-slate-400 flex items-center gap-1.5">
                    SECURITY PASSCODE: <span className="text-[#34d399] font-bold bg-[#0b0e14] px-1 py-0.5 border border-white/5 select-all rounded">{newVoterResult.passcode}</span>
                  </p>
                  <p className="text-[10px] text-amber-500 italic">
                    * NOTE: Use these credentials inside the VOTER PORTAL tab to sign the ledger.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Add Candidate Form */}
          <div className="cyber-panel-magenta p-5 bg-[#0b0e14] space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <Layers className="w-4 h-4 text-[#34d399]" />
              <h3 className="text-xs font-bold text-white tracking-widest font-mono uppercase">
                REGISTER GOVERNMENTAL CANDIDATE ENTITY
              </h3>
            </div>

            <form onSubmit={handleRegisterCandidate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] text-slate-400 font-mono">CANDIDATE / MACHINE PROTOCOL NAME</label>
                  <input
                    type="text"
                    required
                    placeholder="E.G. SYNTHETIC VOX-9"
                    value={candName}
                    onChange={(e) => setCandName(e.target.value)}
                    className="cyber-input text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] text-slate-400 font-mono">PARTY / FACTION ALIGNMENT</label>
                  <input
                    type="text"
                    required
                    placeholder="E.G. TRANS-QUANTUM DIVISION"
                    value={candParty}
                    onChange={(e) => setCandParty(e.target.value)}
                    className="cyber-input text-xs"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-slate-400 font-mono">ENTITY SUMMARY BIOGRAPHY</label>
                <textarea
                  placeholder="Primary executive computational profile, neural mesh allocation details..."
                  rows={2}
                  value={candBio}
                  onChange={(e) => setCandBio(e.target.value)}
                  className="cyber-input text-xs"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-slate-400 font-mono">GOVERNANCE MANIFESTO DECLARATION</label>
                <textarea
                  placeholder="Automate local resource distribution grids, reduce carbon heat output by 12%..."
                  rows={2}
                  value={candManifesto}
                  onChange={(e) => setCandManifesto(e.target.value)}
                  className="cyber-input text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isRegisteringCandidate}
                className="w-full cyber-button cyber-button-magenta text-xs py-2.5 flex items-center justify-center gap-1.5"
              >
                {isRegisteringCandidate ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> WRITING CORE REGISTRY...
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-3.5 h-3.5" /> AUTHORIZE FACTION ON MATRIX
                  </>
                )}
              </button>
            </form>

            {candResult && (
              <div className="border border-dashed border-[#10b981]/30 p-3 bg-[#080a0f] text-[#34d399] font-mono text-xs rounded-lg">
                {candResult}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Voter database view */}
        <div className="lg:col-span-5 space-y-6">
          <div className="cyber-panel p-5 bg-[#0b0e14] flex flex-col h-[525px]">
            <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#10b981]" />
                <h3 className="text-xs font-bold text-white tracking-widest font-mono uppercase">
                  VOTER DATABASE HANDSHAKE INDEX
                </h3>
              </div>
              <span className="text-[9px] text-[#10b981] font-mono font-bold bg-[#080a0f] border border-[#10b981]/20 px-2 py-0.5 rounded">
                {voters.length} ENTRIES
              </span>
            </div>

            <p className="text-[9px] text-slate-500 font-mono mb-3 leading-tight">
              * DEMO METRIC: In a live system, passcodes are obscured. For Capstone testing fluid mechanics, use these credentials to vote.
            </p>

            <div className="flex-grow overflow-y-auto space-y-2 pr-1.5">
              {voters.map((voter) => (
                <div
                  key={voter.voterId}
                  className="p-2.5 bg-[#080a0f] border border-white/5 rounded-lg flex items-center justify-between text-xs font-mono transition-colors hover:border-[#10b981]/30"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-white font-bold">{voter.name}</span>
                      <span className="text-[9px] text-[#10b981]">{voter.division}</span>
                    </div>
                    <div className="text-[10px] space-x-2 text-slate-400">
                      <span>
                        ID: <span className="text-[#10b981] font-bold select-all bg-[#0b0e14] px-1 py-0.5 border border-white/5 rounded">{voter.voterId}</span>
                      </span>
                      <span>
                        PASS: <span className="text-[#34d399] font-bold select-all bg-[#0b0e14] px-1 py-0.5 border border-white/5 rounded">{voter.passcode}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex-shrink-0 ml-2">
                    {voter.hasVoted ? (
                      <span className="text-[9px] font-bold bg-green-950/40 text-green-400 border border-green-800/30 px-1.5 py-0.5 rounded uppercase tracking-widest">
                        voted
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold bg-slate-900/40 text-slate-500 border border-slate-800/30 px-1.5 py-0.5 rounded uppercase tracking-widest">
                        unspent
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Danger Zone */}
            <div className="border-t border-white/5 pt-4 mt-4 space-y-2">
              <div className="flex items-center gap-1.5 text-red-400">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                <span className="text-[10px] font-bold font-mono tracking-widest uppercase">SUPERVISOR OVERRIDE PANEL</span>
              </div>
              <button
                onClick={handleMasterReset}
                disabled={isResetting}
                className="w-full text-center py-2.5 border border-red-500/30 bg-red-950/20 text-red-400 text-xs font-mono font-bold tracking-widest hover:bg-red-500 hover:text-[#050608] transition-colors flex items-center justify-center gap-2 rounded-lg cursor-pointer"
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> ERASED DECENTRALIZED DATA...
                  </>
                ) : (
                  <>
                    <AlertOctagon className="w-4 h-4" /> MASTER FACTORY LEDGER RESET
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
