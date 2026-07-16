import React, { useState } from "react";
import { Link2, ShieldAlert, CheckCircle2, AlertTriangle, Play, RefreshCw, Terminal } from "lucide-react";
import { Block, Candidate } from "../types";

interface BlockchainVisualizerProps {
  blockchain: Block[];
  candidates: Candidate[];
  onRefresh: () => void;
}

export default function BlockchainVisualizer({ blockchain, candidates, onRefresh }: BlockchainVisualizerProps) {
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [validateLogs, setValidateLogs] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; checked: boolean }>({
    isValid: true,
    checked: false,
  });

  // Tampering simulator states
  const [tamperIndex, setTamperIndex] = useState<number>(1);
  const [tamperCandidate, setTamperCandidate] = useState<string>("");
  const [tamperResult, setTamperResult] = useState<string | null>(null);
  const [isTampering, setIsTampering] = useState(false);

  const runChainAudit = async () => {
    setIsValidating(true);
    setValidateLogs(["[SYS] Fetching entire ledger ledger height...", "[SYS] INITIALIZING CRYPTOGRAPHIC CONSENSUS CHECK..."]);
    try {
      const res = await fetch("/api/blockchain/validate");
      const data = await res.json();
      
      // Artificial delay to make it feel like a heavy server cryptographic sweep
      setTimeout(() => {
        setValidateLogs(data.logs);
        setValidationResult({ isValid: data.isValid, checked: true });
        setIsValidating(false);
      }, 1200);
    } catch (err) {
      setValidateLogs((prev) => [...prev, "[FATAL] System handshake failed. Could not audit."]);
      setIsValidating(false);
    }
  };

  const handleSimulateTamper = async () => {
    if (!tamperCandidate) {
      alert("Please select a target candidate to forge.");
      return;
    }
    setIsTampering(true);
    setTamperResult(null);

    try {
      const res = await fetch("/api/admin/tamper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blockIndex: tamperIndex,
          newCandidateId: tamperCandidate,
        }),
      });

      const data = await res.json();
      setTimeout(() => {
        if (res.ok) {
          setTamperResult(data.message);
          onRefresh();
        } else {
          setTamperResult(`[ERROR] ${data.error}`);
        }
        setIsTampering(false);
      }, 1000);
    } catch (err) {
      setTamperResult("[FATAL] Network breach connection failed.");
      setIsTampering(false);
    }
  };

  const getCandidateName = (cid: string) => {
    if (cid === "NONE") return "N/A (GENESIS ANCHOR)";
    const candidate = candidates.find((c) => c.candidateId === cid);
    return candidate ? candidate.name : `UNKNOWN ID: [${cid}]`;
  };

  return (
    <div className="space-y-6">
      {/* Visual Header */}
      <div className="flex justify-between items-center border-b border-white/5 pb-3">
        <div>
          <h2 className="text-lg font-bold tracking-widest text-[#10b981] font-mono">
            CRYPTOGRAPHIC DECENTRALIZED LEDGER
          </h2>
          <p className="text-[10px] text-slate-400 font-mono">
            Immutable proof-of-work state chain. Difficulty: 0x{"0".repeat(blockchain[0]?.difficulty || 2)}
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="cyber-button text-xs flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> REFRESH LEDGER
        </button>
      </div>

      {/* Chain Visual Flow */}
      <div className="overflow-x-auto pb-4 bg-[#080a0f] p-4 border border-white/5 rounded-lg">
        <div className="flex items-stretch gap-4 min-w-[700px] py-2">
          {blockchain.map((block, idx) => {
            const isGenesis = block.index === 0;
            return (
              <React.Fragment key={block.index}>
                {idx > 0 && (
                  <div className="flex flex-col justify-center items-center px-1">
                    <Link2 className="w-4 h-4 text-[#10b981] animate-pulse" />
                    <span className="text-[8px] text-[#34d399] font-mono mt-1">PREV_HASH</span>
                  </div>
                )}
                <div
                  onClick={() => setSelectedBlock(block)}
                  className={`flex-shrink-0 w-60 border p-3 cursor-pointer transition-all duration-150 rounded-lg ${
                    selectedBlock?.index === block.index
                      ? "border-[#10b981] bg-[#10b981]/5 shadow-md shadow-[#10b981]/10"
                      : isGenesis
                      ? "border-emerald-500/30 bg-[#10b981]/5 hover:border-emerald-500/50"
                      : "border-white/5 bg-[#0b0e14] hover:border-[#10b981]/30"
                  }`}
                >
                  <div className="flex justify-between items-center border-b border-white/5 pb-1.5 mb-1.5">
                    <span className="text-xs font-bold text-white font-mono">
                      {isGenesis ? "GENESIS BLOCK" : `BLOCK #${block.index}`}
                    </span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#080a0f] text-[#34d399] font-mono font-bold">
                      NONCE: {block.nonce}
                    </span>
                  </div>

                  <div className="space-y-1 text-[9px] font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">HASH:</span>
                      <span className="text-white truncate max-w-[130px]">{block.hash}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">PREV_HASH:</span>
                      <span className="text-slate-400 truncate max-w-[130px]">
                        {block.previousHash.substring(0, 16)}...
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-white/5 pt-1 mt-1">
                      <span className="text-[#34d399] font-semibold">BALLOTS:</span>
                      <span className="text-white font-bold">{block.votes.length} Tx</span>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Selected Block Details */}
      {selectedBlock && (
        <div className="cyber-panel p-4 bg-[#0b0e14] border-l-4 border-l-[#10b981] space-y-3">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <h3 className="text-xs font-bold text-[#10b981] font-mono uppercase tracking-wider">
              BLOCK INFRASTRUCTURE PROFILER — INDEX: {selectedBlock.index}
            </h3>
            <button
              onClick={() => setSelectedBlock(null)}
              className="text-[9px] text-slate-500 hover:text-white font-mono uppercase cursor-pointer"
            >
              [CLOSE]
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="space-y-1.5">
              <p className="text-slate-400">
                Timestamp: <span className="text-white">{new Date(selectedBlock.timestamp).toLocaleString()}</span>
              </p>
              <p className="text-slate-400">
                PoW Difficulty: <span className="text-[#34d399] font-semibold">{selectedBlock.difficulty}</span>
              </p>
              <p className="text-slate-400">
                Cryptographic Signature: <span className="text-emerald-400 break-all font-semibold">{selectedBlock.hash}</span>
              </p>
              <p className="text-slate-400">
                Parent Block Reference: <span className="text-amber-500 break-all font-semibold">{selectedBlock.previousHash}</span>
              </p>
            </div>

            <div className="space-y-2 bg-[#080a0f] p-3 border border-white/5 rounded-lg">
              <h4 className="text-[10px] text-slate-400 border-b border-white/5 pb-1 font-bold">
                ENCRYPTED TRANSACTIONS LEDGER:
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {selectedBlock.votes.map((vote, idx) => (
                  <div key={idx} className="space-y-0.5 border-b border-white/5 pb-1.5 last:border-0 text-[10px]">
                    <p className="text-slate-500">
                      Voter Signature Hash: <span className="text-slate-300 break-all">{vote.voterIdHash}</span>
                    </p>
                    <p className="text-slate-400">
                      Voted Candidate ID:{" "}
                      <span className="text-[#10b981] font-bold">
                        {vote.candidateId} — {getCandidateName(vote.candidateId)}
                      </span>
                    </p>
                    <p className="text-slate-500">
                      Timestamp: <span className="text-slate-400">{new Date(vote.timestamp).toLocaleTimeString()}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cryptographic Ledger Audit Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 cyber-panel p-4 bg-[#0b0e14] flex flex-col h-[340px]">
          <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#10b981]" />
              <h3 className="text-xs font-bold text-white tracking-widest font-mono">
                P2P CONSENSUS SWEEP TERMINAL
              </h3>
            </div>
            {validationResult.checked && (
              <span
                className={`text-[9px] px-2 py-0.5 font-bold font-mono rounded ${
                  validationResult.isValid
                    ? "bg-green-950/40 text-green-400 border border-green-800/30"
                    : "bg-red-950/40 text-red-400 border border-red-800/30"
                }`}
              >
                {validationResult.isValid ? "LEDGER VALIDATED" : "BREACH DETECTED"}
              </span>
            )}
          </div>

          <div className="flex-grow bg-[#050608] border border-white/5 p-3 font-mono text-[10px] text-emerald-400 overflow-y-auto space-y-1.5 h-44 rounded-lg">
            {validateLogs.length === 0 ? (
              <p className="text-slate-500 italic">Console idle. Awaiting instruction request...</p>
            ) : (
              validateLogs.map((log, index) => {
                let colorClass = "text-emerald-500";
                if (log.includes("[FAIL]")) colorClass = "text-red-500 font-bold";
                if (log.includes("[WARNING]")) colorClass = "text-amber-500 font-bold animate-pulse";
                if (log.includes("[SUCCESS]")) colorClass = "text-green-400 font-bold";
                if (log.includes("[LOG]")) colorClass = "text-teal-400";
                return (
                  <p key={index} className={`${colorClass} break-all`}>
                    {log}
                  </p>
                );
              })
            )}
          </div>

          <div className="mt-3">
            <button
              onClick={runChainAudit}
              disabled={isValidating}
              className="w-full cyber-button text-xs flex items-center justify-center gap-2 py-2"
            >
              {isValidating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#10b981]" /> COMPUTING SHA-256 SWEEPS...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 text-[#10b981]" /> RUN CRYPTOGRAPHIC INTEGRITY AUDIT
                </>
              )}
            </button>
          </div>
        </div>

        {/* Simulated Intrusion Simulator */}
        <div className="lg:col-span-5 cyber-panel-magenta p-4 bg-[#0b0e14] space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-white/5 pb-2 mb-3">
              <ShieldAlert className="w-4 h-4 text-[#34d399]" />
              <h3 className="text-xs font-bold text-white tracking-widest font-mono">
                MALICIOUS LEDGER TAMPER SIMULATOR
              </h3>
            </div>
            <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
              To test the security limits of the voting network, simulate a database compromise. Choose a block index, replace its vote with a forged candidate, and attempt an exploit.
            </p>

            <div className="space-y-3 mt-4">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-[#34d399] font-mono uppercase font-semibold">Target Block Index</label>
                <select
                  value={tamperIndex}
                  onChange={(e) => setTamperIndex(Number(e.target.value))}
                  className="cyber-input text-xs"
                >
                  {blockchain.map((b) => (
                    <option key={b.index} value={b.index} disabled={b.index === 0} className="bg-[#0b0e14] text-white">
                      {b.index === 0 ? "Block #0 (Genesis - Locked)" : `Block #${b.index}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-[#34d399] font-mono uppercase font-semibold">Forge Candidate Vote To</label>
                <select
                  value={tamperCandidate}
                  onChange={(e) => setTamperCandidate(e.target.value)}
                  className="cyber-input text-xs text-white"
                >
                  <option value="" className="bg-[#0b0e14] text-white">-- SELECT TARGET FORGERY --</option>
                  {candidates.map((c) => (
                    <option key={c.candidateId} value={c.candidateId} className="bg-[#0b0e14] text-white">
                      {c.name} ({c.party})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-2 mt-4 lg:mt-0">
            {tamperResult && (
              <div className="p-2 border border-[#10b981]/30 bg-red-950/20 text-red-400 font-mono text-[9px] leading-tight rounded">
                {tamperResult}
              </div>
            )}

            <button
              onClick={handleSimulateTamper}
              disabled={isTampering}
              className="w-full cyber-button cyber-button-magenta text-xs flex items-center justify-center gap-1.5"
            >
              {isTampering ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> INJECTING EXPLOIT...
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" /> FORCE Sim Tamper Block
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
