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
    MDM_MATERIAL_GROUP_NAME,
    buildInitialSingleRequestApproval,
    buildLoginUserGroupInfo,
    isAdminMaterialApprover,
    isSingleRequestApprovalInboxEligible,
    resolveSingleRequestApprovalStage,
} = require("../helper/singleRequestApproval");

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
