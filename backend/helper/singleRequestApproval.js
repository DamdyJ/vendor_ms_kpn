const MDM_MATERIAL_GROUP_NAME = "MDM_MATERIAL";
const INITIAL_APPROVAL_STATUS = "WAITING";
const ADMIN_APPROVER_USERNAME = "ADMIN";
const COMPLETED_SINGLE_REQUEST_ASSIGNMENT = "Completed";
const SQL_NOW_EXPRESSION = Object.freeze({ __sql: "NOW()" });

const normalizeUsername = value => String(value || "").trim().toUpperCase();
const normalizeApprovalStatus = value => {
    const normalized = normalizeUsername(value);

    if (!normalized) {
        return INITIAL_APPROVAL_STATUS;
    }

    if (normalized === "REJECT") {
        return "REJECTED";
    }

    return normalized;
};

const canEditApprovalAssignee = value =>
    normalizeApprovalStatus(value) === INITIAL_APPROVAL_STATUS;

const getUserGroupNames = user => {
    if (!user) {
        return [];
    }

    const values = Array.isArray(user.group_names)
        ? user.group_names
        : [user.group_name, user.user_group_name];

    return [...new Set(values.map(normalizeUsername).filter(Boolean))];
};

const isActiveUser = user => Boolean(user && user.is_active);
const isMdmMaterialUser = user =>
    getUserGroupNames(user).includes(MDM_MATERIAL_GROUP_NAME);

const getUserById = (usersById = {}, userId) => usersById[userId] || null;
const normalizeAssigneeValue = value => value || null;
const isApprovalFlowActiveForAutomaticAssignment = (approval = {}) => {
    const approval1Status = normalizeApprovalStatus(approval.approval_1_status);
    const approval2Status = normalizeApprovalStatus(approval.approval_2_status);
    const approval3Status = normalizeApprovalStatus(approval.approval_3_status);

    return (
        approval1Status === INITIAL_APPROVAL_STATUS ||
        (approval1Status === "APPROVED" &&
            approval2Status === INITIAL_APPROVAL_STATUS) ||
        (approval1Status === "APPROVED" &&
            approval2Status === "APPROVED" &&
            approval3Status === INITIAL_APPROVAL_STATUS)
    );
};

const assertManualApprover = ({ userId, label, usersById }) => {
    if (!userId) {
        return;
    }

    const user = getUserById(usersById, userId);

    if (!isActiveUser(user)) {
        throw new Error(`${label} must be an active user`);
    }

    if (isMdmMaterialUser(user)) {
        throw new Error(`${label} cannot be an MDM_MATERIAL user`);
    }
};

const pickApproval3Candidate = ({
    approval1UserId,
    approval2UserId,
    approval3Candidates = [],
    randomIndex = 0,
    usersById = {},
}) => {
    const excludedUserIds = new Set([approval1UserId, approval2UserId].filter(Boolean));
    const candidates = approval3Candidates.filter(candidateUserId => {
        if (!candidateUserId || excludedUserIds.has(candidateUserId)) {
            return false;
        }

        const user = getUserById(usersById, candidateUserId);
        return isActiveUser(user) && isMdmMaterialUser(user);
    });

    if (!candidates.length) {
        throw new Error(
            "No valid approval 3 candidates remain after excluding approval 1 and approval 2"
        );
    }

    const index = Number.isInteger(randomIndex) ? randomIndex : 0;
    return candidates[((index % candidates.length) + candidates.length) % candidates.length];
};

// Temporary material-approval fallback: normalized username ADMIN, not a generic admin-role check.
const isAdminMaterialApprover = username =>
    normalizeUsername(username) === ADMIN_APPROVER_USERNAME;

const matchesActorUserId = (assigneeUserId, actorUserId) =>
    assigneeUserId != null &&
    actorUserId != null &&
    String(assigneeUserId) === String(actorUserId);

