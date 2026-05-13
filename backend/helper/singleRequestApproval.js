const MDM_MATERIAL_GROUP_NAME = "MDM_MATERIAL";
const INITIAL_APPROVAL_STATUS = "WAITING";
const ADMIN_APPROVER_USERNAME = "ADMIN";

const normalizeUsername = value => String(value || "").trim().toUpperCase();

// Temporary material-approval fallback: normalized username ADMIN, not a generic admin-role check.
const isAdminMaterialApprover = username =>
    normalizeUsername(username) === ADMIN_APPROVER_USERNAME;

const resolveSingleRequestApprovalStage = (approval = {}) => {
    const approval1Status = approval.approval_1_status;
    const approval2Status = approval.approval_2_status;
    const approval3Status = approval.approval_3_status;

    if (!approval1Status || approval1Status === INITIAL_APPROVAL_STATUS) {
        return "Approval 1";
    }

    if (approval1Status === "APPROVED" && (!approval2Status || approval2Status === INITIAL_APPROVAL_STATUS)) {
        return "Approval 2";
    }

    if (
        approval1Status === "APPROVED" &&
        approval2Status === "APPROVED" &&
        (!approval3Status || approval3Status === INITIAL_APPROVAL_STATUS)
    ) {
        return "Approval 3";
    }

    return null;
};

const isSingleRequestApprovalInboxEligible = (approval = {}) =>
    ["Approval 1", "Approval 2"].includes(
        resolveSingleRequestApprovalStage(approval)
    );

const getUniqueGroupNames = rows => {
    const names = rows
        .map(row => row.user_group_name)
        .filter(Boolean)
        .map(name => String(name).trim())
        .filter(Boolean);

    return [...new Set(names)];
};

const buildLoginUserGroupInfo = (pageAccessRows = [], userGroupId = null) => {
    const groupNames = getUniqueGroupNames(pageAccessRows);

    return {
        group_name: groupNames[0] || null,
        group_names: groupNames,
        user_group: {
            id: userGroupId,
            names: groupNames,
            is_mdm_material: groupNames.includes(MDM_MATERIAL_GROUP_NAME),
        },
    };
};

const buildInitialSingleRequestApproval = ({ requestId, requesterUserId }) => {
    if (!requestId) {
        throw new Error("requestId is required");
    }

    if (!requesterUserId) {
        throw new Error("requesterUserId is required");
    }

    return {
        request_id: requestId,
        requester_user_id: requesterUserId,
        approval_1_status: INITIAL_APPROVAL_STATUS,
    };
};

module.exports = {
    ADMIN_APPROVER_USERNAME,
    INITIAL_APPROVAL_STATUS,
    MDM_MATERIAL_GROUP_NAME,
    buildInitialSingleRequestApproval,
    buildLoginUserGroupInfo,
    isAdminMaterialApprover,
    isSingleRequestApprovalInboxEligible,
    normalizeUsername,
    resolveSingleRequestApprovalStage,
};
