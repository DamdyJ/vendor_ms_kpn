const MDM_MATERIAL_GROUP_NAME = "MDM_MATERIAL";
const INITIAL_APPROVAL_STATUS = "WAITING";

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
    INITIAL_APPROVAL_STATUS,
    MDM_MATERIAL_GROUP_NAME,
    buildInitialSingleRequestApproval,
    buildLoginUserGroupInfo,
};
