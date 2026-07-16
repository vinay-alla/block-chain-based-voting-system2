export interface VoteTransaction {
  voterIdHash: string;
  candidateId: string;
  timestamp: string;
}

export interface Block {
  index: number;
  timestamp: string;
  votes: VoteTransaction[];
  previousHash: string;
  hash: string;
  nonce: number;
  difficulty: number;
}

export interface Voter {
  voterId: string;
  passcode: string;
  name: string;
  division: string;
  hasVoted: boolean;
  registeredAt: string;
}

export interface Candidate {
  candidateId: string;
  name: string;
  party: string;
  bio: string;
  manifesto: string;
  votesCount: number;
}

export interface SystemStatus {
  status: string;
  ledgerHeight: number;
  voterCount: number;
  difficulty: number;
  hashrateEst: string;
  protocolVersion: string;
}

export interface DocContent {
  title: string;
  abstract: string;
  architecture: { layer: string; details: string }[];
  algorithms: { mining: string; validation: string };
}
