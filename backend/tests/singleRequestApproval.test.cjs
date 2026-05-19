const assert = require("node:assert/strict");
const test = require("node:test");
const Material = require("../models/MaterialModel");
const MaterialController = require("../controllers/MaterialController");
const {
  buildRequesterApprovalMaster,
  buildSingleRequestApprovalSnapshot,
  filterSingleRequestApprovalInboxRows,
  isSingleRequestApprovalInboxEligible,
} = require("../helper/singleRequestApproval");

test("buildRequesterApprovalMaster returns requester-based master data", () => {
  const approval = buildRequesterApprovalMaster({
    requesterUserId: "USER-BUDI",
    approval1UserId: "USER-APPROVER-01",
    approval2UserId: "USER-APPROVER-02",
  });
  assert.deepEqual(approval, {
    requester_user_id: "USER-BUDI",
    approval_1_user_id: "USER-APPROVER-01",
    approval_2_user_id: "USER-APPROVER-02",
    approval_3_type: "SYSTEM",
    approval_3_group: "MDM_MATERIAL",
  });
});

test("buildSingleRequestApprovalSnapshot copies master assignees into request columns", () => {
  const snapshot = buildSingleRequestApprovalSnapshot({
    requesterUserId: "USER-BUDI",
    approvalMaster: {
      approval_1_user_id: "USER-APPROVER-01",
      approval_2_user_id: "USER-APPROVER-02",
    },
  });
  assert.equal(snapshot.approval_1_user_id, "USER-APPROVER-01");
  assert.equal(snapshot.approval_1_status, "WAITING");
  assert.equal(snapshot.approval_2_user_id, "USER-APPROVER-02");
  assert.equal(snapshot.approval_3_user_id, null);
});

test("createSingleRequest query includes approval columns on mat_single_request", () => {
  assert.match(Material.__private.CREATE_SINGLE_REQUEST_INSERT_QUERY, /approval_1_user_id/i);
  assert.match(Material.__private.CREATE_SINGLE_REQUEST_INSERT_QUERY, /approval_2_user_id/i);
});

test("createSingleRequest query stores material_group_id instead of material_group_code", () => {
  assert.match(Material.__private.CREATE_SINGLE_REQUEST_INSERT_QUERY, /material_group_id/i);
  assert.doesNotMatch(Material.__private.CREATE_SINGLE_REQUEST_INSERT_QUERY, /material_group_code/i);
});

test("getAdministratorApproverMasters query includes master join and lock metadata", () => {
  assert.match(Material.__private.GET_ADMINISTRATOR_APPROVER_MASTERS_QUERY, /LEFT JOIN mat_single_request_approval/i);
  assert.match(Material.__private.GET_ADMINISTRATOR_APPROVER_MASTERS_QUERY, /active_request_count/i);
});

test("getSingleRequestApprovalInbox query no longer joins mat_single_request_approval", () => {
  assert.doesNotMatch(Material.__private.GET_SINGLE_REQUEST_APPROVAL_INBOX_QUERY, /LEFT JOIN mat_single_request_approval a/i);
});

test("getSingleRequestApprovalInbox query reads group code through the id join", () => {
  assert.match(
    Material.__private.GET_SINGLE_REQUEST_APPROVAL_INBOX_QUERY,
    /LEFT JOIN mat_item_group mig ON mig\.id = r\.material_group_id/i
  );
  assert.match(
    Material.__private.GET_SINGLE_REQUEST_APPROVAL_INBOX_QUERY,
    /mig\.code AS material_group_code/i
  );
});

test("getSingleRequestApprovalInbox query includes subgroup fields for approval detail dialog", () => {
  assert.match(
    Material.__private.GET_SINGLE_REQUEST_APPROVAL_INBOX_QUERY,
    /LEFT JOIN mat_item_sub_group mis ON mis\.id = r\.material_sub_group_id/i
  );
  assert.match(
    Material.__private.GET_SINGLE_REQUEST_APPROVAL_INBOX_QUERY,
    /mis\.code AS material_sub_group_code/i
  );
  assert.match(
    Material.__private.GET_SINGLE_REQUEST_APPROVAL_INBOX_QUERY,
    /mis\.name AS material_sub_group_name/i
  );
});

test("getSingleRequests list query reads approval snapshot from mat_single_request", () => {
  assert.doesNotMatch(Material.__private.GET_SINGLE_REQUEST_LIST_QUERY, /LEFT JOIN mat_single_request_approval a/i);
  assert.match(Material.__private.GET_SINGLE_REQUEST_LIST_QUERY, /r\.approval_1_user_id/i);
  assert.match(Material.__private.GET_SINGLE_REQUEST_LIST_QUERY, /r\.approval_2_status/i);
  assert.match(Material.__private.GET_SINGLE_REQUEST_LIST_QUERY, /r\.approval_3_status/i);
});

test("getSingleRequests list query reads group code through the id join", () => {
  assert.match(
    Material.__private.GET_SINGLE_REQUEST_LIST_QUERY,
    /LEFT JOIN mat_item_group mig ON mig\.id = r\.material_group_id/i
  );
  assert.match(
    Material.__private.GET_SINGLE_REQUEST_LIST_QUERY,
    /mig\.code AS material_group_code/i
  );
});

test("getSingleRequests list query joins mst_user only once", () => {
  const joinMatches =
    Material.__private.GET_SINGLE_REQUEST_LIST_QUERY.match(
      /LEFT JOIN mst_user u ON u\.user_id = r\.created_by/gi
    ) || [];

  assert.equal(joinMatches.length, 1);
});

