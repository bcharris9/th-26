export type PendingActionStatus = "AWAITING_CONFIRMATION" | "COMPLETED";

export type PendingAction = {
  proposalId: string;
  sessionId: string;
  actionKind: string;
  targetId: string;
  amount: number;
  timestamp: string;
  status: PendingActionStatus;
};

const sessions = new Map<string, Map<string, PendingAction>>();

const getSessionMap = (sessionId: string) => {
  let session = sessions.get(sessionId);
  if (!session) {
    session = new Map();
    sessions.set(sessionId, session);
  }
  return session;
};

export const setPendingAction = (action: PendingAction) => {
  const session = getSessionMap(action.sessionId);
  session.set(action.proposalId, action);
};

export const getPendingAction = (sessionId: string, proposalId: string) => {
  return sessions.get(sessionId)?.get(proposalId);
};

export const removePendingAction = (sessionId: string, proposalId: string) => {
  sessions.get(sessionId)?.delete(proposalId);
};

export const markPendingActionCompleted = (sessionId: string, proposalId: string) => {
  const action = getPendingAction(sessionId, proposalId);
  if (action) {
    action.status = "COMPLETED";
  }
};

export const resetSessionStoreForTests = () => {
  sessions.clear();
};