const assertRequiredActionReason = (reason, actionLabel = "action") => {
    if (!String(reason || "").trim()) {
        const error = new Error(`${actionLabel} reason is required`);
        error.statusCode = 400;
        error.code = `${String(actionLabel || "action")
            .trim()
            .toUpperCase()}_REASON_REQUIRED`;
        error.errors = [
            {
                fieldKey: "reason",
                message: `${actionLabel} reason is required`,
            },
        ];
        throw error;
    }

    return String(reason).trim();
};

const getApprovalStageFieldPrefix = stage => {
    if (stage === "Approval 1") {
        return "approval_1";
    }

    if (stage === "Approval 2") {
        return "approval_2";
    }

    if (stage === "Approval 3") {
        return "approval_3";
    }

    throw new Error(`Unsupported approval stage: ${stage}`);
};

const resolveSingleRequestApprovalStage = (approval = {}) => {
    const approval1Status = normalizeApprovalStatus(approval.approval_1_status);
    const approval2Status = normalizeApprovalStatus(approval.approval_2_status);
    const approval3Status = normalizeApprovalStatus(approval.approval_3_status);

    if (approval1Status === INITIAL_APPROVAL_STATUS) {
        return "Approval 1";
    }

    if (approval1Status === "APPROVED" && approval2Status === INITIAL_APPROVAL_STATUS) {
        return "Approval 2";
    }

    if (
        approval1Status === "APPROVED" &&
        approval2Status === "APPROVED" &&
        approval3Status === INITIAL_APPROVAL_STATUS
    ) {
        return "Approval 3";
    }

    return null;
};

const resolveSingleRequestHeaderAssignment = (approval = {}) => {
    const stage = resolveSingleRequestApprovalStage(approval);

    if (stage) {
        return stage;
    }

    const approval1Status = normalizeApprovalStatus(approval.approval_1_status);
    const approval2Status = normalizeApprovalStatus(approval.approval_2_status);
    const approval3Status = normalizeApprovalStatus(approval.approval_3_status);

    if (
        approval1Status === "APPROVED" &&
        approval2Status === "APPROVED" &&
        approval3Status === "APPROVED"
    ) {
        return COMPLETED_SINGLE_REQUEST_ASSIGNMENT;
    }

    return null;
};

const isSingleRequestApprovalInboxEligible = (approval = {}) =>
    Boolean(resolveSingleRequestApprovalStage(approval)) ||
    isRequestStatusVisibleInApprovalList(approval.status);

const isRequestStatusVisibleInApprovalList = status =>
    ["SUBMIT", "REWORK", "REJECT", "REJECTED", "CANCEL", "DONE"].includes(
        normalizeUsername(status)
    );

const isRejectedStageVisibleForActor = (row = {}, actorUserId) =>
    [1, 2, 3].some(step => {
        const status = normalizeApprovalStatus(row[`approval_${step}_status`]);
        return (
            status === "REJECTED" &&
            matchesActorUserId(row[`approval_${step}_user_id`], actorUserId)
        );
    });

const filterSingleRequestApprovalInboxRows = (
    rows = [],
    { actorUserId, actorUsername } = {}
) => {
    const isAdmin = isAdminMaterialApprover(actorUsername);

    return rows.filter(row => {
        if (!isSingleRequestApprovalInboxEligible(row)) {
            return false;
        }

        if (isAdmin) {
            return true;
        }

        const stage = resolveSingleRequestApprovalStage(row);

        if (stage === "Approval 1") {
            return matchesActorUserId(row.approval_1_user_id, actorUserId);
        }

        if (stage === "Approval 2") {
            return matchesActorUserId(row.approval_2_user_id, actorUserId);
        }

        if (stage === "Approval 3") {
            return matchesActorUserId(row.approval_3_user_id, actorUserId);
        }

        if (isRejectedStageVisibleForActor(row, actorUserId)) {
            return true;
        }

        return false;
    });
};

const canActorApproveSingleRequestStage = ({
    approval = {},
    actorUserId,
    actorUsername,
} = {}) => {
    if (isAdminMaterialApprover(actorUsername)) {
        return true;
    }

    const stage = resolveSingleRequestApprovalStage(approval);

    if (stage === "Approval 1") {
        return matchesActorUserId(approval.approval_1_user_id, actorUserId);
    }

    if (stage === "Approval 2") {
        return matchesActorUserId(approval.approval_2_user_id, actorUserId);
    }

    if (stage === "Approval 3") {
        return matchesActorUserId(approval.approval_3_user_id, actorUserId);
    }

    return false;
};

