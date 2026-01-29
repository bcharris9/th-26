import type { ProposedAction } from "../actions/actionTypes";
import type { PolicyRiskLevel } from "../policy/moneyMovementPolicy";

export type PendingVoiceAction = {
  proposalId: string;
  actionKind: ProposedAction["type"];
  payload: ProposedAction["payload"];
  riskLevel: PolicyRiskLevel;
  riskScore: number;
  riskReasons: string[];
  confirmationToken?: string;
};

export type VoiceSessionState = {
  lastTranscript?: string;
  lastAction?: ProposedAction;
  pendingAction?: PendingVoiceAction;
};

const sessions = new Map<string, VoiceSessionState>();

export const getVoiceSession = (sessionId: string) => {
  let session = sessions.get(sessionId);
  if (!session) {
    session = {};
    sessions.set(sessionId, session);
  }
  return session;
};

export const setPendingVoiceAction = (sessionId: string, pending: PendingVoiceAction) => {
  const session = getVoiceSession(sessionId);
  session.pendingAction = pending;
};

export const clearPendingVoiceAction = (sessionId: string) => {
  const session = getVoiceSession(sessionId);
  delete session.pendingAction;
};

export const updateLastAction = (sessionId: string, transcript: string, action?: ProposedAction) => {
  const session = getVoiceSession(sessionId);
  session.lastTranscript = transcript;
  session.lastAction = action;
};

export const resetVoiceSessionsForTests = () => {
  sessions.clear();
};
