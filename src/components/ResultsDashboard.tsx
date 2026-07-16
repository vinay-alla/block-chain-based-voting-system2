import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from "recharts";
import { Vote, AlertCircle, Award, Shield, CheckCircle } from "lucide-react";
import { Candidate, Block } from "../types";

interface ResultsDashboardProps {
  candidates: Candidate[];
  blockchain: Block[];
}

export default function ResultsDashboard({ candidates, blockchain }: ResultsDashboardProps) {
  // Sum total votes
  const totalVotes = candidates.reduce((acc, curr) => acc + curr.votesCount, 0);

  // Find projected leader
  const leadingCandidate = [...candidates].sort((a, b) => b.votesCount - a.votesCount)[0];
  const isDraw = candidates.every((c) => c.votesCount === candidates[0].votesCount) && candidates[0].votesCount > 0;

  // Prepare chart data
  const chartData = candidates.map((cand) => ({
    name: cand.name.split(" ")[0] || cand.name, // Shorten name for x-axis
    fullName: cand.name,
    votes: cand.votesCount,
    percentage: totalVotes > 0 ? Math.round((cand.votesCount / totalVotes) * 100) : 0,
  }));

  // Recharts colors (emerald variations for Immersive UI theme)
  const neonColors = ["#10b981", "#34d399", "#059669"];

  // Fetch last 4 voting transactions to show as a micro-ledger feed
  const recentTransactions: { blockIndex: number; hash: string; candId: string; timestamp: string }[] = [];
  
  // Skip Genesis Block (blockchain[0])
  for (let i = blockchain.length - 1; i > 0; i--) {
    blockchain[i].votes.forEach((vote) => {
      recentTransactions.push({
        blockIndex: blockchain[i].index,
        hash: blockchain[i].hash,
        candId: vote.candidateId,
        timestamp: vote.timestamp,
      });
    });
  }

  const getCandidateName = (cid: string) => {
    const cand = candidates.find((c) => c.candidateId === cid);
    return cand ? cand.name : cid;
  };

  return (
    <div className="space-y-6">
      {/* Top Level Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total Ledger Ballots */}
        <div className="cyber-panel p-5 bg-[#0b0e14] relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 bg-[#10b981] text-black text-[8px] font-bold px-1.5 py-0.5 font-mono rounded-bl">
            SYS_STAT_OK
          </div>
          <div className="flex items-center gap-2 text-[#10b981] border-b border-white/5 pb-2 mb-2">
            <Vote className="w-4 h-4" />
            <h3 className="text-xs font-bold font-mono uppercase tracking-widest">VALIDATED BALLOTS</h3>
          </div>
          <p className="text-3xl font-extrabold font-mono text-white mt-1">
            {totalVotes} <span className="text-xs text-slate-400 font-normal">DEPOSITED</span>
          </p>
          <p className="text-[9px] text-slate-500 font-mono mt-1">
            Mined across {blockchain.length} blocks on current epoch node.
          </p>
        </div>

        {/* Projected Winner Projection */}
        <div className="cyber-panel-magenta p-5 bg-[#0b0e14] relative overflow-hidden flex flex-col justify-between col-span-1 md:col-span-2">
          <div className="absolute top-0 right-0 bg-[#34d399] text-black text-[8px] font-bold px-1.5 py-0.5 font-mono rounded-bl">
            ALGO_PROJ_v1
          </div>
          <div className="flex items-center gap-2 text-[#34d399] border-b border-white/5 pb-2 mb-2">
            <Award className="w-4 h-4" />
            <h3 className="text-xs font-bold font-mono uppercase tracking-widest">ELECTION LEAD PROJECTION</h3>
          </div>

          {totalVotes === 0 ? (
            <p className="text-xs text-slate-500 font-mono py-2 italic">
              No transactions detected on the block ledger. Waiting for ballot registration...
            </p>
          ) : isDraw ? (
            <p className="text-xs text-amber-400 font-mono py-2 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" /> CONSENSUS STALEMATE: Votes are evenly distributed across all active factions!
            </p>
          ) : (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mt-1 font-mono">
              <div>
                <p className="text-md font-bold text-white uppercase">{leadingCandidate.name}</p>
                <p className="text-[10px] text-slate-400">{leadingCandidate.party}</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-extrabold text-[#10b981]">
                  {leadingCandidate.votesCount} Votes
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {Math.round((leadingCandidate.votesCount / totalVotes) * 100)}% Matrix Control
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Analytics Charts Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 cyber-panel p-5 bg-[#0b0e14] space-y-4">
          <div className="border-b border-white/5 pb-2">
            <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
              LEDGER DISTRIBUTION RATIOS
            </h3>
          </div>

          {totalVotes === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center border border-dashed border-white/5 text-center p-4 rounded-lg">
              <Shield className="w-10 h-10 text-slate-700 mb-2 animate-pulse" />
              <p className="text-xs font-mono text-slate-500">LEDGER EMPTY — NO DATA TO MAP</p>
            </div>
          ) : (
            <div className="h-64 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="#10b981" fontSize={10} fontFamily="monospace" tickLine={false} />
                  <YAxis stroke="#10b981" fontSize={10} fontFamily="monospace" tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0b0e14",
                      border: "1px solid rgba(16, 185, 129, 0.3)",
                      borderRadius: "0.5rem",
                      color: "#fff",
                      fontFamily: "monospace",
                      fontSize: "11px",
                    }}
                  />
                  <Bar dataKey="votes" fill="#10b981">
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={neonColors[index % neonColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Audit summary */}
        <div className="lg:col-span-5 cyber-panel p-5 bg-[#0b0e14] flex flex-col justify-between h-auto">
          <div>
            <div className="border-b border-white/5 pb-2 mb-3">
              <h3 className="text-xs font-bold text-[#10b981] font-mono uppercase tracking-wider">
                REAL-TIME TRANSACTION INGEST
              </h3>
            </div>

            <div className="space-y-3">
              {recentTransactions.length === 0 ? (
                <div className="p-4 border border-dashed border-white/5 rounded-lg text-center">
                  <p className="text-[10px] text-slate-500 font-mono italic">
                    Awaiting peer ledger transactions...
                  </p>
                </div>
              ) : (
                recentTransactions.slice(0, 4).map((tx, idx) => (
                  <div
                    key={idx}
                    className="p-2 border border-white/5 bg-[#080a0f] rounded-lg font-mono text-[9px] space-y-1 relative"
                  >
                    <div className="flex justify-between items-center text-white">
                      <span className="text-[#10b981] font-bold">BLOCK #{tx.blockIndex}</span>
                      <span className="text-slate-500">{new Date(tx.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-400 truncate">
                      VOTED: <span className="text-white font-bold">{getCandidateName(tx.candId)}</span>
                    </p>
                    <p className="text-[8px] text-slate-600 truncate">SIG: {tx.hash}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 mt-4 text-[9px] font-mono text-slate-500 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle className="w-3 h-3" />
              <span className="font-bold">LEDGER STATUS: IMMUTABLE</span>
            </div>
            <p>
              Each mined vote is bound directly into the previous hash tree block structure, making data modification computationally impossible.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
