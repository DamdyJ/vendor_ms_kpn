const assert = require("node:assert/strict");
const test = require("node:test");
const Material = require("../models/MaterialModel");
const MaterialController = require("../controllers/MaterialController");

/*
 * Implementation note: approval inbox contract
 * - include Approval 1 rows
 * - include Approval 2 rows
 * - exclude Approval 3 rows
 */

const {
    buildAdministratorAssignmentDecision,
    buildAutoApprovedApproval3,
    canEditApprovalAssignee,
    MDM_MATERIAL_GROUP_NAME,
    buildInitialSingleRequestApproval,
    buildLoginUserGroupInfo,
    isAdminMaterialApprover,
    isSingleRequestApprovalInboxEligible,
    resolveSingleRequestHeaderAssignment,
    resolveSingleRequestApprovalStage,
} = require("../helper/singleRequestApproval");
const {
    assertSingleRequestAssignableStatus,
    buildSingleRequestApproverAssignmentPatch,
    INITIAL_SINGLE_REQUEST_APPROVAL_INSERT_QUERY,
    LOCKED_SINGLE_REQUEST_APPROVAL_SNAPSHOT_QUERY,
    mergeInitialSingleRequestApprovalSnapshot,
} = Material.__private || {};
const {
    buildNormalizedSingleRequestFields,
    normalizeRequestFields,
} = MaterialController.__private || {};

test("buildLoginUserGroupInfo maps page access rows into stable login metadata", () => {
    const info = buildLoginUserGroupInfo(
        [
            { user_group_id: "G-MDM", user_group_name: "MDM_MATERIAL" },
            { user_group_id: "G-MDM", user_group_name: "MDM_MATERIAL" },
        ],
        "G-MDM"
    );

    assert.deepEqual(info, {
        group_name: MDM_MATERIAL_GROUP_NAME,
        group_names: [MDM_MATERIAL_GROUP_NAME],
        user_group: {
            id: "G-MDM",
            names: [MDM_MATERIAL_GROUP_NAME],
            is_mdm_material: true,
        },
    });
});

test("buildInitialSingleRequestApproval keeps request id as anchor and requester user id as source", () => {
    const approval = buildInitialSingleRequestApproval({
        requestId: 101,
        requesterUserId: "USER-BUDI",
    });

    assert.deepEqual(approval, {
        request_id: 101,
        requester_user_id: "USER-BUDI",
        approval_1_status: "WAITING",
    });
});

test("buildInitialSingleRequestApproval rejects missing request id", () => {
    assert.throws(
        () =>
            buildInitialSingleRequestApproval({
                requesterUserId: "USER-BUDI",
            }),
        /requestId is required/
    );
});

test("buildAutoApprovedApproval3 finalizes approval 3 immediately after approval 2", () => {
    assert.deepEqual(
        buildAutoApprovedApproval3({
            approval3UserId: "USER-MDM-01",
        }),
        {
            approval_3_user_id: "USER-MDM-01",
            approval_3_status: "APPROVED",
            assigned_to: "Completed",
            next_stage: "Completed",
        }
    );
});

test("buildAdministratorAssignmentDecision auto-assigns approval 3 from MDM candidates and keeps all approvers unique", () => {
    const decision = buildAdministratorAssignmentDecision({
        snapshot: {
            approval_1_user_id: null,
            approval_1_status: null,
            approval_2_user_id: null,
            approval_2_status: null,
            approval_3_user_id: null,
            approval_3_status: null,
        },
        patch: {
            approval_1_user_id: "USER-APPROVER-01",
            approval_2_user_id: "USER-APPROVER-02",
        },
        usersById: {
            "USER-APPROVER-01": {
                id: "USER-APPROVER-01",
                is_active: true,
                group_name: "PROCUREMENT",
            },
            "USER-APPROVER-02": {
                id: "USER-APPROVER-02",
                is_active: true,
                group_name: "SUPPLY_CHAIN",
            },
            "USER-MDM-01": {
                id: "USER-MDM-01",
                is_active: true,
                group_name: MDM_MATERIAL_GROUP_NAME,
            },
            "USER-MDM-02": {
                id: "USER-MDM-02",
                is_active: true,
                group_name: MDM_MATERIAL_GROUP_NAME,
            },
        },
        approval3Candidates: ["USER-APPROVER-01", "USER-MDM-01", "USER-MDM-02"],
        randomIndex: 1,
    });

    assert.equal(decision.approval_1_user_id, "USER-APPROVER-01");
    assert.equal(decision.approval_2_user_id, "USER-APPROVER-02");
    assert.equal(decision.approval_3_user_id, "USER-MDM-02");
    assert.equal(
        new Set([
            decision.approval_1_user_id,
            decision.approval_2_user_id,
            decision.approval_3_user_id,
        ]).size,
        3
    );
    assert.equal(decision.assigned_to, "Approval 1");
});