test("approval assignment workflow syncs mat_single_request snapshot", () => {
  assert.match(
    Material.assignSingleRequestApproversByAdmin.toString(),
    /syncSingleRequestApprovalSnapshot/
  );
  assert.doesNotMatch(
    Material.assignSingleRequestApproversByAdmin.toString(),
    /UPDATE mat_single_request_approval/i
  );
  assert.match(
    Material.assignSingleRequestApproversByAdmin.toString(),
    /UPDATE mat_single_request/i
  );
});

test("approval action workflow syncs mat_single_request snapshot", () => {
  assert.match(
    Material.approveSingleRequestByAdmin.toString(),
    /syncSingleRequestApprovalSnapshot/
  );
  assert.doesNotMatch(
    Material.approveSingleRequestByAdmin.toString(),
    /UPDATE mat_single_request_approval/i
  );
  assert.match(
    Material.approveSingleRequestByAdmin.toString(),
    /UPDATE mat_single_request/i
  );
});

test("locked approval snapshot query reads runtime approval data from mat_single_request", () => {
  assert.doesNotMatch(
    Material.__private.LOCKED_SINGLE_REQUEST_APPROVAL_SNAPSHOT_QUERY,
    /LEFT JOIN mat_single_request_approval/i
  );
  assert.doesNotMatch(
    Material.__private.LOCKED_SINGLE_REQUEST_APPROVAL_SNAPSHOT_QUERY,
    /approval_request_id/i
  );
  assert.match(
    Material.__private.LOCKED_SINGLE_REQUEST_APPROVAL_SNAPSHOT_QUERY,
    /r\.created_by AS requester_user_id/i
  );
  assert.match(
    Material.__private.LOCKED_SINGLE_REQUEST_APPROVAL_SNAPSHOT_QUERY,
    /r\.approval_1_status/i
  );
});

test("approval 3 assignment workflow updates mat_single_request runtime columns", () => {
  assert.doesNotMatch(
    Material.assignSingleRequestApproval3FromMdm.toString(),
    /UPDATE mat_single_request_approval/i
  );
  assert.match(
    Material.assignSingleRequestApproval3FromMdm.toString(),
    /UPDATE mat_single_request/i
  );
});

test("administrator approver master workflow updates active requests retroactively", () => {
  assert.match(
    Material.updateAdministratorApproverMaster.toString(),
    /buildAdministratorAssignmentDecision/
  );
  assert.match(
    Material.updateAdministratorApproverMaster.toString(),
    /syncSingleRequestApprovalSnapshot/
  );
  assert.doesNotMatch(
    Material.updateAdministratorApproverMaster.toString(),
    /getLockedSingleRequestApprovalSnapshot/
  );
  assert.doesNotMatch(
    Material.updateAdministratorApproverMaster.toString(),
    /WHERE request_id = \$1/
  );
});

test("controller preserves partial approver-master payload fields", () => {
  assert.match(
    MaterialController.assignSingleRequestApproverMaster.toString(),
    /hasOwnProperty/
  );
});

test("controller exports requester master handlers", () => {
  assert.equal(typeof MaterialController.assignSingleRequestApproverMaster, "function");
  assert.equal(typeof MaterialController.getSingleRequestApproverMasters, "function");
});

test("createSingleRequest controller validates subgroup membership with item_group_id", () => {
  assert.match(MaterialController.createSingleRequest.toString(), /subgroup\.item_group_id/);
  assert.match(MaterialController.createSingleRequest.toString(), /materialGroup\.id/);
  assert.doesNotMatch(
    MaterialController.createSingleRequest.toString(),
    /subgroup\.group_code[\s\S]*materialGroupCode/
  );
});

test("approval inbox eligibility includes Approval 3 waiting rows", () => {
  assert.equal(
    isSingleRequestApprovalInboxEligible({
      approval_1_status: "APPROVED",
      approval_2_status: "APPROVED",
      approval_3_status: "WAITING",
      status: "Submit",
    }),
    true
  );
});

test("approval inbox keeps final status rows for admin dataset", () => {
  assert.equal(
    isSingleRequestApprovalInboxEligible({
      approval_1_status: "APPROVED",
      approval_2_status: "APPROVED",
      approval_3_status: "APPROVED",
      status: "Done",
    }),
    true
  );
});

test("approval inbox filters Approval 3 rows by approval_3_user_id for non-admin users", () => {
  const rows = [
    {
      id: 1,
      status: "Submit",
      approval_1_status: "APPROVED",
      approval_2_status: "APPROVED",
      approval_3_status: "WAITING",
      approval_3_user_id: "MDM-01",
    },
    {
      id: 2,
      status: "Submit",
      approval_1_status: "APPROVED",
      approval_2_status: "APPROVED",
      approval_3_status: "WAITING",
      approval_3_user_id: "MDM-02",
    },
  ];

  assert.deepEqual(
    filterSingleRequestApprovalInboxRows(rows, {
      actorUserId: "MDM-01",
      actorUsername: "mdm.user",
    }).map(row => row.id),
    [1]
  );
});

test("approval inbox admin sees all eligible rows regardless of active stage", () => {
  const rows = [
    {
      id: 10,
      status: "Submit",
      approval_1_status: "WAITING",
      approval_2_status: null,
      approval_3_status: null,
      approval_1_user_id: "APP-1",
    },
    {
      id: 11,
      status: "Done",
      approval_1_status: "APPROVED",
      approval_2_status: "APPROVED",
      approval_3_status: "APPROVED",
      approval_3_user_id: "MDM-01",
    },
  ];

  assert.deepEqual(
    filterSingleRequestApprovalInboxRows(rows, {
      actorUserId: "ADMIN-01",
      actorUsername: "ADMIN",
    }).map(row => row.id),
    [10, 11]
  );
});
