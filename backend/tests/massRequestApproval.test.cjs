const assert = require("node:assert/strict");
const test = require("node:test");
const Material = require("../models/MaterialModel");
const MaterialController = require("../controllers/MaterialController");
const {
    resolveMassRequestApprovalStage,
    isMassRequestApprovalInboxEligible,
    filterMassRequestApprovalInboxRows,
    canActorApproveMassRequestStage,
    buildMassRequestApprovePatch,
    buildMassRequestReworkPatch,
    buildMassRequestRejectPatch,
    mapMassRowToApprovalShape,
} = require("../helper/massRequestApproval");

// ---------------------------------------------------------------------------
// mapMassRowToApprovalShape
// ---------------------------------------------------------------------------
test("mapMassRowToApprovalShape maps first_item_* fields to approval_* fields", () => {
    const row = {
        first_item_approval_1_user_id: "APPROVER-01",
        first_item_approval_1_status: "WAITING",
        first_item_approval_2_user_id: "APPROVER-02",
        first_item_approval_2_status: null,
        first_item_approval_3_user_id: null,
        first_item_approval_3_status: null,
        first_item_status: "Submit",
    };
    const approval = mapMassRowToApprovalShape(row);

    assert.equal(approval.approval_1_user_id, "APPROVER-01");
    assert.equal(approval.approval_1_status, "WAITING");
    assert.equal(approval.approval_2_user_id, "APPROVER-02");
    assert.equal(approval.approval_2_status, null);
    assert.equal(approval.approval_3_user_id, null);
    assert.equal(approval.approval_3_status, null);
    assert.equal(approval.status, "Submit");
    assert.equal(approval.ticket_type, "Create");
    assert.equal(approval.ticketType, "Create");
});

// ---------------------------------------------------------------------------
// resolveMassRequestApprovalStage
// ---------------------------------------------------------------------------
test("resolveMassRequestApprovalStage returns Approval 1 when first item status is WAITING", () => {
    const row = {
        first_item_approval_1_status: "WAITING",
        first_item_approval_2_status: null,
        first_item_approval_3_status: null,
    };
    assert.equal(resolveMassRequestApprovalStage(row), "Approval 1");
});

test("resolveMassRequestApprovalStage returns Approval 2 when Approval 1 approved but Approval 2 is WAITING/null", () => {
    const row = {
        first_item_approval_1_status: "APPROVED",
        first_item_approval_2_status: null,
        first_item_approval_3_status: null,
    };
    assert.equal(resolveMassRequestApprovalStage(row), "Approval 2");
});

test("resolveMassRequestApprovalStage returns Approval 2 when Approval 2 is explicitly WAITING", () => {
    const row = {
        first_item_approval_1_status: "APPROVED",
        first_item_approval_2_status: "WAITING",
        first_item_approval_3_status: null,
    };
    assert.equal(resolveMassRequestApprovalStage(row), "Approval 2");
});

test("resolveMassRequestApprovalStage returns null when all stages are processed", () => {
    const row = {
        first_item_approval_1_status: "APPROVED",
        first_item_approval_2_status: "APPROVED",
        first_item_approval_3_status: "APPROVED",
    };
    assert.equal(resolveMassRequestApprovalStage(row), null);
});

test("resolveMassRequestApprovalStage returns null for REJECTED stage", () => {
    const row = {
        first_item_approval_1_status: "REJECTED",
        first_item_approval_2_status: null,
        first_item_approval_3_status: null,
    };
    assert.equal(resolveMassRequestApprovalStage(row), null);
});

// ---------------------------------------------------------------------------
// isMassRequestApprovalInboxEligible
// ---------------------------------------------------------------------------
test("isMassRequestApprovalInboxEligible returns true when active stage exists", () => {
    const row = {
        first_item_approval_1_status: "WAITING",
        first_item_approval_2_status: null,
        first_item_approval_3_status: null,
        first_item_status: "Submit",
    };
    assert.equal(isMassRequestApprovalInboxEligible(row), true);
});

test("isMassRequestApprovalInboxEligible returns true for REWORK status", () => {
    const row = {
        first_item_approval_1_status: "REWORK",
        first_item_approval_2_status: null,
        first_item_approval_3_status: null,
        first_item_status: "Rework",
    };
    assert.equal(isMassRequestApprovalInboxEligible(row), true);
});