const buildSingleRequestReworkPatch = ({
    reworkStage,
    actorUserId,
    reason,
} = {}) => {
    const safeReason = assertRequiredActionReason(reason, "rework");
    const fieldPrefix = getApprovalStageFieldPrefix(reworkStage);

    return {
        status: "Rework",
        assigned_to: "Requester",
        rework_stage: reworkStage,
        rework_by_user_id: actorUserId ?? null,
        rework_at: SQL_NOW_EXPRESSION,
        rework_reason: safeReason,
        [`${fieldPrefix}_status`]: "REWORK",
        [`${fieldPrefix}_remark`]: safeReason,
    };
};

const buildSingleRequestRevisedPatch = reworkStage => {
    const fieldPrefix = getApprovalStageFieldPrefix(reworkStage);

    return {
        status: "Submit",
        assigned_to: reworkStage,
        [`${fieldPrefix}_status`]: INITIAL_APPROVAL_STATUS,
        [`${fieldPrefix}_at`]: null,
    };
};

const buildSingleRequestRejectPatch = ({ rejectStage, reason } = {}) => {
    const safeReason = assertRequiredActionReason(reason, "reject");
    const fieldPrefix = getApprovalStageFieldPrefix(rejectStage);

    return {
        status: "CANCEL",
        assigned_to: "Cancelled",
        [`${fieldPrefix}_status`]: "REJECTED",
        [`${fieldPrefix}_at`]: SQL_NOW_EXPRESSION,
        [`${fieldPrefix}_remark`]: safeReason,
    };
};

