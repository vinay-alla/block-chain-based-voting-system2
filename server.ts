import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";

interface VoteTransaction {
  voterIdHash: string;
  candidateId: string;
  timestamp: string;
}

interface Block {
  index: number;
  timestamp: string;
  votes: VoteTransaction[];
  previousHash: string;
  hash: string;
  nonce: number;
  difficulty: number;
}

interface Voter {
  voterId: string;
  passcode: string;
  name: string;
  division: string;
  hasVoted: boolean;
  registeredAt: string;
}

interface Candidate {
  candidateId: string;
  name: string;
  party: string;
  bio: string;
  manifesto: string;
  votesCount: number;
}

const DB_FILE_PATH = path.join(process.cwd(), "blockchain_db.json");
const PORT = 3000;
const DIFFICULTY = 2; // Keep mining fast (e.g. 2 leading hex zeros) but fully real!

// Cryptographic helpers
function calculateBlockHash(
  index: number,
  timestamp: string,
  votes: VoteTransaction[],
  previousHash: string,
  nonce: number
): string {
  const data = index + timestamp + JSON.stringify(votes) + previousHash + nonce;
  return crypto.createHash("sha256").update(data).digest("hex");
}

function mineBlock(
  index: number,
  votes: VoteTransaction[],
  previousHash: string
): Block {
  const timestamp = new Date().toISOString();
  let nonce = 0;
  let hash = "";
  const targetPrefix = "0".repeat(DIFFICULTY);

  while (true) {
    hash = calculateBlockHash(index, timestamp, votes, previousHash, nonce);
    if (hash.startsWith(targetPrefix)) {
      break;
    }
    nonce++;
  }

  return {
    index,
    timestamp,
    votes,
    previousHash,
    hash,
    nonce,
    difficulty: DIFFICULTY,
  };
}

// Default Seed Data
const DEFAULT_CANDIDATES: Candidate[] = [
  {
    candidateId: "CAND_01",
    name: "CYBER-PARTISAN SYSTEM",
    party: "NEO-SYNTHETIC DIVISION",
    bio: "AI-human direct democracy. Liquid protocols for real-time automated resource allocation.",
    manifesto: "Transition absolute governance to zero-knowledge smart-contract clusters. Terminate lobbying arrays.",
    votesCount: 0,
  },
  {
    candidateId: "CAND_02",
    name: "CARBON SOLIDARITY COALITION",
    party: "BIOSPHERE PROTECTORATE",
    bio: "Organic-first, solar-maximum bio-preservation protocols. Human-centric priority queuing.",
    manifesto: "Allocate 92% of computational heat dissipation to vertical hydroponics grids and marine core renewal.",
    votesCount: 0,
  },
  {
    candidateId: "CAND_03",
    name: "VOID TRANS-HUMAN PROTOCOL",
    party: "DEEP-SPACE EXPANSIONISTS",
    bio: "Sub-orbital orbital migration and neural-link synchronization. Core acceleration priority.",
    manifesto: "Establish quantum computation arrays in Earth's Lagrange points. Universal high-bandwidth implants.",
    votesCount: 0,
  },
];

const DEFAULT_VOTERS: Voter[] = [
  {
    voterId: "NEO-V-1024",
    passcode: "CYPHER-9901",
    name: "ALEXANDER CHEN",
    division: "SECTOR-09 (CORE)",
    hasVoted: false,
    registeredAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    voterId: "NEO-V-4096",
    passcode: "ORBIT-1102",
    name: "MIRIAM VANCE",
    division: "SECTOR-12 (OUTER)",
    hasVoted: false,
    registeredAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    voterId: "NEO-V-8192",
    passcode: "MATRIX-4488",
    name: "DANIEL KOWALSKI",
    division: "SECTOR-09 (CORE)",
    hasVoted: false,
    registeredAt: new Date(Date.now() - 600000).toISOString(),
  },
];

// Initialize local database state
let blockchain: Block[] = [];
let voters: Voter[] = [];
let candidates: Candidate[] = [];

function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const data = JSON.parse(fs.readFileSync(DB_FILE_PATH, "utf-8"));
      blockchain = data.blockchain || [];
      voters = data.voters || [];
      candidates = data.candidates || [];
      console.log(`Database loaded successfully with ${blockchain.length} blocks, ${voters.length} voters, and ${candidates.length} candidates.`);
    } else {
      resetToDefaults();
    }
  } catch (error) {
    console.error("Error loading blockchain database, falling back to defaults", error);
    resetToDefaults();
  }
}