test("isMassRequestApprovalInboxEligible returns true for DONE status", () => {
    const row = {
        first_item_approval_1_status: "APPROVED",
        first_item_approval_2_status: "APPROVED",
        first_item_approval_3_status: "APPROVED",
        first_item_status: "DONE",
    };
    assert.equal(isMassRequestApprovalInboxEligible(row), true);
});

test("isMassRequestApprovalInboxEligible returns false when no active stage and status not visible", () => {
    const row = {
        first_item_approval_1_status: "APPROVED",
        first_item_approval_2_status: "APPROVED",
        first_item_approval_3_status: "APPROVED",
        first_item_status: "COMPLETED",
    };
    assert.equal(isMassRequestApprovalInboxEligible(row), false);
});

test("isMassRequestApprovalInboxEligible returns true for CANCEL status", () => {
    const row = {
        first_item_approval_1_status: null,
        first_item_approval_2_status: null,
        first_item_approval_3_status: null,
        first_item_status: "CANCEL",
    };
    assert.equal(isMassRequestApprovalInboxEligible(row), true);
});

// ---------------------------------------------------------------------------
// filterMassRequestApprovalInboxRows
// ---------------------------------------------------------------------------
test("filterMassRequestApprovalInboxRows admin sees all eligible rows", () => {
    const rows = [
        {
            id: 1,
            first_item_approval_1_user_id: "APP-01",
            first_item_approval_1_status: "WAITING",
            first_item_approval_2_user_id: "APP-02",
            first_item_approval_2_status: null,
            first_item_approval_3_user_id: null,
            first_item_approval_3_status: null,
            first_item_status: "Submit",
        },
    ];
    const result = filterMassRequestApprovalInboxRows(rows, {
        actorUserId: "ANY",
        actorUsername: "ADMIN",
    });
    assert.equal(result.length, 1);
});

test("filterMassRequestApprovalInboxRows filters out ineligible rows", () => {
    const rows = [
        {
            id: 1,
            first_item_approval_1_status: "APPROVED",
            first_item_approval_2_status: "APPROVED",
            first_item_approval_3_status: "APPROVED",
            first_item_status: "COMPLETED",
        },
    ];
    const result = filterMassRequestApprovalInboxRows(rows, {
        actorUserId: "APP-01",
        actorUsername: "user.one",
    });
    assert.equal(result.length, 0);
});

test("filterMassRequestApprovalInboxRows matches actor to Approval 1", () => {
    const rows = [
        {
            id: 1,
            first_item_approval_1_user_id: "APP-01",
            first_item_approval_1_status: "WAITING",
            first_item_approval_2_user_id: "APP-02",
            first_item_approval_2_status: null,
            first_item_approval_3_user_id: null,
            first_item_approval_3_status: null,
            first_item_status: "Submit",
        },
    ];
    const result = filterMassRequestApprovalInboxRows(rows, {
        actorUserId: "APP-01",
        actorUsername: "user.one",
    });
    assert.equal(result.length, 1);
});

test("filterMassRequestApprovalInboxRows rejects actor not assigned to active stage", () => {
    const rows = [
        {
            id: 1,
            first_item_approval_1_user_id: "APP-01",
            first_item_approval_1_status: "WAITING",
            first_item_approval_2_user_id: "APP-02",
            first_item_approval_2_status: null,
            first_item_approval_3_user_id: null,
            first_item_approval_3_status: null,
            first_item_status: "Submit",
        },
    ];
    const result = filterMassRequestApprovalInboxRows(rows, {
        actorUserId: "WRONG-USER",
        actorUsername: "wrong.user",
    });
    assert.equal(result.length, 0);
});

test("filterMassRequestApprovalInboxRows shows rejected rows to the rejecting approver", () => {
    const rows = [
        {
            id: 1,
            first_item_approval_1_user_id: "APP-01",
            first_item_approval_1_status: "REJECTED",
            first_item_approval_2_user_id: "APP-02",
            first_item_approval_2_status: null,
            first_item_approval_3_user_id: null,
            first_item_approval_3_status: null,
            first_item_status: "CANCEL",
        },
    ];
    const result = filterMassRequestApprovalInboxRows(rows, {
        actorUserId: "APP-01",
        actorUsername: "user.one",
    });
    assert.equal(result.length, 1);
});