const canActorReviseSingleRequest = ({
    request = {},
    actorUserId,
    actorUsername,
} = {}) =>
    isAdminMaterialApprover(actorUsername) ||
    matchesActorUserId(
        request.requester_user_id ?? request.created_by,
        actorUserId
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

const buildRequesterApprovalMaster = ({
    requesterUserId,
    approval1UserId = null,
    approval2UserId = null,
} = {}) => {
    if (!requesterUserId) {
        throw new Error("requesterUserId is required");
    }

    return {
        requester_user_id: requesterUserId,
        approval_1_user_id: normalizeAssigneeValue(approval1UserId),
        approval_2_user_id: normalizeAssigneeValue(approval2UserId),
        approval_3_type: "SYSTEM",
        approval_3_group: MDM_MATERIAL_GROUP_NAME,
    };
};

const buildSingleRequestApprovalSnapshot = ({
    requesterUserId,
    requesterUsername,
    approvalMaster,
} = {}) => ({
    requester_user_id: requesterUserId,
    approval_1_user_id: normalizeAssigneeValue(
        approvalMaster?.approval_1_user_id
    ) ??
        (isAdminMaterialApprover(requesterUsername)
            ? normalizeAssigneeValue(requesterUserId)
            : null),
    approval_1_status: INITIAL_APPROVAL_STATUS,
    approval_1_at: null,
    approval_1_remark: null,
    approval_2_user_id: normalizeAssigneeValue(
        approvalMaster?.approval_2_user_id
    ) ??
        (isAdminMaterialApprover(requesterUsername)
            ? normalizeAssigneeValue(requesterUserId)
            : null),
    approval_2_status: null,
    approval_2_at: null,
    approval_2_remark: null,
    approval_3_user_id: null,
    approval_3_status: null,
    approval_3_at: null,
    approval_3_remark: null,
});

const buildAutoAssignedApproval3 = ({ approval3UserId }) => {
    if (!approval3UserId) {
        throw new Error("approval3UserId is required");
    }

    return {
        approval_3_user_id: approval3UserId,
        approval_3_status: INITIAL_APPROVAL_STATUS,
        assigned_to: "Approval 3",
        next_stage: "Approval 3",
    };
};

const buildAdministratorAssignmentDecision = ({
    snapshot = {},
    patch = {},
    usersById = {},
    approval3Candidates = [],
    randomIndex = 0,
} = {}) => {
    const nextApproval1UserId = Object.prototype.hasOwnProperty.call(
        patch,
        "approval_1_user_id"
    )
        ? normalizeAssigneeValue(patch.approval_1_user_id)
        : normalizeAssigneeValue(snapshot.approval_1_user_id);
    const nextApproval2UserId = Object.prototype.hasOwnProperty.call(
        patch,
        "approval_2_user_id"
    )
        ? normalizeAssigneeValue(patch.approval_2_user_id)
        : normalizeAssigneeValue(snapshot.approval_2_user_id);
    const approval1Changed =
        Object.prototype.hasOwnProperty.call(patch, "approval_1_user_id") &&
        patch.approval_1_user_id !== snapshot.approval_1_user_id;
    const approval2Changed =
        Object.prototype.hasOwnProperty.call(patch, "approval_2_user_id") &&
        patch.approval_2_user_id !== snapshot.approval_2_user_id;

    if (
        approval1Changed &&
        !canEditApprovalAssignee(snapshot.approval_1_status)
    ) {
        throw new Error(
            "approval 1 assignee can only be changed while status is WAITING"
        );
    }

    if (
        approval2Changed &&
        !canEditApprovalAssignee(snapshot.approval_2_status)
    ) {
        throw new Error(
            "approval 2 assignee can only be changed while status is WAITING"
        );
    }

    assertManualApprover({
        userId: nextApproval1UserId,
        label: "approval 1 assignee",
        usersById,
    });
    assertManualApprover({
        userId: nextApproval2UserId,
        label: "approval 2 assignee",
        usersById,
    });

    if (
        nextApproval1UserId &&
        nextApproval2UserId &&
        nextApproval1UserId === nextApproval2UserId
    ) {
        throw new Error("approval 1 and approval 2 must be different");
    }

    let approval3UserId = normalizeAssigneeValue(snapshot.approval_3_user_id);
    if (
        !approval3UserId &&
        nextApproval1UserId &&
        nextApproval2UserId &&
        isApprovalFlowActiveForAutomaticAssignment(snapshot)
    ) {
        approval3UserId = pickApproval3Candidate({
            approval1UserId: nextApproval1UserId,
            approval2UserId: nextApproval2UserId,
            approval3Candidates,
            randomIndex,
            usersById,
        });
    }

    const approval = {
        ...snapshot,
        approval_1_user_id: nextApproval1UserId,
        approval_2_user_id: nextApproval2UserId,
        approval_3_user_id: approval3UserId,
    };

    return {
        approval_1_user_id: approval.approval_1_user_id,
        approval_2_user_id: approval.approval_2_user_id,
        approval_3_user_id: approval.approval_3_user_id,
        assigned_to: resolveSingleRequestHeaderAssignment(approval),
    };
};

module.exports = {
    ADMIN_APPROVER_USERNAME,
    COMPLETED_SINGLE_REQUEST_ASSIGNMENT,
    INITIAL_APPROVAL_STATUS,
    MDM_MATERIAL_GROUP_NAME,
    assertRequiredActionReason,
    buildAdministratorAssignmentDecision,
    buildAutoAssignedApproval3,
    buildInitialSingleRequestApproval,
    buildRequesterApprovalMaster,
    buildSingleRequestRejectPatch,
    buildSingleRequestRevisedPatch,
    buildSingleRequestReworkPatch,
    buildSingleRequestApprovalSnapshot,
    buildLoginUserGroupInfo,
    canActorApproveSingleRequestStage,
    canActorReviseSingleRequest,
    canEditApprovalAssignee,
    filterSingleRequestApprovalInboxRows,
    getApprovalStageFieldPrefix,
    isAdminMaterialApprover,
    isRequestStatusVisibleInApprovalList,
    isSingleRequestApprovalInboxEligible,
    normalizeApprovalStatus,
    normalizeUsername,
    resolveSingleRequestHeaderAssignment,
    resolveSingleRequestApprovalStage,
};