test("buildAdministratorAssignmentDecision rejects changing approval 1 after it leaves WAITING", () => {
    assert.throws(
        () =>
            buildAdministratorAssignmentDecision({
                snapshot: {
                    approval_1_user_id: "USER-APPROVER-01",
                    approval_1_status: "APPROVED",
                    approval_2_user_id: null,
                    approval_2_status: null,
                    approval_3_user_id: null,
                    approval_3_status: null,
                },
                patch: {
                    approval_1_user_id: "USER-APPROVER-02",
                },
                usersById: {
                    "USER-APPROVER-01": {
                        id: "USER-APPROVER-01",
                        is_active: true,
                        group_name: "PROCUREMENT",
                    },
                    "USER-APPROVER-02": {
                        id: "USER-APPROVER-02",
                        is_active: true,
                        group_name: "SUPPLY_CHAIN",
                    },
                },
                approval3Candidates: [],
                randomIndex: 0,
            }),
        /approval 1 assignee can only be changed while status is WAITING/i
    );
});

test("buildAdministratorAssignmentDecision rejects changing approval 2 after it leaves WAITING", () => {
    assert.throws(
        () =>
            buildAdministratorAssignmentDecision({
                snapshot: {
                    approval_1_user_id: "USER-APPROVER-01",
                    approval_1_status: "APPROVED",
                    approval_2_user_id: "USER-APPROVER-02",
                    approval_2_status: "REWORK",
                    approval_3_user_id: null,
                    approval_3_status: null,
                },
                patch: {
                    approval_2_user_id: "USER-APPROVER-03",
                },
                usersById: {
                    "USER-APPROVER-01": {
                        id: "USER-APPROVER-01",
                        is_active: true,
                        group_name: "PROCUREMENT",
                    },
                    "USER-APPROVER-02": {
                        id: "USER-APPROVER-02",
                        is_active: true,
                        group_name: "SUPPLY_CHAIN",
                    },
                    "USER-APPROVER-03": {
                        id: "USER-APPROVER-03",
                        is_active: true,
                        group_name: "ENGINEERING",
                    },
                },
                approval3Candidates: [],
                randomIndex: 0,
            }),
        /approval 2 assignee can only be changed while status is WAITING/i
    );
});

test("buildAdministratorAssignmentDecision does not auto-assign approval 3 when flow is already terminal", () => {
    const decision = buildAdministratorAssignmentDecision({
        snapshot: {
            approval_1_user_id: "USER-APPROVER-01",
            approval_1_status: "APPROVED",
            approval_2_user_id: "USER-APPROVER-02",
            approval_2_status: "REJECTED",
            approval_3_user_id: null,
            approval_3_status: null,
        },
        patch: {},
        usersById: {
            "USER-APPROVER-01": {
                id: "USER-APPROVER-01",
                is_active: true,
                group_name: "PROCUREMENT",
            },
            "USER-APPROVER-02": {
                id: "USER-APPROVER-02",
                is_active: true,
                group_name: "SUPPLY_CHAIN",
            },
            "USER-MDM-01": {
                id: "USER-MDM-01",
                is_active: true,
                group_name: MDM_MATERIAL_GROUP_NAME,
            },
        },
        approval3Candidates: ["USER-MDM-01"],
        randomIndex: 0,
    });

    assert.equal(decision.approval_3_user_id, null);
    assert.equal(decision.assigned_to, null);
});

