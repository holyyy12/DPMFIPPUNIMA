import test from 'node:test';
import assert from 'node:assert/strict';
import { canTransitionDdas, nextCommentDepth, resolvePermission, safePublicEvent } from '../../lib/domain/rules.mjs';

test('D-DAS state machine rejects invalid shortcuts',()=>{assert.equal(canTransitionDdas('received','resolved'),false);assert.equal(canTransitionDdas('received','triaged'),true)});
test('explicit deny wins over allow',()=>assert.equal(resolvePermission([{effect:'allow'},{effect:'deny'}]),false));
test('comment depth is bounded',()=>assert.throws(()=>nextCommentDepth(3,3),/COMMENT_DEPTH_EXCEEDED/));
test('analytics allowlist removes sensitive fields',()=>assert.deepEqual(safePublicEvent({event:'ddas_start',ticket:'secret',email:'x',version:1}),{event:'ddas_start',version:1}));