test("filterMassRequestApprovalInboxRows hides rejected rows from non-rejecting actor", () => {
    const rows = [
        {
            id: 1,
            first_item_approval_1_user_id: "APP-01",
            first_item_approval_1_status: "REJECTED",
            first_item_approval_2_user_id: "APP-02",
            first_item_approval_2_status: null,
            first_item_approval_3_user_id: null,
            first_item_approval_3_status: null,
            first_item_status: "CANCEL",
        },
    ];
    const result = filterMassRequestApprovalInboxRows(rows, {
        actorUserId: "OTHER-USER",
        actorUsername: "other.user",
    });
    assert.equal(result.length, 0);
});

// ---------------------------------------------------------------------------
// canActorApproveMassRequestStage
// ---------------------------------------------------------------------------
test("canActorApproveMassRequestStage admin can always approve", () => {
    const row = {
        first_item_approval_1_user_id: "APP-01",
        first_item_approval_1_status: "WAITING",
        first_item_approval_2_user_id: "APP-02",
        first_item_approval_2_status: null,
    };
    assert.equal(
        canActorApproveMassRequestStage({
            row,
            actorUserId: "ANY",
            actorUsername: "ADMIN",
        }),
        true
    );
});

test("canActorApproveMassRequestStage returns true when actor matches Approval 1", () => {
    const row = {
        first_item_approval_1_user_id: "APP-01",
        first_item_approval_1_status: "WAITING",
        first_item_approval_2_user_id: "APP-02",
        first_item_approval_2_status: null,
    };
    assert.equal(
        canActorApproveMassRequestStage({
            row,
            actorUserId: "APP-01",
            actorUsername: "user.one",
        }),
        true
    );
});

test("canActorApproveMassRequestStage returns false when actor does not match", () => {
    const row = {
        first_item_approval_1_user_id: "APP-01",
        first_item_approval_1_status: "WAITING",
    };
    assert.equal(
        canActorApproveMassRequestStage({
            row,
            actorUserId: "WRONG",
            actorUsername: "wrong.user",
        }),
        false
    );
});

// ---------------------------------------------------------------------------
// buildMassRequestApprovePatch
// ---------------------------------------------------------------------------
test("buildMassRequestApprovePatch for Approval 1 advances to Approval 2", () => {
    const patch = buildMassRequestApprovePatch({
        activeStage: "Approval 1",
        actorUserId: "APP-01",
        actorUsername: "user.one",
        remark: "Looks good",
    });

    assert.equal(patch.approval_1_status, "APPROVED");
    assert.equal(patch.approval_1_remark, "Looks good");
    assert.ok(patch.approval_1_at && typeof patch.approval_1_at === "object");
    assert.equal(patch.status, "Submit");
    assert.equal(patch.assigned_to, "Approval 2");
});

test("buildMassRequestApprovePatch for Approval 2 advances to Approval 3", () => {
    const patch = buildMassRequestApprovePatch({
        activeStage: "Approval 2",
        actorUserId: "APP-02",
        actorUsername: "user.two",
        remark: "Approved, forward to MDM",
    });

    assert.equal(patch.approval_2_status, "APPROVED");
    assert.equal(patch.approval_2_remark, "Approved, forward to MDM");
    assert.ok(patch.approval_2_at && typeof patch.approval_2_at === "object");
    assert.equal(patch.status, "Submit");
    assert.equal(patch.assigned_to, "Approval 3");
    assert.equal(patch.approval_3_status, "WAITING");
});

test("buildMassRequestApprovePatch for Approval 3 completes the batch", () => {
    const patch = buildMassRequestApprovePatch({
        activeStage: "Approval 3",
        actorUserId: "APP-03",
        actorUsername: "user.three",
        remark: "Final approval",
    });

    assert.equal(patch.approval_3_status, "APPROVED");
    assert.equal(patch.approval_3_remark, "Final approval");
    assert.ok(patch.approval_3_at && typeof patch.approval_3_at === "object");
    assert.equal(patch.status, "DONE");
    assert.equal(patch.assigned_to, "Completed");
});