test("buildAdministratorAssignmentDecision does not auto-assign approval 3 when approval 3 status is terminal without an assignee", () => {
    const decision = buildAdministratorAssignmentDecision({
        snapshot: {
            approval_1_user_id: "USER-APPROVER-01",
            approval_1_status: "APPROVED",
            approval_2_user_id: "USER-APPROVER-02",
            approval_2_status: "APPROVED",
            approval_3_user_id: null,
            approval_3_status: "REWORK",
        },
        patch: {},
        usersById: {
            "USER-APPROVER-01": {
                id: "USER-APPROVER-01",
                is_active: true,
                group_name: "PROCUREMENT",
            },
            "USER-APPROVER-02": {
                id: "USER-APPROVER-02",
                is_active: true,
                group_name: "SUPPLY_CHAIN",
            },
            "USER-MDM-01": {
                id: "USER-MDM-01",
                is_active: true,
                group_name: MDM_MATERIAL_GROUP_NAME,
            },
        },
        approval3Candidates: ["USER-MDM-01"],
        randomIndex: 0,
    });

    assert.equal(decision.approval_3_user_id, null);
    assert.equal(decision.assigned_to, null);
});

test("buildAdministratorAssignmentDecision normalizes explicit undefined patch values to null", () => {
    const decision = buildAdministratorAssignmentDecision({
        snapshot: {
            approval_1_user_id: "USER-APPROVER-01",
            approval_1_status: null,
            approval_2_user_id: "USER-APPROVER-02",
            approval_2_status: null,
            approval_3_user_id: null,
            approval_3_status: null,
        },
        patch: {
            approval_1_user_id: undefined,
            approval_2_user_id: undefined,
        },
        usersById: {
            "USER-APPROVER-01": {
                id: "USER-APPROVER-01",
                is_active: true,
                group_name: "PROCUREMENT",
            },
            "USER-APPROVER-02": {
                id: "USER-APPROVER-02",
                is_active: true,
                group_name: "SUPPLY_CHAIN",
            },
        },
        approval3Candidates: [],
        randomIndex: 0,
    });

    assert.equal(decision.approval_1_user_id, null);
    assert.equal(decision.approval_2_user_id, null);
    assert.equal(decision.approval_3_user_id, null);
});

test("resolveSingleRequestHeaderAssignment keeps request on Approval 2 when approval 1 is approved and approval 2 is waiting", () => {
    assert.equal(
        resolveSingleRequestHeaderAssignment({
            approval_1_status: "APPROVED",
            approval_2_status: "WAITING",
            approval_3_status: null,
        }),
        "Approval 2"
    );
});

test("canEditApprovalAssignee only returns true for WAITING or null statuses", () => {
    assert.equal(canEditApprovalAssignee(null), true);
    assert.equal(canEditApprovalAssignee("WAITING"), true);
    assert.equal(canEditApprovalAssignee("APPROVED"), false);
    assert.equal(canEditApprovalAssignee("REJECTED"), false);
    assert.equal(canEditApprovalAssignee("REWORK"), false);
});

test("approval snapshot query only locks the base request row", () => {
    assert.equal(
        typeof LOCKED_SINGLE_REQUEST_APPROVAL_SNAPSHOT_QUERY,
        "string"
    );
    assert.match(
        LOCKED_SINGLE_REQUEST_APPROVAL_SNAPSHOT_QUERY,
        /LEFT JOIN mat_single_request_approval a/i
    );
    assert.match(
        LOCKED_SINGLE_REQUEST_APPROVAL_SNAPSHOT_QUERY,
        /r\.status/i
    );
    assert.match(
        LOCKED_SINGLE_REQUEST_APPROVAL_SNAPSHOT_QUERY,
        /FOR UPDATE OF r\b/i
    );
    assert.doesNotMatch(
        LOCKED_SINGLE_REQUEST_APPROVAL_SNAPSHOT_QUERY,
        /FOR UPDATE OF r,\s*a\b/i
    );
    assert.match(
        LOCKED_SINGLE_REQUEST_APPROVAL_SNAPSHOT_QUERY,
        /r\.created_by/i
    );
});

test("approval snapshot backfill query can create missing legacy approval rows", () => {
    assert.equal(typeof INITIAL_SINGLE_REQUEST_APPROVAL_INSERT_QUERY, "string");
    assert.match(
        INITIAL_SINGLE_REQUEST_APPROVAL_INSERT_QUERY,
        /INSERT INTO mat_single_request_approval/i
    );
    assert.match(
        INITIAL_SINGLE_REQUEST_APPROVAL_INSERT_QUERY,
        /ON CONFLICT \(request_id\) DO UPDATE/i
    );
    assert.match(
        INITIAL_SINGLE_REQUEST_APPROVAL_INSERT_QUERY,
        /RETURNING request_id,\s*requester_user_id,\s*approval_1_status/i
    );
});

