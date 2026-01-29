import assert from "node:assert/strict";
import {
  CONFIRMATION_CONSTANTS,
  consumeConfirmationToken,
  createConfirmationToken,
  validateConfirmationToken,
} from "./confirmationToken";
import { resetSessionStoreForTests } from "../session/sessionStore";

process.env.CONFIRMATION_SECRET = "test-secret";

const baseInput = {
  proposalId: "prop_001",
  sessionId: "sess_a",
  actionKind: "PROPOSE_TRANSFER",
  targetId: "acc_67890",
  amount: 50,
};

const fixedTimestamp = new Date().toISOString();

const run = () => {
  resetSessionStoreForTests();

  const token = createConfirmationToken({ ...baseInput, timestamp: fixedTimestamp });

  const priceHike = validateConfirmationToken({
    token,
    sessionId: baseInput.sessionId,
    actionKind: baseInput.actionKind,
    targetId: baseInput.targetId,
    amount: 500,
  });
  assert.equal(priceHike.valid, false);
  assert.equal(priceHike.reason, "amount_mismatch");

  const switcheroo = validateConfirmationToken({
    token,
    sessionId: baseInput.sessionId,
    actionKind: baseInput.actionKind,
    targetId: "acc_hacker",
    amount: baseInput.amount,
  });
  assert.equal(switcheroo.valid, false);
  assert.equal(switcheroo.reason, "target_mismatch");

  const slowpoke = validateConfirmationToken({
    token,
    sessionId: baseInput.sessionId,
    actionKind: baseInput.actionKind,
    targetId: baseInput.targetId,
    amount: baseInput.amount,
    now: new Date(
      new Date(fixedTimestamp).getTime() + CONFIRMATION_CONSTANTS.TOKEN_EXPIRY_MS + 1000
    ).toISOString(),
  });
  assert.equal(slowpoke.valid, false);
  assert.equal(slowpoke.reason, "expired");

  const impostor = validateConfirmationToken({
    token,
    sessionId: "sess_b",
    actionKind: baseInput.actionKind,
    targetId: baseInput.targetId,
    amount: baseInput.amount,
  });
  assert.equal(impostor.valid, false);
  assert.equal(impostor.reason, "missing_or_session_mismatch");

  const garbage = validateConfirmationToken({
    token: "12345",
    sessionId: baseInput.sessionId,
    actionKind: baseInput.actionKind,
    targetId: baseInput.targetId,
    amount: baseInput.amount,
  });
  assert.equal(garbage.valid, false);
  assert.equal(garbage.reason, "invalid_format");

  const firstConsume = consumeConfirmationToken({
    token,
    sessionId: baseInput.sessionId,
    actionKind: baseInput.actionKind,
    targetId: baseInput.targetId,
    amount: baseInput.amount,
    now: new Date(new Date(fixedTimestamp).getTime() + 1000).toISOString(),
  });
  assert.equal(firstConsume.valid, true);

  const doubleDip = consumeConfirmationToken({
    token,
    sessionId: baseInput.sessionId,
    actionKind: baseInput.actionKind,
    targetId: baseInput.targetId,
    amount: baseInput.amount,
  });
  assert.equal(doubleDip.valid, false);
  assert.equal(doubleDip.reason, "missing_or_session_mismatch");

  console.log("confirmationToken tests passed");
};

run();