test("buildMassRequestApprovePatch handles null remark", () => {
    const patch = buildMassRequestApprovePatch({
        activeStage: "Approval 1",
        actorUserId: "APP-01",
        actorUsername: "user.one",
        remark: null,
    });

    assert.equal(patch.approval_1_status, "APPROVED");
    assert.equal(patch.approval_1_remark, null);
});

// ---------------------------------------------------------------------------
// buildMassRequestReworkPatch
// ---------------------------------------------------------------------------
test("buildMassRequestReworkPatch returns rework patch with reason", () => {
    const patch = buildMassRequestReworkPatch({
        activeStage: "Approval 1",
        actorUserId: "APP-01",
        reason: "Need more details",
    });

    assert.equal(patch.status, "Rework");
    assert.equal(patch.assigned_to, "Requester");
    assert.equal(patch.approval_1_status, "REWORK");
    assert.equal(patch.approval_1_remark, "Need more details");
    assert.ok(patch.approval_1_at && typeof patch.approval_1_at === "object");
});

test("buildMassRequestReworkPatch throws on missing reason", () => {
    assert.throws(
        () =>
            buildMassRequestReworkPatch({
                activeStage: "Approval 1",
                actorUserId: "APP-01",
                reason: "   ",
            }),
        /rework reason is required/i
    );
});

test("buildMassRequestReworkPatch maps to Approval 2 stage prefix", () => {
    const patch = buildMassRequestReworkPatch({
        activeStage: "Approval 2",
        actorUserId: "APP-02",
        reason: "Incorrect data",
    });

    assert.equal(patch.approval_2_status, "REWORK");
    assert.equal(patch.approval_2_remark, "Incorrect data");
});

// ---------------------------------------------------------------------------
// buildMassRequestRejectPatch
// ---------------------------------------------------------------------------
test("buildMassRequestRejectPatch returns cancel patch", () => {
    const patch = buildMassRequestRejectPatch({
        activeStage: "Approval 1",
        reason: "Not needed",
    });

    assert.equal(patch.status, "CANCEL");
    assert.equal(patch.assigned_to, "Cancelled");
    assert.equal(patch.approval_1_status, "REJECTED");
    assert.equal(patch.approval_1_remark, "Not needed");
    assert.ok(patch.approval_1_at && typeof patch.approval_1_at === "object");
});

test("buildMassRequestRejectPatch throws on missing reason", () => {
    assert.throws(
        () =>
            buildMassRequestRejectPatch({
                activeStage: "Approval 1",
                reason: "",
            }),
        /reject reason is required/i
    );
});

// ---------------------------------------------------------------------------
// Model method structural assertions (following existing test patterns)
// ---------------------------------------------------------------------------
test("approveMassRequest wraps updates in a transaction", () => {
    const source = Material.approveMassRequest.toString();
    assert.match(source, /BEGIN/);
    assert.match(source, /COMMIT/);
    assert.match(source, /ROLLBACK/);
    assert.match(source, /FOR UPDATE OF i/);
});

test("requestMassRequestRework wraps updates in a transaction", () => {
    const source = Material.requestMassRequestRework.toString();
    assert.match(source, /BEGIN/);
    assert.match(source, /COMMIT/);
    assert.match(source, /ROLLBACK/);
});

test("rejectMassRequestByAdmin wraps updates in a transaction", () => {
    const source = Material.rejectMassRequestByAdmin.toString();
    assert.match(source, /BEGIN/);
    assert.match(source, /COMMIT/);
    assert.match(source, /ROLLBACK/);
});

test("getMassRequestApprovalInbox returns data via controller", () => {
    const source = MaterialController.getMassRequestApprovalInbox.toString();
    assert.match(source, /getMassRequestApprovalInbox/);
    assert.match(source, /cookies/i);
});

test("approveMassRequest controller reads params and body", () => {
    const source = MaterialController.approveMassRequest.toString();
    assert.match(source, /req\.params\.id/);
    assert.match(source, /req\.cookies/);
    assert.match(source, /req\.body/);
});

test("requestMassRequestRework controller reads params and body", () => {
    const source = MaterialController.requestMassRequestRework.toString();
    assert.match(source, /req\.params\.id/);
    assert.match(source, /req\.body/);
});

test("rejectMassRequest controller reads params and body", () => {
    const source = MaterialController.rejectMassRequest.toString();
    assert.match(source, /req\.params\.id/);
    assert.match(source, /req\.body/);
});
