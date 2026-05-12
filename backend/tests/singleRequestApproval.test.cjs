const assert = require("node:assert/strict");
const test = require("node:test");

const {
    MDM_MATERIAL_GROUP_NAME,
    buildInitialSingleRequestApproval,
    buildLoginUserGroupInfo,
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
