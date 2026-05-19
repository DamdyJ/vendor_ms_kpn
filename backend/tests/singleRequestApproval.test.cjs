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

test("getAdministratorApproverMasters query includes master join and lock metadata", () => {
  assert.match(Material.__private.GET_ADMINISTRATOR_APPROVER_MASTERS_QUERY, /LEFT JOIN mat_single_request_approval/i);
  assert.match(Material.__private.GET_ADMINISTRATOR_APPROVER_MASTERS_QUERY, /active_request_count/i);
});

test("getSingleRequestApprovalInbox query no longer joins mat_single_request_approval", () => {
  assert.doesNotMatch(Material.__private.GET_SINGLE_REQUEST_APPROVAL_INBOX_QUERY, /LEFT JOIN mat_single_request_approval a/i);
});

test("getSingleRequests list query reads approval snapshot from mat_single_request", () => {
  assert.doesNotMatch(Material.__private.GET_SINGLE_REQUEST_LIST_QUERY, /LEFT JOIN mat_single_request_approval a/i);
  assert.match(Material.__private.GET_SINGLE_REQUEST_LIST_QUERY, /r\.approval_1_user_id/i);
  assert.match(Material.__private.GET_SINGLE_REQUEST_LIST_QUERY, /r\.approval_2_status/i);
  assert.match(Material.__private.GET_SINGLE_REQUEST_LIST_QUERY, /r\.approval_3_status/i);
});

test("approval assignment workflow syncs mat_single_request snapshot", () => {
  assert.match(
    Material.assignSingleRequestApproversByAdmin.toString(),
    /syncSingleRequestApprovalSnapshot/
  );
});

test("approval action workflow syncs mat_single_request snapshot", () => {
  assert.match(
    Material.approveSingleRequestByAdmin.toString(),
    /syncSingleRequestApprovalSnapshot/
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