test("mergeInitialSingleRequestApprovalSnapshot turns a legacy request into Approval 1", () => {
    const snapshot = mergeInitialSingleRequestApprovalSnapshot(
        {
            request_id: 8,
            created_by: "USER-ADMIN",
            approval_request_id: null,
            approval_1_status: null,
            approval_2_status: null,
            approval_3_status: null,
        },
        {
            request_id: 8,
            requester_user_id: "USER-ADMIN",
            approval_1_status: "WAITING",
        }
    );

    assert.equal(snapshot.approval_request_id, 8);
    assert.equal(snapshot.requester_user_id, "USER-ADMIN");
    assert.equal(snapshot.approval_1_status, "WAITING");
    assert.equal(resolveSingleRequestApprovalStage(snapshot), "Approval 1");
});

test("buildSingleRequestApproverAssignmentPatch preserves omitted approval fields", () => {
    assert.deepEqual(
        buildSingleRequestApproverAssignmentPatch({
            approval2UserId: "USER-APPROVER-02",
        }),
        {
            approval_2_user_id: "USER-APPROVER-02",
        }
    );
    assert.deepEqual(
        buildSingleRequestApproverAssignmentPatch({
            approval1UserId: "USER-APPROVER-01",
        }),
        {
            approval_1_user_id: "USER-APPROVER-01",
        }
    );
});

test("assertSingleRequestAssignableStatus rejects requests outside Submit status", () => {
    assert.doesNotThrow(() =>
        assertSingleRequestAssignableStatus({ request_id: 1, status: "Submit" })
    );

    assert.throws(
        () =>
            assertSingleRequestAssignableStatus({
                request_id: 1,
                status: "Approved",
            }),
        error =>
            error.statusCode === 409 &&
            /only be assigned while status is Submit/i.test(error.message)
    );
});

test("isAdminMaterialApprover accepts mixed casing and whitespace around ADMIN and rejects BUDI", () => {
    assert.equal(isAdminMaterialApprover("  adMin  "), true);
    assert.equal(isAdminMaterialApprover("BUDI"), false);
});

test("approval inbox eligibility includes Approval 1 rows", () => {
    assert.equal(
        isSingleRequestApprovalInboxEligible({
            approval_1_status: "WAITING",
            approval_2_status: null,
            approval_3_status: null,
        }),
        true
    );
});

test("approval inbox eligibility includes Approval 2 rows", () => {
    assert.equal(
        isSingleRequestApprovalInboxEligible({
            approval_1_status: "APPROVED",
            approval_2_status: "WAITING",
            approval_3_status: null,
        }),
        true
    );
});

test("approval inbox eligibility excludes Approval 3 rows", () => {
    assert.equal(
        isSingleRequestApprovalInboxEligible({
            approval_1_status: "APPROVED",
            approval_2_status: "APPROVED",
            approval_3_status: "WAITING",
        }),
        false
    );
});

test("approval inbox eligibility excludes fully approved rows", () => {
    assert.equal(
        isSingleRequestApprovalInboxEligible({
            approval_1_status: "APPROVED",
            approval_2_status: "APPROVED",
            approval_3_status: "APPROVED",
        }),
        false
    );
});

test("approval inbox eligibility excludes rejected rows", () => {
    assert.equal(
        isSingleRequestApprovalInboxEligible({
            approval_1_status: "REJECTED",
        }),
        false
    );
    assert.equal(
        isSingleRequestApprovalInboxEligible({
            approval_1_status: "APPROVED",
            approval_2_status: "REJECTED",
        }),
        false
    );
});

test("approval inbox eligibility excludes rework rows", () => {
    assert.equal(
        isSingleRequestApprovalInboxEligible({
            approval_1_status: "REWORK",
        }),
        false
    );
    assert.equal(
        isSingleRequestApprovalInboxEligible({
            approval_1_status: "APPROVED",
            approval_2_status: "REWORK",
        }),
        false
    );
});

test("approval inbox contract rejects non-admin usernames", () => {
    assert.equal(isAdminMaterialApprover("BUDI"), false);
    assert.equal(isAdminMaterialApprover("requestor-01"), false);
});