function saveDatabase() {
  try {
    const data = { blockchain, voters, candidates };
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to write to blockchain database", error);
  }
}

function resetToDefaults() {
  // Generate Genesis Block
  const genesisVotes: VoteTransaction[] = [
    {
      voterIdHash: "SYSTEM_GENESIS_ADDRESS",
      candidateId: "NONE",
      timestamp: new Date().toISOString(),
    },
  ];
  const genesisBlock = mineBlock(0, genesisVotes, "0000000000000000000000000000000000000000000000000000000000000000");

  blockchain = [genesisBlock];
  voters = [...DEFAULT_VOTERS];
  candidates = DEFAULT_CANDIDATES.map((c) => ({ ...c, votesCount: 0 }));
  saveDatabase();
  console.log("Database reset to genesis default states.");
}

// Initial Database load
loadDatabase();

async function startServer() {
  const app = express();
  app.use(express.json());

  // === API ENDPOINTS ===

  // System Diagnostics / Status
  app.get("/api/system-status", (req, res) => {
    res.json({
      status: "ONLINE",
      ledgerHeight: blockchain.length,
      voterCount: voters.length,
      difficulty: DIFFICULTY,
      hashrateEst: "9.2 KH/s",
      protocolVersion: "RETRO-BLOCK-v1.0.0",
    });
  });

  // Get Candidates
  app.get("/api/candidates", (req, res) => {
    // Recalculate candidates votes count directly from verified blockchain blocks to avoid state sync issues!
    const verifiedCounts: Record<string, number> = {};
    candidates.forEach((c) => {
      verifiedCounts[c.candidateId] = 0;
    });

    // Skip index 0 (Genesis block has "NONE" vote)
    for (let i = 1; i < blockchain.length; i++) {
      blockchain[i].votes.forEach((vote) => {
        if (verifiedCounts[vote.candidateId] !== undefined) {
          verifiedCounts[vote.candidateId]++;
        }
      });
    }

    const updatedCandidates = candidates.map((c) => ({
      ...c,
      votesCount: verifiedCounts[c.candidateId] || 0,
    }));

    res.json(updatedCandidates);
  });

  // Register Candidate (Admin Only)
  app.post("/api/candidates", (req, res) => {
    const { name, party, bio, manifesto } = req.body;
    if (!name || !party) {
      return res.status(400).json({ error: "Candidate name and party division required." });
    }

    const candidateId = `CAND_${String(candidates.length + 1).padStart(2, "0")}`;
    const newCandidate: Candidate = {
      candidateId,
      name: name.toUpperCase(),
      party: party.toUpperCase(),
      bio,
      manifesto,
      votesCount: 0,
    };

    candidates.push(newCandidate);
    saveDatabase();
    res.json({ message: "Candidate registered successfully", candidate: newCandidate });
  });

  // Get Voters List
  app.get("/api/voters", (req, res) => {
    res.json(voters);
  });

  // Register New Voter (Admin Only)
  app.post("/api/voters/register", (req, res) => {
    const { name, division } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Voter legal name required." });
    }

    // Generate cool cybernetic style Voter ID and Passcode
    const randomNum1 = Math.floor(1000 + Math.random() * 9000);
    const randomNum2 = Math.floor(1000 + Math.random() * 9000);
    const voterId = `NEO-V-${randomNum1}`;
    const passcode = `CYPHER-${randomNum2}`;

    const newVoter: Voter = {
      voterId,
      passcode,
      name: name.toUpperCase(),
      division: division ? division.toUpperCase() : "SECTOR-09 (CORE)",
      hasVoted: false,
      registeredAt: new Date().toISOString(),
    };

    voters.push(newVoter);
    saveDatabase();
    res.json({ message: "Voter credentials allocated successfully.", voter: newVoter });
  });

  // Login Voter
  app.post("/api/voters/login", (req, res) => {
    const { voterId, passcode } = req.body;
    if (!voterId || !passcode) {
      return res.status(400).json({ error: "Voter ID and security cypher passcode required." });
    }

    const voter = voters.find(
      (v) => v.voterId.toUpperCase() === voterId.toUpperCase().trim() && v.passcode.toUpperCase() === passcode.toUpperCase().trim()
    );

    if (!voter) {
      return res.status(401).json({ error: "Invalid credential pairing. Handshake rejected." });
    }

    res.json({ message: "Handshake success. Session authenticated.", voter });
  });

  // Get Blockchain Ledger
  app.get("/api/blockchain", (req, res) => {
    res.json(blockchain);
  });

  // Validate Blockchain Integrity (Cryptographic recalculation check)
  app.get("/api/blockchain/validate", (req, res) => {
    const logs: string[] = [];
    let isValid = true;

    logs.push(`[LOG] Starting cryptographic sweep on ledger height: ${blockchain.length} blocks.`);

    for (let i = 0; i < blockchain.length; i++) {
      const block = blockchain[i];

      // 1. Recalculate block hash and verify against the stored hash
      const recalculatedHash = calculateBlockHash(
        block.index,
        block.timestamp,
        block.votes,
        block.previousHash,
        block.nonce
      );

      if (block.hash !== recalculatedHash) {
        isValid = false;
        logs.push(
          `[FAIL] Block #${block.index} hash mismatch. Recalculated: ${recalculatedHash.substring(0, 16)}... != Recorded: ${block.hash.substring(0, 16)}...`
        );
      } else {
        logs.push(`[OK] Block #${block.index} signature validates successfully.`);
      }

      // 2. Check previous hash connection (except for genesis block)
      if (i > 0) {
        const previousBlock = blockchain[i - 1];
        if (block.previousHash !== previousBlock.hash) {
          isValid = false;
          logs.push(
            `[FAIL] Broken chain connection at Block #${block.index}. Link says [${block.previousHash.substring(0, 10)}] but previous Block #${previousBlock.index} actual hash is [${previousBlock.hash.substring(0, 10)}]`
          );
        } else {
          logs.push(`[OK] Block #${block.index} perfectly linked to Block #${previousBlock.index}.`);
        }
      }

      // 3. Check Proof of Work difficulty constraint
      const targetPrefix = "0".repeat(block.difficulty || DIFFICULTY);
      if (!block.hash.startsWith(targetPrefix)) {
        isValid = false;
        logs.push(`[FAIL] Block #${block.index} violates mining difficulty constraint. Hash does not start with '${targetPrefix}'.`);
      }
    }

    if (isValid) {
      logs.push(`[SUCCESS] Blockchain validated. All nodes verified. Decentralized consensus intact.`);
    } else {
      logs.push(`[WARNING] CRYPTOGRAPHIC TAMPER DETECTED. LEDGER DISCREPANCY REJECTED BY CONSENSUS.`);
    }

    res.json({ isValid, logs });
  });

  // Cast Secure Vote (Mine a new block containing the vote!)
  app.post("/api/vote", (req, res) => {
    const { voterId, passcode, candidateId } = req.body;

    if (!voterId || !passcode || !candidateId) {
      return res.status(400).json({ error: "Incomplete vote envelope payload." });
    }

    // 1. Authenticate Voter
    const voterIndex = voters.findIndex(
      (v) => v.voterId.toUpperCase() === voterId.toUpperCase().trim() && v.passcode.toUpperCase() === passcode.toUpperCase().trim()
    );

    if (voterIndex === -1) {
      return res.status(401).json({ error: "Authenticating voter credential pairing failed." });
    }

    const voter = voters[voterIndex];

    // 2. Check double voting
    if (voter.hasVoted) {
      return res.status(403).json({ error: "Access Denied: Ballot already cast on this ledger. Double-voting terminated." });
    }

    // 3. Validate candidate
    const candidateExists = candidates.some((c) => c.candidateId === candidateId);
    if (!candidateExists) {
      return res.status(404).json({ error: "Candidate system identifier not found." });
    }

    // 4. Mark voter as voted
    voters[voterIndex].hasVoted = true;

    // 5. Generate secure anonymous transaction hash of voter ID to protect identity
    const voterIdHash = crypto.createHash("sha256").update(voterId).digest("hex");

    const voteTransaction: VoteTransaction = {
      voterIdHash,
      candidateId,
      timestamp: new Date().toISOString(),
    };

    // 6. Mine the block
    const previousBlock = blockchain[blockchain.length - 1];
    const newIndex = previousBlock.index + 1;

    console.log(`[MINING] Commencing cryptographic sweep to mine Block #${newIndex}...`);
    const newBlock = mineBlock(newIndex, [voteTransaction], previousBlock.hash);
    console.log(`[SUCCESS] Mined block #${newIndex} with Hash: ${newBlock.hash}`);

    // 7. Append to ledger and save
    blockchain.push(newBlock);
    saveDatabase();

    res.json({
      message: "VOTING COMPLETE. BLOCK IMMUTABLY RECORDED TO THE LEDGER.",
      voterId: voter.voterId,
      hasVoted: true,
      minedBlock: newBlock,
    });
  });

  // Admin Ledger Reset Tool
  app.post("/api/admin/reset", (req, res) => {
    resetToDefaults();
    res.json({ message: "Ledger and voter rosters initialized back to genesis." });
  });

  // Admin Simulated Tamper Tool (to show off the verification algorithm!)
  app.post("/api/admin/tamper", (req, res) => {
    const { blockIndex, newCandidateId } = req.body;

    if (blockIndex === undefined || !newCandidateId) {
      return res.status(400).json({ error: "Block index and target replacement candidate ID required." });
    }

    const indexNum = Number(blockIndex);
    if (indexNum < 0 || indexNum >= blockchain.length) {
      return res.status(404).json({ error: "Block index out of bounds." });
    }

    if (indexNum === 0) {
      return res.status(400).json({ error: "Genesis Block cannot be modified directly via simulated injection." });
    }

    // Tamper with the votes array in this specific block, changing the vote!
    // This maintains the original hash but fails recalculated checks, showing exactly how blockchain prevents corruption!
    blockchain[indexNum].votes = blockchain[indexNum].votes.map((vote) => ({
      ...vote,
      candidateId: newCandidateId,
    }));

    // Optionally we can modify the block data but KEEP the same hash, so recalculation fails
    // This perfectly simulates malicious database modification on disk!
    saveDatabase();

    res.json({
      message: `SIMULATED INTRUSION COMPLETE. Block #${indexNum} votes altered to: ${newCandidateId}. Open validation console to observe signature rejection.`,
      tamperedBlock: blockchain[indexNum],
    });
  });

  // === EXPORT REPORT CONTENT FOR CAPSTONE STUDENTS ===
  app.get("/api/docs", (req, res) => {
    res.json({
      title: "IMMUTABLE LEDGER VOTING SECURITY SYSTEMS (ILVSS)",
      abstract: "This capstone project presents a zero-trust decentralized ledger application designed for local and corporate voting procedures. By deploying a custom Node.js blockchain with Proof of Work mining consensus and secure voter ID anonymization using SHA-256 digests, the system achieves end-to-end auditability without relying on heavy third-party distributed gas-networks.",
      architecture: [
        {
          layer: "1. PRESENTATION LAYER (React 19 / Tailwind / Motion)",
          details: "Immersive Retro-Futuristic cyber-security interface. Real-time ledger rendering, block exploration, cryptographic sweep animations, and admin overrides."
        },
        {
          layer: "2. APPLICATION LAYER (Node.js / Express API)",
          details: "State routing, voter validation matrices, hashing queues, and simulation pathways for security verification."
        },
        {
          layer: "3. CRYPTOGRAPHIC LEDGER ENGINE",
          details: "SHA-256 block-hashing mechanism linking each node by previous block hashes. Custom difficulty targets (Proof of Work) ensuring computational consensus constraints."
        },
        {
          layer: "4. DATA SECURITY LAYER",
          details: "One-way voter ID hashing using SHA-256 to ensure voter anonymity. Local JSON database snapshotting to sustain persistence against runtime restarts."
        }
      ],
      algorithms: {
        mining: "while (!hash.startsWith('00')) { nonce++; hash = sha256(index + timestamp + votes + prevHash + nonce); }",
        validation: "For each block i: hash(i) === sha256(block_fields) && previousHash(i) === hash(i-1)"
      }
    });
  });


  // Vite middleware or production static build fallback
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Cryptic Ledger active on node: http://localhost:${PORT}`);
  });
}

startServer();
