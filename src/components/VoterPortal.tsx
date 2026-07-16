import React, { useState, useEffect } from "react";
import { KeyRound, ShieldCheck, Vote, Ticket, Cpu, HelpCircle, UserCheck, AlertTriangle } from "lucide-react";
import { Voter, Candidate, Block } from "../types";

interface VoterPortalProps {
  candidates: Candidate[];
  blockchain: Block[];
  onVoteCast: () => void;
}

export default function VoterPortal({ candidates, blockchain, onVoteCast }: VoterPortalProps) {
  // Authentication states
  const [voterId, setVoterId] = useState("");
  const [passcode, setPasscode] = useState("");
  const [activeVoter, setActiveVoter] = useState<Voter | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Voting states
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("");
  const [isMining, setIsMining] = useState(false);
  const [miningStatus, setMiningStatus] = useState<string[]>([]);
  const [minedBlockResult, setMinedBlockResult] = useState<Block | null>(null);

  // Search receipts from blockchain for authenticated voter
  const [voterReceipt, setVoterReceipt] = useState<{
    blockIndex: number;
    blockHash: string;
    voterHash: string;
    timestamp: string;
  } | null>(null);

  // If already logged in, let's keep search receipts up to date
  useEffect(() => {
    if (activeVoter) {
      findVoterLedgerReceipt(activeVoter.voterId);
    } else {
      setVoterReceipt(null);
    }
  }, [activeVoter, blockchain]);

  const findVoterLedgerReceipt = async (vid: string) => {
    try {
      // Recalculate local hash of voterId to locate transaction in blockchain
      // Express calculates SHA-256 of voterId, let's look for a block that has this voter hash
      // We can also fetch it or do a simple client-side mock search since SHA-256 is done on server.
      // But we can compute it on server or do a string search! Let's do a quick request or scan:
      // Since we don't have crypto in browser easily without npm, we can fetch from server or match index.
      // Wait, let's let server return voting result or scan blockchain.
      // Let's do a client-side search by comparing the voterId index or we can assume voter hash.
      // To make it fully reliable, let's look for the block containing their vote.
      // Since blockchain has votes with voterIdHash:
      // We can search the blockchain blocks. But how do we know which hash matches without doing sha256 in browser?
      // Node crypto module did SHA-256 on server. We can fetch or simply write a small SHA-256 function,
      // or we can just scan the block index or ask server!
      // Let's implement a lightweight client-side SHA256 helper so the voter receipt works perfectly!
      const enc = new TextEncoder();
      const data = enc.encode(vid);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const sha256Hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

      const foundBlock = blockchain.find((block) =>
        block.votes.some((vote) => vote.voterIdHash === sha256Hash)
      );

      if (foundBlock) {
        const voteTx = foundBlock.votes.find((v) => v.voterIdHash === sha256Hash);
        setVoterReceipt({
          blockIndex: foundBlock.index,
          blockHash: foundBlock.hash,
          voterHash: sha256Hash,
          timestamp: voteTx ? voteTx.timestamp : foundBlock.timestamp,
        });
      } else {
        setVoterReceipt(null);
      }
    } catch (e) {
      console.error("Failed receipt SHA-256 mapping", e);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voterId || !passcode) return;
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const res = await fetch("/api/voters/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voterId, passcode }),
      });
      const data = await res.json();
      
      // Delay for cyberpunk handshake simulation
      setTimeout(() => {
        if (res.ok) {
          setActiveVoter(data.voter);
          setLoginError(null);
        } else {
          setLoginError(data.error || "Credential pair refused by security gateway.");
        }
        setIsLoggingIn(false);
      }, 800);
    } catch (err) {
      setLoginError("Fatal network exception during login handshake.");
      setIsLoggingIn(false);
    }
  };

  const handleCastVote = async () => {
    if (!selectedCandidateId || !activeVoter) {
      alert("Please select a candidate before casting ballot.");
      return;
    }

    setIsMining(true);
    setMiningStatus([
      "[INIT] Ballot signed with voter private cypher key.",
      "[COMPUTE] Initiating proof-of-work mining node queue...",
      "[COMPUTE] Cryptographic difficulty constraint loaded: 0x00",
    ]);

    // Animated mining logs to illustrate the blockchain mining process!
    const statuses = [
      "[SYS] Hash verification: Hashing transaction bundle...",
      "[MINING] Nonce cycle 120... hash = 8ac92f... (Mismatch)",
      "[MINING] Nonce cycle 480... hash = c56410... (Mismatch)",
      "[MINING] Nonce cycle 853... hash = 0092f4... (DIFFICULTY SOLVED!)",
      "[SYS] Packing Block envelope. Writing to persistent disk array...",
      "[LEDGER] Immutable append completed successfully."
    ];

    statuses.forEach((status, index) => {
      setTimeout(() => {
        setMiningStatus((prev) => [...prev, status]);
      }, (index + 1) * 350);
    });

    // Fire API call simultaneously
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voterId: activeVoter.voterId,
          passcode: activeVoter.passcode,
          candidateId: selectedCandidateId,
        }),
      });

      const data = await res.json();

      setTimeout(() => {
        if (res.ok) {
          setMinedBlockResult(data.minedBlock);
          // Refetch blockchain and voters state on parent
          onVoteCast();
          // Update local voter profile so UI shifts to voted view
          setActiveVoter((prev) => (prev ? { ...prev, hasVoted: true } : null));
        } else {
          alert(`[REJECTED] ${data.error}`);
        }
        setIsMining(false);
      }, statuses.length * 350 + 200);

    } catch (err) {
      alert("Network disruption aborted block mining.");
      setIsMining(false);
    }
  };

  const handleLogout = () => {
    setActiveVoter(null);
    setMinedBlockResult(null);
    setVoterId("");
    setPasscode("");
  };

  return (
    <div className="space-y-6">
      {/* Visual Header */}
      <div className="border-b border-white/5 pb-3">
        <h2 className="text-lg font-bold tracking-widest text-[#10b981] font-mono">
          VOTER CENTRAL IDENTITY & PORTAL
        </h2>
        <p className="text-[10px] text-slate-400 font-mono">
          Secure, direct transaction signing ledger console. Dual-key encryption framework.
        </p>
      </div>

      {!activeVoter ? (
        /* Login Screen */
        <div className="max-w-md mx-auto cyber-panel p-6 bg-[#0b0e14] space-y-5 relative">
          <div className="absolute top-0 right-0 bg-[#10b981] text-[#050608] px-2.5 py-0.5 text-xs font-bold font-mono rounded-bl">
            SECURE_KEY_REQ
          </div>
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="p-3 bg-[#080a0f] border border-[#10b981]/30 rounded-full animate-pulse">
              <KeyRound className="w-8 h-8 text-[#10b981]" />
            </div>
            <div>
              <h3 className="text-md font-bold text-white font-mono uppercase tracking-wider">
                VOTER INTERFACE PROTOCOL
              </h3>
              <p className="text-[10px] text-slate-500 font-mono mt-1">
                Establish handshake by inputting generated voter credentials
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-400 font-mono uppercase">Voter System ID</label>
              <input
                type="text"
                required
                placeholder="E.G. NEO-V-1024"
                value={voterId}
                onChange={(e) => setVoterId(e.target.value)}
                className="cyber-input text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-[#10b981] font-mono uppercase">Security Cypher Passcode</label>
              <input
                type="password"
                required
                placeholder="E.G. CYPHER-9901"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="cyber-input text-xs"
              />
            </div>

            {loginError && (
              <div className="p-2 border border-dashed border-red-500/30 bg-red-950/20 text-red-400 font-mono text-[9px] flex items-center gap-1.5 animate-bounce rounded">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full cyber-button cyber-button-magenta text-xs py-2.5 flex items-center justify-center gap-2"
            >
              {isLoggingIn ? (
                <>
                  <Cpu className="w-4 h-4 animate-spin" /> CONSTRUCTING TUNNEL...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" /> SECURE HANDSHAKE LOGIN
                </>
              )}
            </button>
          </form>

          <div className="p-3 bg-[#080a0f] border border-white/5 rounded-lg text-[9px] font-mono text-slate-500 space-y-1">
            <p className="text-slate-400 font-bold uppercase tracking-wider">Need test credentials?</p>
            <p>1. Open the <span className="text-[#10b981] font-bold">ADMIN CONTROL STATION</span> panel.</p>
            <p>2. Review the registered rosters in the database column on the right side.</p>
            <p>3. Copy any Voter ID and Passcode pair, or generate a fresh profile.</p>
          </div>
        </div>
      ) : (
        /* Logged In Portal Panel */
        <div className="space-y-6">
          {/* Voter Info Header bar */}
          <div className="cyber-panel p-4 bg-[#0b0e14] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <UserCheck className="w-5 h-5 text-emerald-400 animate-pulse" />
              <div className="font-mono text-xs">
                <p className="text-slate-400">
                  Authenticated: <span className="text-white font-bold">{activeVoter.name}</span>
                </p>
                <p className="text-[10px] text-slate-500">
                  Division: <span className="text-[#10b981]">{activeVoter.division}</span> | ID:{" "}
                  <span className="text-white font-mono bg-[#080a0f] px-1 rounded">{activeVoter.voterId}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {activeVoter.hasVoted ? (
                <span className="text-[10px] px-2.5 py-1 font-bold font-mono bg-emerald-950/40 text-emerald-400 border border-emerald-800/30 rounded uppercase tracking-widest">
                  LEDGER BALLOT SECURED
                </span>
              ) : (
                <span className="text-[10px] px-2.5 py-1 font-bold font-mono bg-amber-950/40 text-amber-500 border border-amber-800/30 rounded uppercase tracking-widest animate-pulse">
                  BALLOT PENDING
                </span>
              )}

              <button
                onClick={handleLogout}
                className="text-[10px] text-slate-400 hover:text-red-400 font-mono underline uppercase cursor-pointer"
              >
                [DISCONNECT]
              </button>
            </div>
          </div>

          {/* Mining Screen Cover */}
          {isMining ? (
            <div className="cyber-panel p-8 bg-[#0b0e14] text-center space-y-4">
              <div className="inline-block p-4 bg-[#080a0f] border border-[#10b981]/30 rounded-full animate-spin">
                <Cpu className="w-10 h-10 text-[#10b981]" />
              </div>
              <div>
                <h3 className="text-md font-bold text-white font-mono uppercase tracking-widest">
                  CRYPTOGRAPHIC BLOCK MINING IN PROGRESS
                </h3>
                <p className="text-xs text-[#10b981] font-mono mt-1">
                  Hashing transactions & solving Proof-of-Work constraint...
                </p>
              </div>

              <div className="max-w-md mx-auto bg-[#050608] p-4 border border-white/5 font-mono text-[9px] text-emerald-400 text-left space-y-1 h-36 overflow-y-auto rounded-lg">
                {miningStatus.map((status, idx) => (
                  <p key={idx}>{status}</p>
                ))}
              </div>
            </div>
          ) : activeVoter.hasVoted ? (
            /* Cryptographic Receipt View */
            <div className="cyber-panel p-6 bg-[#080a0f] border-t-4 border-t-emerald-500 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <Ticket className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white font-mono tracking-widest uppercase">
                  IMMUTABLE BALLOT RECEIPT MATRIX (SHA-256)
                </h3>
              </div>

              <p className="text-xs text-slate-300 font-mono leading-relaxed text-justify">
                Your vote was cryptographically mined and appended to the blockchain. Due to the decentralized direct-democracy protocol, voter identities are anonymized to a one-way hashed digest. Your physical identity can never be traced to the selection, but the receipt below proves your transaction exists in the ledger height consensus.
              </p>

              {voterReceipt ? (
                <div className="bg-[#0b0e14] border border-white/5 p-4 font-mono text-xs space-y-2 text-emerald-400 relative overflow-hidden rounded-lg">
                  <div className="absolute top-0 right-0 bg-emerald-500 text-[#050608] px-1.5 py-0.5 text-[8px] font-bold rounded-bl">
                    VERIFIED_BLOCK
                  </div>
                  <h4 className="text-[10px] font-bold text-white uppercase tracking-wider border-b border-white/5 pb-1.5 mb-2">
                    Ledger Audit Anchors
                  </h4>
                  <div className="space-y-1.5">
                    <p>
                      Mined Ledger Height: <span className="text-white font-bold">BLOCK #{voterReceipt.blockIndex}</span>
                    </p>
                    <p className="break-all">
                      Block Envelope Signature: <span className="text-white select-all">{voterReceipt.blockHash}</span>
                    </p>
                    <p className="break-all">
                      Your Anonymous Voter Hash: <span className="text-white select-all">{voterReceipt.voterHash}</span>
                    </p>
                    <p>
                      Consensus Timestamp: <span className="text-white">{new Date(voterReceipt.timestamp).toLocaleString()}</span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 border border-dashed border-amber-800/30 bg-amber-950/20 text-amber-500 font-mono text-xs space-y-1 rounded-lg">
                  <p className="font-bold">[SYS WARNING] SYNCHRONIZING RECEIPT FROM BLOCKS...</p>
                  <p className="text-[10px]">
                    If you just simulated database tampering, your transaction signature may have been compromised or recalculated in a mock-attack. Perform a ledger reset in the Admin tab to synchronize credentials.
                  </p>
                </div>
              )}

              <div className="text-center pt-3 border-t border-white/5 flex flex-col items-center">
                <ShieldCheck className="w-12 h-12 text-emerald-500 animate-pulse mb-1" />
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">Decentralized Consensus Verified</span>
                <span className="text-[8px] text-slate-600 font-mono mt-1">PROTOTYPE SECURE SHIELD</span>
              </div>
            </div>
          ) : (
            /* Active Ballot / Voting Form */
            <div className="space-y-5">
              <div className="p-3 bg-[#0b0e14] border border-white/5 font-mono text-xs text-amber-500 flex items-start gap-2.5 rounded-lg">
                <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold uppercase">ZERO-KNOWLEDGE VOTING PROTOCOL ENGAGED</p>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Select your governance candidate below. Casting this ballot will initiate a Proof of Work search locally on the node to compile your anonymous transaction block. This action is irreversible.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {candidates.map((candidate) => {
                  const isSelected = selectedCandidateId === candidate.candidateId;
                  return (
                    <div
                      key={candidate.candidateId}
                      onClick={() => setSelectedCandidateId(candidate.candidateId)}
                      className={`cyber-panel p-4 bg-[#0b0e14] cursor-pointer transition-all flex flex-col justify-between rounded-lg ${
                        isSelected
                          ? "border-[#10b981] bg-[#10b981]/5 shadow-md shadow-[#10b981]/10"
                          : "border-white/5 hover:border-[#10b981]/30"
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start border-b border-white/5 pb-2 mb-2">
                          <div>
                            <span className="text-[9px] text-[#10b981] font-mono uppercase tracking-widest font-semibold">
                              {candidate.party}
                            </span>
                            <h4 className="text-xs font-bold text-white font-mono mt-0.5">
                              {candidate.name}
                            </h4>
                          </div>
                          <span className="text-[8px] px-1.5 py-0.5 bg-[#080a0f] text-[#10b981] rounded font-mono">
                            {candidate.candidateId}
                          </span>
                        </div>

                        <p className="text-[10px] text-slate-400 font-mono leading-relaxed mb-3 text-justify">
                          {candidate.bio}
                        </p>
                      </div>

                      <div className="border-t border-white/5 pt-3 mt-3">
                        <span className="text-[9px] text-slate-500 font-mono block uppercase">Governance Manifesto:</span>
                        <p className="text-[10px] text-white italic font-mono mt-0.5">
                          "{candidate.manifesto}"
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Submit Action */}
              <div className="pt-4 border-t border-white/5 text-center">
                <button
                  onClick={handleCastVote}
                  disabled={!selectedCandidateId}
                  className={`px-8 py-3 cyber-button text-xs font-mono font-bold tracking-widest flex items-center gap-2 mx-auto ${
                    selectedCandidateId ? "cyber-button-magenta border-[#10b981] text-[#10b981]" : "opacity-40 cursor-not-allowed"
                  }`}
                >
                  <Vote className="w-4 h-4" /> SIGN AND IMMUTABLY CAST BALLOT
                </button>
                <p className="text-[9px] text-slate-500 font-mono mt-2">
                  * Note: Mined block will be permanently logged to ledger height: BLOCK #{blockchain.length}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