test("normalizeRequestFields maps long text aliases to canonical request field keys", () => {
    assert.deepEqual(
        normalizeRequestFields({
            longText1: "LINE A",
            longText2: "LINE B",
            longText3: "LINE C",
        }),
        {
            longText1: "LINE A",
            longText2: "LINE B",
            longText3: "LINE C",
            long_text_1: "LINE A",
            long_text_2: "LINE B",
            long_text_3: "LINE C",
        }
    );
});

test("buildNormalizedSingleRequestFields keeps submitted long text after template validation", () => {
    const normalized = buildNormalizedSingleRequestFields({
        requestFields: {
            material_description: "99991",
            base_unit_of_measure: "123",
            plant: "AC01",
            storage_location: "DS01",
            long_text_1: "FIRST LONG TEXT",
            long_text_2: "SECOND LONG TEXT",
            long_text_3: "THIRD LONG TEXT",
        },
        validation: {
            normalizedRequestFields: {
                material_description: "99991",
                base_unit_of_measure: "123",
            },
        },
    });

    assert.equal(normalized.long_text_1, "FIRST LONG TEXT");
    assert.equal(normalized.long_text_2, "SECOND LONG TEXT");
    assert.equal(normalized.long_text_3, "THIRD LONG TEXT");
    assert.equal(normalized.plant, "AC01");
    assert.equal(normalized.storage_location, "DS01");
});

test("getSingleRequestApprovalInbox returns 403 for non-admin actor before model access", async () => {
    const originalGetSingleRequestApprovalInbox =
        Material.getSingleRequestApprovalInbox;
    let modelCalled = false;

    Material.getSingleRequestApprovalInbox = async () => {
        modelCalled = true;
        return [];
    };

    const req = {
        cookies: {
            username: "budi",
        },
    };
    const res = {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        },
    };

    try {
        await MaterialController.getSingleRequestApprovalInbox(req, res);
    } finally {
        Material.getSingleRequestApprovalInbox =
            originalGetSingleRequestApprovalInbox;
    }

    assert.equal(modelCalled, false);
    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.body, {
        success: false,
        message: "Forbidden: approval inbox is only available for ADMIN",
    });
});

test("approveSingleRequest returns 403 for non-admin actor before model access", async () => {
    const originalApproveSingleRequestByAdmin =
        Material.approveSingleRequestByAdmin;
    let modelCalled = false;

    Material.approveSingleRequestByAdmin = async () => {
        modelCalled = true;
        return { request_id: 55 };
    };

    const req = {
        params: { id: "55" },
        cookies: {
            user_id: "USER-BUDI",
            username: "budi",
        },
        body: {
            remark: "approve please",
        },
    };
    const res = {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        },
    };

    try {
        await MaterialController.approveSingleRequest(req, res);
    } finally {
        Material.approveSingleRequestByAdmin = originalApproveSingleRequestByAdmin;
    }

    assert.equal(modelCalled, false);
    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.body, {
        success: false,
        message: "Forbidden: single request approval is only available for ADMIN",
    });
});

test("assignSingleRequestApprovers returns 403 for non-admin actor before model access", async () => {
    const originalAssignSingleRequestApproversByAdmin =
        Material.assignSingleRequestApproversByAdmin;
    let modelCalled = false;

    Material.assignSingleRequestApproversByAdmin = async () => {
        modelCalled = true;
        return { request_id: 55 };
    };

    const req = {
        params: { id: "55" },
        cookies: {
            username: "budi",
        },
        body: {
            approval1UserId: "USER-APPROVER-01",
            approval2UserId: "USER-APPROVER-02",
        },
    };
    const res = {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        },
    };

    try {
        await MaterialController.assignSingleRequestApprovers(req, res);
    } finally {
        Material.assignSingleRequestApproversByAdmin =
            originalAssignSingleRequestApproversByAdmin;
    }

    assert.equal(modelCalled, false);
    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.body, {
        success: false,
        message:
            "Forbidden: single request approver assignment is only available for ADMIN",
    });
});

