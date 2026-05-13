const assert = require("node:assert/strict");
const test = require("node:test");

const {
    MDM_MATERIAL_GROUP_NAME,
    buildInitialSingleRequestApproval,
    buildLoginUserGroupInfo,
    isAdminMaterialApprover,
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
