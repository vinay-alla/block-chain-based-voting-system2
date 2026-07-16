import React from "react";
import { BookOpen, ShieldAlert, Cpu, Network, FileText, CheckCircle2 } from "lucide-react";
import { DocContent } from "../types";

interface DocsReportProps {
  docContent: DocContent | null;
}

export default function DocsReport({ docContent }: DocsReportProps) {
  const defaultDoc: DocContent = {
    title: "NEO-VOTE IMMUTABLE BLOCKCHAIN MATRIX",
    abstract: "A peer-to-peer decentralized cryptographic voting system designed to address central vulnerability profiles in standard digital balloting. By compiling a custom Proof of Work block chain with strict SHA-256 ledger references and zero-knowledge voter credentials, this prototype isolates voter identity from ballot records, guaranteeing absolute anonymity and immutability.",
    architecture: [
      {
        layer: "PHASE 01: THE PRESENTATION PLANE (React 19 / Tailwind / Motion)",
        details: "Immersive terminal interface featuring raw emerald/slate color channels, screen refresh indicators, block inspection frames, and real-time cryptographic audit telemetry."
      },
      {
        layer: "PHASE 02: THE API GATEWAY ROUTER (Node.js / Express)",
        details: "Asynchronous router handling transaction requests, difficulty challenges, node snapshot serialization, and simulation channels."
      },
      {
        layer: "PHASE 03: THE IMMUTABLE CRYPTO ENGINE",
        details: "Cryptographic state machine where blocks are chained using SHA-256 hashes of preceding headers. Mining requires solving a proof-of-work puzzle matching configured difficulty limits."
      },
      {
        layer: "PHASE 04: ANONYMOUS LEDGER PERSISTENCE",
        details: "Voter identifiers are encrypted in one-way SHA-256 hash registers to maintain physical auditability while preventing third-party voter-candidate trace maps."
      }
    ],
    algorithms: {
      mining: "while (!hash.startsWith('00')) { nonce++; hash = sha256(index + timestamp + votes + prevHash + nonce); }",
      validation: "For each block i: hash(i) === sha256(block_fields) && previousHash(i) === hash(i-1)"
    }
  };

  const data = docContent || defaultDoc;

  return (
    <div className="space-y-6">
      <div className="border border-dashed border-[#10b981]/30 p-4 bg-[#0b0e14] relative overflow-hidden rounded-lg">
        <div className="absolute top-0 right-0 bg-[#10b981] text-[#050608] px-2 py-0.5 text-xs font-bold font-mono rounded-bl">
          DOC_REF_V1
        </div>
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="w-5 h-5 text-[#34d399] animate-pulse" />
          <h2 className="text-xl font-bold tracking-wider text-white font-mono">
            CAPSTONE PROJECT ACADEMIC THESIS
          </h2>
        </div>
        <p className="text-xs text-[#10b981] font-mono leading-relaxed">
          Title: <span className="text-white">{data.title}</span>
        </p>
      </div>

      {/* Abstract */}
      <div className="cyber-panel p-5 bg-[#0b0e14] space-y-3">
        <div className="flex items-center gap-2 border-b border-white/5 pb-2">
          <FileText className="w-4 h-4 text-[#10b981]" />
          <h3 className="text-md font-bold tracking-wider text-[#10b981] font-mono">
            01. ABSTRACT & PROJECT OUTLINE
          </h3>
        </div>
        <p className="text-xs text-slate-300 font-mono leading-relaxed text-justify">
          {data.abstract}
        </p>
      </div>

      {/* Architecture */}
      <div className="cyber-panel-magenta p-5 bg-[#0b0e14] space-y-3">
        <div className="flex items-center gap-2 border-b border-white/5 pb-2">
          <Network className="w-4 h-4 text-[#34d399]" />
          <h3 className="text-md font-bold tracking-wider text-[#34d399] font-mono">
            02. MULTI-TIER LEDGER ARCHITECTURE
          </h3>
        </div>
        <div className="space-y-4">
          {data.architecture.map((layer, idx) => (
            <div key={idx} className="border-l-2 border-dashed border-[#34d399]/40 pl-3 space-y-1">
              <h4 className="text-xs font-bold text-white font-mono">{layer.layer}</h4>
              <p className="text-xs text-slate-400 font-mono leading-relaxed">{layer.details}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Core Cryptographic Algorithms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mining */}
        <div className="cyber-panel p-4 bg-[#0b0e14] space-y-2">
          <div className="flex items-center gap-2 text-[#10b981] mb-1">
            <Cpu className="w-4 h-4" />
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider">PROOF-OF-WORK CONSENSUS</h4>
          </div>
          <div className="bg-[#050608] p-3 border border-white/5 rounded-lg font-mono text-[10px] text-emerald-400 overflow-x-auto whitespace-pre">
            {`// MINING SPECIFICATION\n${data.algorithms.mining}`}
          </div>
          <p className="text-[10px] text-slate-400 font-mono">
            Requires nodes to cycle through a mathematical nonce until the double SHA-256 hash starts with the designated leading difficulty zero bytes.
          </p>
        </div>

        {/* Validation */}
        <div className="cyber-panel-magenta p-4 bg-[#0b0e14] space-y-2">
          <div className="flex items-center gap-2 text-[#34d399] mb-1">
            <ShieldAlert className="w-4 h-4" />
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider">CRYPTOGRAPHIC LEDGER AUDIT</h4>
          </div>
          <div className="bg-[#050608] p-3 border border-white/5 rounded-lg font-mono text-[10px] text-emerald-400 overflow-x-auto whitespace-pre">
            {`// VERIFICATION ALGORITHM\n${data.algorithms.validation}`}
          </div>
          <p className="text-[10px] text-slate-400 font-mono">
            Iterates through the entire array verifying block content integrity and checking that previous block pointers are aligned and untampered.
          </p>
        </div>
      </div>

      {/* Security Features Bullet List */}
      <div className="cyber-panel p-5 bg-[#0b0e14] space-y-4">
        <div className="border-b border-white/5 pb-2">
          <h3 className="text-xs font-bold text-white tracking-widest font-mono">
            03. ZERO-TRUST DECENTRALIZED COMPLIANCE PROTOCOLS
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-[#080a0f] border border-white/5 space-y-1 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
            <h4 className="text-xs font-bold font-mono text-white">ANONYMOUS ID DIGEST</h4>
            <p className="text-[10px] text-slate-400 font-mono leading-normal">
              No voter names are linked to votes. Standard SHA-256 hashes anonymize voters on the ledger while proving a block was successfully written.
            </p>
          </div>

          <div className="p-3 bg-[#080a0f] border border-white/5 space-y-1 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-[#34d399]" />
            <h4 className="text-xs font-bold font-mono text-white">TAMPER DETECTION</h4>
            <p className="text-[10px] text-slate-400 font-mono leading-normal">
              If any node changes a historic record, the chain hash recalculation breaks instantly, causing peer nodes to lock down and reject the bad block.
            </p>
          </div>

          <div className="p-3 bg-[#080a0f] border border-white/5 space-y-1 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
            <h4 className="text-xs font-bold font-mono text-white">GENESIS ANCHORING</h4>
            <p className="text-[10px] text-slate-400 font-mono leading-normal">
              The immutable Genesis Block forms an absolute base starting condition, making spoof-chains easily detectable.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