test("assignSingleRequestApprovers forwards payload to model and returns updated row", async () => {
    const originalAssignSingleRequestApproversByAdmin =
        Material.assignSingleRequestApproversByAdmin;
    let capturedPayload = null;
    const updatedRow = {
        request_id: 55,
        approval_1_user_id: "USER-APPROVER-01",
        approval_1_status: "WAITING",
        approval_2_user_id: "USER-APPROVER-02",
        approval_2_status: null,
        approval_3_user_id: "USER-MDM-01",
        approval_3_status: "WAITING",
        assigned_to: "Approval 1",
    };

    Material.assignSingleRequestApproversByAdmin = async payload => {
        capturedPayload = payload;
        return updatedRow;
    };

    const req = {
        params: { id: "55" },
        cookies: {
            username: " ADMIN ",
        },
        body: {
            approval1UserId: "USER-APPROVER-01",
            approval2UserId: "USER-APPROVER-02",
        },
    };
    const res = {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        },
    };

    try {
        await MaterialController.assignSingleRequestApprovers(req, res);
    } finally {
        Material.assignSingleRequestApproversByAdmin =
            originalAssignSingleRequestApproversByAdmin;
    }

    assert.deepEqual(capturedPayload, {
        requestId: "55",
        actorUsername: " ADMIN ",
        approval1UserId: "USER-APPROVER-01",
        approval2UserId: "USER-APPROVER-02",
    });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {
        success: true,
        message: "Single request approvers assigned successfully",
        data: updatedRow,
    });
});

test("assignSingleRequestApprovers omits absent approval fields before model access", async () => {
    const originalAssignSingleRequestApproversByAdmin =
        Material.assignSingleRequestApproversByAdmin;
    let capturedPayload = null;

    Material.assignSingleRequestApproversByAdmin = async payload => {
        capturedPayload = payload;
        return {
            request_id: 55,
            approval_1_user_id: "USER-APPROVER-01",
            approval_2_user_id: "USER-APPROVER-03",
        };
    };

    const req = {
        params: { id: "55" },
        cookies: {
            username: "ADMIN",
        },
        body: {
            approval2UserId: "USER-APPROVER-03",
        },
    };
    const res = {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        },
    };

    try {
        await MaterialController.assignSingleRequestApprovers(req, res);
    } finally {
        Material.assignSingleRequestApproversByAdmin =
            originalAssignSingleRequestApproversByAdmin;
    }

    assert.equal(
        Object.prototype.hasOwnProperty.call(capturedPayload, "approval1UserId"),
        false
    );
    assert.equal(capturedPayload.approval2UserId, "USER-APPROVER-03");
    assert.equal(res.statusCode, 200);
});

test("assignSingleRequestApprovers returns 404 when model reports missing request", async () => {
    const originalAssignSingleRequestApproversByAdmin =
        Material.assignSingleRequestApproversByAdmin;
    const notFoundError = new Error("Single request not found");
    notFoundError.statusCode = 404;

    Material.assignSingleRequestApproversByAdmin = async () => {
        throw notFoundError;
    };

    const req = {
        params: { id: "99" },
        cookies: {
            username: "ADMIN",
        },
        body: {
            approval1UserId: "USER-APPROVER-01",
            approval2UserId: "USER-APPROVER-02",
        },
    };
    const res = {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        },
    };

    try {
        await MaterialController.assignSingleRequestApprovers(req, res);
    } finally {
        Material.assignSingleRequestApproversByAdmin =
            originalAssignSingleRequestApproversByAdmin;
    }

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, {
        success: false,
        message: "Single request not found",
    });
});

test("assignSingleRequestApprovers returns 409 when model reports assignment conflict", async () => {
    const originalAssignSingleRequestApproversByAdmin =
        Material.assignSingleRequestApproversByAdmin;
    const conflictError = new Error(
        "approval 1 assignee can only be changed while status is WAITING"
    );
    conflictError.statusCode = 409;

    Material.assignSingleRequestApproversByAdmin = async () => {
        throw conflictError;
    };

    const req = {
        params: { id: "77" },
        cookies: {
            username: "ADMIN",
        },
        body: {
            approval1UserId: "USER-APPROVER-03",
            approval2UserId: "USER-APPROVER-02",
        },
    };
    const res = {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        },
    };

    try {
        await MaterialController.assignSingleRequestApprovers(req, res);
    } finally {
        Material.assignSingleRequestApproversByAdmin =
            originalAssignSingleRequestApproversByAdmin;
    }

    assert.equal(res.statusCode, 409);
    assert.deepEqual(res.body, {
        success: false,
        message: "approval 1 assignee can only be changed while status is WAITING",
    });
});

