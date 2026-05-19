const assert = require("node:assert/strict");
const test = require("node:test");
const Material = require("../models/MaterialModel");
const MaterialController = require("../controllers/MaterialController");
const {
  buildRequesterApprovalMaster,
  buildSingleRequestApprovalSnapshot,
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