test("approveSingleRequest returns 404 when request is missing", async () => {
    const originalApproveSingleRequestByAdmin =
        Material.approveSingleRequestByAdmin;
    const notFoundError = new Error("Single request not found");
    notFoundError.statusCode = 404;

    Material.approveSingleRequestByAdmin = async () => {
        throw notFoundError;
    };

    const req = {
        params: { id: "99" },
        cookies: {
            user_id: "USER-ADMIN",
            username: "ADMIN",
        },
        body: {
            remark: "approve",
        },
    };
    const res = {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        },
    };

    try {
        await MaterialController.approveSingleRequest(req, res);
    } finally {
        Material.approveSingleRequestByAdmin = originalApproveSingleRequestByAdmin;
    }

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, {
        success: false,
        message: "Single request not found",
    });
});

test("approveSingleRequest returns 409 when request is already processed or not waiting for admin approval", async () => {
    const originalApproveSingleRequestByAdmin =
        Material.approveSingleRequestByAdmin;
    const conflictError = new Error(
        "Single request is already processed or not waiting for admin approval"
    );
    conflictError.statusCode = 409;

    Material.approveSingleRequestByAdmin = async () => {
        throw conflictError;
    };

    const req = {
        params: { id: "77" },
        cookies: {
            user_id: "USER-ADMIN",
            username: " ADMIN ",
        },
        body: {
            remark: "approve",
        },
    };
    const res = {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        },
    };

    try {
        await MaterialController.approveSingleRequest(req, res);
    } finally {
        Material.approveSingleRequestByAdmin = originalApproveSingleRequestByAdmin;
    }

    assert.equal(res.statusCode, 409);
    assert.deepEqual(res.body, {
        success: false,
        message: "Single request is already processed or not waiting for admin approval",
    });
});

test("resolveSingleRequestApprovalStage returns Approval 1 when approval_1_status is WAITING", () => {
    assert.equal(
        resolveSingleRequestApprovalStage({
            approval_1_status: "WAITING",
        }),
        "Approval 1"
    );
});

test("resolveSingleRequestApprovalStage returns Approval 2 when approval_1 approved and approval_2 waiting", () => {
    assert.equal(
        resolveSingleRequestApprovalStage({
            approval_1_status: "APPROVED",
            approval_2_status: "WAITING",
        }),
        "Approval 2"
    );
});

test("resolveSingleRequestApprovalStage returns Approval 3 when approval_1 and approval_2 approved and approval_3 waiting", () => {
    assert.equal(
        resolveSingleRequestApprovalStage({
            approval_1_status: "APPROVED",
            approval_2_status: "APPROVED",
            approval_3_status: "WAITING",
        }),
        "Approval 3"
    );
});

test("resolveSingleRequestApprovalStage returns null when approval flow is fully approved", () => {
    assert.equal(
        resolveSingleRequestApprovalStage({
            approval_1_status: "APPROVED",
            approval_2_status: "APPROVED",
            approval_3_status: "APPROVED",
        }),
        null
    );
});

test("resolveSingleRequestApprovalStage returns null when stage 3 is rejected", () => {
    assert.equal(
        resolveSingleRequestApprovalStage({
            approval_1_status: "APPROVED",
            approval_2_status: "APPROVED",
            approval_3_status: "REJECTED",
        }),
        null
    );
});

test("resolveSingleRequestApprovalStage returns null when stage 3 is rework", () => {
    assert.equal(
        resolveSingleRequestApprovalStage({
            approval_1_status: "APPROVED",
            approval_2_status: "APPROVED",
            approval_3_status: "REWORK",
        }),
        null
    );
});

test("resolveSingleRequestApprovalStage returns null for non-approvable terminal states before stage 3", () => {
    const terminalStates = [
        { approval_1_status: "REJECTED" },
        { approval_1_status: "REWORK" },
        { approval_1_status: "APPROVED", approval_2_status: "REJECTED" },
        { approval_1_status: "APPROVED", approval_2_status: "REWORK" },
    ];

    for (const approval of terminalStates) {
        assert.equal(resolveSingleRequestApprovalStage(approval), null);
    }
});
