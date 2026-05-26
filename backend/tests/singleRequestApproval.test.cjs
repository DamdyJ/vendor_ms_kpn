const assert = require("node:assert/strict");
const test = require("node:test");
const Material = require("../models/MaterialModel");
const MaterialController = require("../controllers/MaterialController");
const db = require("../config/connection");
const MaterialTemplate = require("../models/MaterialTemplateModel");
const {
  buildRequesterApprovalMaster,
  buildSingleRequestApprovalSnapshot,
  buildSingleRequestRejectPatch,
  buildSingleRequestRevisedPatch,
  buildSingleRequestReworkPatch,
  canActorApproveSingleRequestStage,
  canActorReviseSingleRequest,
  filterSingleRequestApprovalInboxRows,
  getApprovalStageFieldPrefix,
  isSingleRequestApprovalInboxEligible,
  assertRequiredActionReason,
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

test("buildSingleRequestApprovalSnapshot auto-assigns admin requester when master approvers are empty", () => {
  const snapshot = buildSingleRequestApprovalSnapshot({
    requesterUserId: "ADMIN-01",
    requesterUsername: "ADMIN",
    approvalMaster: null,
  });

  assert.equal(snapshot.approval_1_user_id, "ADMIN-01");
  assert.equal(snapshot.approval_1_status, "WAITING");
  assert.equal(snapshot.approval_2_user_id, "ADMIN-01");
  assert.equal(snapshot.approval_3_user_id, null);
});

test("assertRequiredActionReason rejects blank reason values", () => {
  assert.throws(
    () => assertRequiredActionReason("   ", "rework"),
    /rework reason is required/i
  );
});

test("getApprovalStageFieldPrefix resolves all supported approval stages", () => {
  assert.equal(getApprovalStageFieldPrefix("Approval 1"), "approval_1");
  assert.equal(getApprovalStageFieldPrefix("Approval 2"), "approval_2");
  assert.equal(getApprovalStageFieldPrefix("Approval 3"), "approval_3");
  assert.throws(
    () => getApprovalStageFieldPrefix("Requester"),
    /Unsupported approval stage/i
  );
});

test("buildSingleRequestReworkPatch marks request for requester rework", () => {
  const patch = buildSingleRequestReworkPatch({
    reworkStage: "Approval 3",
    actorUserId: "APP-03",
    reason: "Need updated attachment",
  });

  assert.equal(patch.status, "Rework");
  assert.equal(patch.assigned_to, "Requester");
  assert.equal(patch.rework_stage, "Approval 3");
  assert.equal(patch.rework_by_user_id, "APP-03");
  assert.equal(patch.rework_reason, "Need updated attachment");
  assert.equal(patch.approval_3_status, "REWORK");
  assert.equal(patch.approval_3_remark, "Need updated attachment");
  assert.ok(patch.rework_at);
});

test("buildSingleRequestRejectPatch marks active approval stage as rejected and cancels request", () => {
  const patch = buildSingleRequestRejectPatch({
    rejectStage: "Approval 2",
    reason: "Material spec tidak sesuai kebutuhan.",
  });

  assert.equal(patch.status, "CANCEL");
  assert.equal(patch.assigned_to, "Cancelled");
  assert.equal(patch.approval_2_status, "REJECTED");
  assert.equal(patch.approval_2_remark, "Material spec tidak sesuai kebutuhan.");
  assert.deepEqual(patch.approval_2_at, { __sql: "NOW()" });
});

test("buildSingleRequestRejectPatch requires reject reason", () => {
  assert.throws(
    () =>
      buildSingleRequestRejectPatch({
        rejectStage: "Approval 1",
        reason: "   ",
      }),
    /reject reason is required/i
  );
});

test("buildSingleRequestRevisedPatch resets only the active rework stage", () => {
  assert.deepEqual(buildSingleRequestRevisedPatch("Approval 2"), {
    status: "Submit",
    assigned_to: "Approval 2",
    approval_2_status: "WAITING",
    approval_2_at: null,
  });
});

test("canActorReviseSingleRequest allows requester and admin only", () => {
  assert.equal(
    canActorReviseSingleRequest({
      request: { created_by: "REQ-01" },
      actorUserId: "REQ-01",
      actorUsername: "requester.user",
    }),
    true
  );
  assert.equal(
    canActorReviseSingleRequest({
      request: { created_by: "REQ-01" },
      actorUserId: "APP-01",
      actorUsername: "approver.user",
    }),
    false
  );
  assert.equal(
    canActorReviseSingleRequest({
      request: { created_by: "REQ-01" },
      actorUserId: "ADMIN-01",
      actorUsername: "ADMIN",
    }),
    true
  );
});

test("canActorApproveSingleRequestStage includes approval 3 assignee", () => {
  assert.equal(
    canActorApproveSingleRequestStage({
      approval: {
        approval_1_status: "APPROVED",
        approval_2_status: "APPROVED",
        approval_3_status: "WAITING",
        approval_3_user_id: "MDM-01",
      },
      actorUserId: "MDM-01",
      actorUsername: "mdm.user",
    }),
    true
  );
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
    /r\.material_group_id/i
  );
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
  assert.match(
    Material.__private.GET_SINGLE_REQUEST_APPROVAL_INBOX_QUERY,
    /r\.rework_stage/i
  );
  assert.match(
    Material.__private.GET_SINGLE_REQUEST_APPROVAL_INBOX_QUERY,
    /r\.rework_reason/i
  );
  assert.match(
    Material.__private.GET_SINGLE_REQUEST_APPROVAL_INBOX_QUERY,
    /TO_CHAR\(r\.rework_at, 'YYYY-MM-DD HH24:MI'\) AS rework_at/i
  );
  assert.match(
    Material.__private.GET_SINGLE_REQUEST_APPROVAL_INBOX_QUERY,
    /rework_by\.username AS rework_by_username/i
  );
  assert.match(
    Material.__private.GET_SINGLE_REQUEST_APPROVAL_INBOX_QUERY,
    /approval_1_user\.fullname.*AS approval_1_user_name/is
  );
  assert.match(
    Material.__private.GET_SINGLE_REQUEST_APPROVAL_INBOX_QUERY,
    /LEFT JOIN mst_user approval_2_user ON approval_2_user\.user_id = r\.approval_2_user_id/i
  );
});

test("getSingleRequests list query reads approval snapshot from mat_single_request", () => {
  assert.doesNotMatch(Material.__private.GET_SINGLE_REQUEST_LIST_QUERY, /LEFT JOIN mat_single_request_approval a/i);
  assert.match(Material.__private.GET_SINGLE_REQUEST_LIST_QUERY, /r\.approval_1_user_id/i);
  assert.match(Material.__private.GET_SINGLE_REQUEST_LIST_QUERY, /r\.approval_2_status/i);
  assert.match(Material.__private.GET_SINGLE_REQUEST_LIST_QUERY, /r\.approval_3_status/i);
  assert.match(Material.__private.GET_SINGLE_REQUEST_LIST_QUERY, /r\.rework_stage/i);
  assert.match(Material.__private.GET_SINGLE_REQUEST_LIST_QUERY, /r\.rework_reason/i);
  assert.match(
    Material.__private.GET_SINGLE_REQUEST_LIST_QUERY,
    /TO_CHAR\(r\.rework_at, 'YYYY-MM-DD HH24:MI'\) AS rework_at/i
  );
  assert.match(Material.__private.GET_SINGLE_REQUEST_LIST_QUERY, /rework_by\.username AS rework_by_username/i);
  assert.match(
    Material.__private.GET_SINGLE_REQUEST_LIST_QUERY,
    /approval_1_user\.fullname.*AS approval_1_user_name/is
  );
  assert.match(
    Material.__private.GET_SINGLE_REQUEST_LIST_QUERY,
    /LEFT JOIN mst_user approval_3_user ON approval_3_user\.user_id = r\.approval_3_user_id/i
  );
});

test("legacy single request read queries omit rework columns and joins", () => {
  assert.doesNotMatch(
    Material.__private.GET_SINGLE_REQUEST_LIST_PRE_REWORK_QUERY,
    /r\.rework_stage|r\.rework_reason|rework_by\.username/i
  );
  assert.match(
    Material.__private.GET_SINGLE_REQUEST_LIST_PRE_REWORK_QUERY,
    /NULL::varchar AS rework_stage/i
  );
  assert.doesNotMatch(
    Material.__private.GET_SINGLE_REQUEST_APPROVAL_INBOX_PRE_REWORK_QUERY,
    /r\.rework_stage|r\.rework_reason|rework_by\.username/i
  );
  assert.match(
    Material.__private.GET_SINGLE_REQUEST_APPROVAL_INBOX_PRE_REWORK_QUERY,
    /NULL::varchar AS rework_stage/i
  );
});

test("migration adds rework fields, check constraint, and comments", () => {
  const migrationSource = require("fs").readFileSync(
    require("path").join(
      __dirname,
      "../migration/20260522_add_mat_single_request_rework_fields.sql"
    ),
    "utf8"
  );

  assert.match(migrationSource, /ADD COLUMN IF NOT EXISTS rework_stage VARCHAR\(32\)/i);
  assert.match(migrationSource, /ADD COLUMN IF NOT EXISTS rework_by_user_id VARCHAR\(64\)/i);
  assert.match(migrationSource, /ADD COLUMN IF NOT EXISTS rework_at TIMESTAMPTZ NULL/i);
  assert.match(migrationSource, /ADD COLUMN IF NOT EXISTS rework_reason TEXT/i);
  assert.match(migrationSource, /chk_mat_single_request_rework_stage/i);
  assert.match(
    migrationSource,
    /CHECK\s*\(\s*rework_stage IS NULL OR\s*rework_stage IN \('Approval 1', 'Approval 2', 'Approval 3'\)\s*\)/i
  );
  assert.match(migrationSource, /COMMENT ON COLUMN mat_single_request\.rework_stage/i);
  assert.match(migrationSource, /COMMENT ON COLUMN mat_single_request\.rework_by_user_id/i);
  assert.match(migrationSource, /COMMENT ON COLUMN mat_single_request\.rework_at/i);
  assert.match(migrationSource, /COMMENT ON COLUMN mat_single_request\.rework_reason/i);
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
  assert.match(
    Material.approveSingleRequestByAdmin.toString(),
    /INSERT INTO mat_single_request_edit_history/i
  );
  assert.match(
    Material.approveSingleRequestByAdmin.toString(),
    /editedRequest/
  );
  assert.match(
    Material.approveSingleRequestByAdmin.toString(),
    /material_sub_group_id/
  );
  assert.match(
    Material.approveSingleRequestByAdmin.toString(),
    /template_payload/
  );
  assert.match(
    Material.approveSingleRequestByAdmin.toString(),
    /BEGIN/
  );
  assert.match(
    Material.approveSingleRequestByAdmin.toString(),
    /COMMIT/
  );
  assert.match(
    Material.approveSingleRequestByAdmin.toString(),
    /ROLLBACK/
  );
  assert.match(
    Material.approveSingleRequestByAdmin.toString(),
    /snapshot\.created_by \?\? null/
  );
  assert.match(
    Material.approveSingleRequestByAdmin.toString(),
    /snapshot\.created_at \?\? null/
  );
  assert.doesNotMatch(
    Material.approveSingleRequestByAdmin.toString(),
    /actorUserId \?\? snapshot\.created_by/
  );
});

test("getSingleRequestApprovalInbox query aggregates edit history from history table", () => {
  assert.match(
    Material.__private.GET_SINGLE_REQUEST_APPROVAL_INBOX_QUERY,
    /LEFT JOIN LATERAL\s*\(\s*SELECT[\s\S]*jsonb_agg\([\s\S]*ORDER BY eh\.approved_at DESC[\s\S]*FROM mat_single_request_edit_history eh[\s\S]*WHERE eh\.request_id = r\.id[\s\S]*\)\s*edit_history_rows ON TRUE/i
  );
  assert.match(
    Material.__private.GET_SINGLE_REQUEST_APPROVAL_INBOX_QUERY,
    /COALESCE\(edit_history_rows\.edit_history, '\[\]'::jsonb\) AS edit_history/i
  );
  assert.match(
    Material.__private.GET_SINGLE_REQUEST_APPROVAL_INBOX_QUERY,
    /'approved_by_user_id', eh\.approved_by_user_id[\s\S]*'approved_by_username', COALESCE\(au\.username, eh\.approved_by_user_id\)[\s\S]*'approve_remark', eh\.approve_remark[\s\S]*'created_by', eh\.created_by[\s\S]*'created_at', eh\.created_at/i
  );
  assert.match(
    Material.__private.GET_SINGLE_REQUEST_APPROVAL_INBOX_QUERY,
    /'material_description', eh\.material_description[\s\S]*'base_uom', eh\.base_uom[\s\S]*'template_payload', eh\.template_payload/i
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

test("approve controller forwards editedRequest payload", () => {
  assert.match(
    MaterialController.approveSingleRequest.toString(),
    /editedRequest:\s*req\.body\?\.editedRequest\s*\?\?\s*null/
  );
});

test("approve controller preserves custom status codes and validation errors", async () => {
  const originalApprove = Material.approveSingleRequestByAdmin;
  const req = {
    params: { id: "77" },
    cookies: { user_id: "APP-01", username: "user.one" },
    body: {
      remark: "approve",
      editedRequest: {
        material_description: "",
      },
    },
  };
  const response = {
    statusCode: null,
    jsonPayload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.jsonPayload = payload;
      return this;
    },
  };

  Material.approveSingleRequestByAdmin = async () => {
    const error = new Error("Material request validation failed");
    error.statusCode = 400;
    error.code = "SINGLE_REQUEST_EDIT_VALIDATION_FAILED";
    error.errors = [
      {
        fieldKey: "material_description",
        message: "Required",
      },
    ];
    throw error;
  };

  try {
    await MaterialController.approveSingleRequest(req, response);

    assert.equal(response.statusCode, 400);
    assert.deepEqual(response.jsonPayload, {
      success: false,
      message: "Material request validation failed",
      code: "SINGLE_REQUEST_EDIT_VALIDATION_FAILED",
      errors: [
        {
          fieldKey: "material_description",
          message: "Required",
        },
      ],
    });
  } finally {
    Material.approveSingleRequestByAdmin = originalApprove;
  }
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

test("approval edit validation rejects subgroup outside current material group", async () => {
  await assert.rejects(
    Material.__private.prepareSingleRequestApprovalEditPatch({
      snapshot: {
        material_group_id: 10,
        material_sub_group_id: 100,
        material_group_code: "CHEM",
        material_description: "Current description",
        base_uom: "EA",
        plant_code: "P1",
        sloc_code: "S1",
        long_text_1: null,
        long_text_2: null,
        long_text_3: null,
        template_payload: { requestFields: {}, templateValues: {} },
      },
      editedRequest: {
        material_sub_group_id: 200,
      },
      getSubGroupById: async () => ({
        id: 200,
        item_group_id: 99,
        deleted_at: null,
      }),
      validateMaterialRequestTemplate: async () => ({
        errors: [],
        normalizedRequestFields: {
          material_description: "Current description",
          base_unit_of_measure: "EA",
        },
        normalizedTemplateValues: {},
      }),
    }),
    error => {
      assert.equal(error.statusCode, 400);
      assert.match(
        error.message,
        /Sub material group does not belong to the selected material group/
      );
      return true;
    }
  );
});

test("rework edit validation allows material group change and validates subgroup against new group", async () => {
  let receivedValidationPayload = null;

  const patch = await Material.__private.prepareSingleRequestApprovalEditPatch({
    snapshot: {
      material_group_id: 10,
      material_sub_group_id: 100,
      material_group_code: "CHEM",
      material_description: "Current description",
      base_uom: "EA",
      plant_code: "P1",
      sloc_code: "S1",
      long_text_1: null,
      long_text_2: null,
      long_text_3: null,
      template_payload: { requestFields: {}, templateValues: { density: "1.0" } },
    },
    editedRequest: {
      material_group_id: 11,
      material_group_code: "PACK",
      material_sub_group_id: 210,
      material_description: "Updated description",
      template_payload: { templateValues: { density: "1.2" } },
    },
    allowMaterialGroupChange: true,
    getSubGroupById: async () => ({
      id: 210,
      item_group_id: 11,
      deleted_at: null,
    }),
    validateMaterialRequestTemplate: async payload => {
      receivedValidationPayload = payload;
      return {
        errors: [],
        materialDescription: payload.requestFields.material_description,
        normalizedRequestFields: {
          material_description: payload.requestFields.material_description,
          base_unit_of_measure: payload.requestFields.base_unit_of_measure,
          plant: payload.requestFields.plant,
          storage_location: payload.requestFields.storage_location,
        },
        normalizedTemplateValues: payload.templateValues,
      };
    },
  });

  assert.equal(patch.material_group_id, 11);
  assert.equal(patch.material_sub_group_id, 210);
  assert.equal(receivedValidationPayload.materialGroupCode, "PACK");
});

test("approval edit validation surfaces template validation errors", async () => {
  await assert.rejects(
    Material.__private.prepareSingleRequestApprovalEditPatch({
      snapshot: {
        material_group_id: 10,
        material_sub_group_id: 100,
        material_group_code: "CHEM",
        material_description: "Current description",
        base_uom: "EA",
        plant_code: "P1",
        sloc_code: "S1",
        long_text_1: null,
        long_text_2: null,
        long_text_3: null,
        template_payload: { requestFields: {}, templateValues: {} },
      },
      editedRequest: {
        material_description: "",
        template_payload: { templateValues: { foo: "" } },
      },
      getSubGroupById: async () => ({
        id: 100,
        item_group_id: 10,
        deleted_at: null,
      }),
      validateMaterialRequestTemplate: async () => ({
        errors: [
          {
            fieldKey: "material_description",
            message: "Required",
          },
        ],
        normalizedRequestFields: {},
        normalizedTemplateValues: { foo: "" },
      }),
    }),
    error => {
      assert.equal(error.statusCode, 400);
      assert.match(error.message, /Material request validation failed/);
      assert.deepEqual(error.errors, [
        {
          fieldKey: "material_description",
          message: "Required",
        },
      ]);
      return true;
    }
  );
});

test("approval edit validation ignores hidden request-rule validation errors", async () => {
  const patch = await Material.__private.prepareSingleRequestApprovalEditPatch({
    snapshot: {
      material_group_id: 10,
      material_sub_group_id: 100,
      material_group_code: "CHEM",
      material_description: "Current description",
      base_uom: "EA",
      plant_code: "P1",
      sloc_code: "S1",
      long_text_1: null,
      long_text_2: null,
      long_text_3: null,
      template_payload: { requestFields: {}, templateValues: {} },
    },
    editedRequest: {
      material_description: "New desc",
    },
    getSubGroupById: async () => ({
      id: 100,
      item_group_id: 10,
      deleted_at: null,
    }),
    validateMaterialRequestTemplate: async ({ requestFields, templateValues }) => ({
      errors: [
        {
          fieldKey: "material_type",
          message: "Material Type wajib diisi",
        },
        {
          fieldKey: "material_group",
          message: "Material Group wajib diisi",
        },
        {
          fieldKey: "batch_management",
          message: "Batch Management wajib diisi",
        },
      ],
      requestFieldRules: [
        { fieldKey: "material_type" },
        { fieldKey: "material_group" },
        { fieldKey: "batch_management" },
      ],
      normalizedRequestFields: {
        material_description: requestFields.material_description,
        base_unit_of_measure: requestFields.base_unit_of_measure,
      },
      normalizedTemplateValues: templateValues,
    }),
  });

  assert.equal(patch.material_description, "New desc");
});

test("approval edit validation still rejects visible request-rule validation errors", async () => {
  await assert.rejects(
    Material.__private.prepareSingleRequestApprovalEditPatch({
      snapshot: {
        material_group_id: 10,
        material_sub_group_id: 100,
        material_group_code: "CHEM",
        material_description: "Current description",
        base_uom: "EA",
        plant_code: "P1",
        sloc_code: "S1",
        long_text_1: null,
        long_text_2: null,
        long_text_3: null,
        template_payload: { requestFields: {}, templateValues: {} },
      },
      editedRequest: {
        base_uom: "",
      },
      getSubGroupById: async () => ({
        id: 100,
        item_group_id: 10,
        deleted_at: null,
      }),
      validateMaterialRequestTemplate: async () => ({
        errors: [
          {
            fieldKey: "base_unit_of_measure",
            message: "Base Unit of Measure wajib diisi",
          },
        ],
        requestFieldRules: [{ fieldKey: "base_unit_of_measure" }],
        normalizedRequestFields: {},
        normalizedTemplateValues: {},
      }),
    }),
    error => {
      assert.equal(error.statusCode, 400);
      assert.match(error.message, /Material request validation failed/);
      assert.deepEqual(error.errors, [
        {
          fieldKey: "base_unit_of_measure",
          message: "Base Unit of Measure wajib diisi",
        },
      ]);
      return true;
    }
  );
});

test("approval edit validation returns normalized editable patch", async () => {
  const patch = await Material.__private.prepareSingleRequestApprovalEditPatch({
    snapshot: {
      material_group_id: 10,
      material_sub_group_id: 100,
      material_group_code: "CHEM",
      material_description: "Current description",
      base_uom: "EA",
      plant_code: "P1",
      sloc_code: "S1",
      long_text_1: "old1",
      long_text_2: null,
      long_text_3: null,
      template_payload: { requestFields: { material_description: "Current description" }, templateValues: { old: true } },
    },
    editedRequest: {
      material_description: "New desc",
      base_uom: "KG",
      template_payload: { templateValues: { foo: "bar" } },
    },
    getSubGroupById: async () => ({
      id: 100,
      item_group_id: 10,
      deleted_at: null,
    }),
    validateMaterialRequestTemplate: async ({ requestFields, templateValues }) => ({
      errors: [],
      materialDescription: requestFields.material_description,
      normalizedRequestFields: {
        material_description: requestFields.material_description,
        base_unit_of_measure: requestFields.base_unit_of_measure,
        plant: requestFields.plant,
        storage_location: requestFields.storage_location,
        long_text_1: requestFields.long_text_1,
      },
      normalizedTemplateValues: templateValues,
    }),
  });

  assert.equal(patch.material_description, "New desc");
  assert.equal(patch.base_uom, "KG");
  assert.deepEqual(patch.template_payload, {
    requestFields: {
      material_description: "New desc",
      base_unit_of_measure: "KG",
      plant: "P1",
      storage_location: "S1",
      long_text_1: "old1",
    },
    templateValues: {
      foo: "bar",
    },
  });
});

test("approval edit validation runs for plant and sloc changes", async () => {
  let validationCalls = 0;

  const patch = await Material.__private.prepareSingleRequestApprovalEditPatch({
    snapshot: {
      material_group_id: 10,
      material_sub_group_id: 100,
      material_group_code: "CHEM",
      material_description: "Current description",
      base_uom: "EA",
      plant_code: "P1",
      sloc_code: "S1",
      long_text_1: "old1",
      long_text_2: null,
      long_text_3: null,
      template_payload: { requestFields: {}, templateValues: { old: true } },
    },
    editedRequest: {
      plant_code: "P2",
      sloc_code: "S2",
    },
    getSubGroupById: async () => ({
      id: 100,
      item_group_id: 10,
      deleted_at: null,
    }),
    validateMaterialRequestTemplate: async ({ requestFields, templateValues }) => {
      validationCalls += 1;

      assert.equal(requestFields.plant, "P2");
      assert.equal(requestFields.storage_location, "S2");
      assert.equal(requestFields.material_description, "Current description");
      assert.equal(requestFields.base_unit_of_measure, "EA");
      assert.deepEqual(templateValues, { old: true });

      return {
        errors: [],
        materialDescription: requestFields.material_description,
        normalizedRequestFields: {
          material_description: requestFields.material_description,
          base_unit_of_measure: requestFields.base_unit_of_measure,
          plant: requestFields.plant,
          storage_location: requestFields.storage_location,
        },
        normalizedTemplateValues: templateValues,
      };
    },
  });

  assert.equal(validationCalls, 1);
  assert.equal(patch.plant_code, "P2");
  assert.equal(patch.sloc_code, "S2");
});

test("approval edit validation rejects invalid required-field outcome from long text edit", async () => {
  let validationCalls = 0;

  await assert.rejects(
    Material.__private.prepareSingleRequestApprovalEditPatch({
      snapshot: {
        material_group_id: 10,
        material_sub_group_id: 100,
        material_group_code: "CHEM",
        material_description: null,
        base_uom: null,
        plant_code: "P1",
        sloc_code: "S1",
        long_text_1: "old1",
        long_text_2: null,
        long_text_3: null,
        template_payload: { requestFields: {}, templateValues: {} },
      },
      editedRequest: {
        long_text_1: "",
      },
      getSubGroupById: async () => ({
        id: 100,
        item_group_id: 10,
        deleted_at: null,
      }),
      validateMaterialRequestTemplate: async ({ requestFields }) => {
        validationCalls += 1;
        assert.equal(requestFields.long_text_1, "");

        return {
          errors: [],
          normalizedRequestFields: {
            material_description: "",
            base_unit_of_measure: "",
            plant: requestFields.plant,
            storage_location: requestFields.storage_location,
            long_text_1: requestFields.long_text_1,
          },
          normalizedTemplateValues: {},
        };
      },
    }),
    error => {
      assert.equal(validationCalls, 1);
      assert.equal(error.statusCode, 400);
      assert.match(
        error.message,
        /Material description and Base UoM are required/
      );
      return true;
    }
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

test("approval inbox non-admin sees cancel row only for their rejected stage", () => {
  const rows = [
    {
      id: 1,
      status: "CANCEL",
      approval_1_status: "REJECTED",
      approval_1_user_id: "APP-01",
      approval_2_status: null,
      approval_3_status: null,
    },
    {
      id: 2,
      status: "CANCEL",
      approval_1_status: "APPROVED",
      approval_2_status: "REJECTED",
      approval_2_user_id: "APP-02",
      approval_3_status: null,
    },
    {
      id: 3,
      status: "CANCEL",
      approval_1_status: "APPROVED",
      approval_2_status: "REJECTED",
      approval_2_user_id: "APP-01",
      approval_3_status: null,
    },
  ];

  assert.deepEqual(
    filterSingleRequestApprovalInboxRows(rows, {
      actorUserId: "APP-01",
      actorUsername: "approval.user",
    }).map(row => row.id),
    [1, 3]
  );
});

test("getSingleRequestApprovalInbox query includes Approval 3 waiting rows", () => {
  assert.match(
    Material.__private.GET_SINGLE_REQUEST_APPROVAL_INBOX_QUERY,
    /approval_2_status = 'APPROVED'[\s\S]*COALESCE\(r\.approval_3_status, 'WAITING'\) = 'WAITING'/i
  );
});

test("getSingleRequestApprovalInbox query keeps final list statuses for filtering", () => {
  assert.match(
    Material.__private.GET_SINGLE_REQUEST_APPROVAL_INBOX_QUERY,
    /UPPER\(COALESCE\(r\.status, ''\)\) IN \('DONE', 'REWORK', 'REJECT', 'REJECTED', 'CANCEL'\)/i
  );
});

test("getSingleRequestApprovalInbox delegates row filtering to shared helper", () => {
  assert.match(
    Material.getSingleRequestApprovalInbox.toString(),
    /filterSingleRequestApprovalInboxRows/
  );
});

test("getSingleRequestApprovalInbox returns aggregated edit_history rows", async () => {
  const originalConnect = db.connect;
  const queryCalls = [];

  db.connect = async () => ({
    query: async queryText => {
      queryCalls.push(queryText);
      return {
        rows: [
          {
            id: 77,
            status: "Submit",
            approval_1_status: "WAITING",
            approval_2_status: null,
            approval_3_status: null,
            approval_1_user_id: "APP-01",
            approval_2_user_id: null,
            approval_3_user_id: null,
            edit_history: [
              {
                id: 5,
                request_id: 77,
                request_no: "1000000077",
                approval_stage: "Approval 2",
                approved_by_user_id: "APP-01",
                approved_by_username: "approval.user.one",
                approve_remark: "latest edit",
                approved_at: "2026-05-20T11:30:00.000Z",
                material_group_id: 12,
                material_sub_group_id: 120,
                plant_code: "P2",
                sloc_code: "S2",
                material_description: "Changed desc",
                base_uom: "KG",
                long_text_1: "l1",
                long_text_2: "l2",
                long_text_3: "l3",
                template_payload: { templateValues: { density: "1.2" } },
                created_by: "REQ-01",
                created_at: "2026-05-01T08:00:00.000Z",
              },
              {
                id: 4,
                request_id: 77,
                request_no: "1000000077",
                approval_stage: "Approval 1",
                approved_by_user_id: "APP-01",
                approved_by_username: "approval.user.one",
                approve_remark: "older edit",
                approved_at: "2026-05-20T09:15:00.000Z",
                material_group_id: 12,
                material_sub_group_id: 110,
                plant_code: "P1",
                sloc_code: "S1",
                material_description: "Original desc",
                base_uom: "EA",
                long_text_1: null,
                long_text_2: null,
                long_text_3: null,
                template_payload: { templateValues: { density: "1.0" } },
                created_by: "REQ-01",
                created_at: "2026-05-01T08:00:00.000Z",
              },
            ],
          },
        ],
      };
    },
    release: () => {},
  });

  try {
    const rows = await Material.getSingleRequestApprovalInbox("APP-01", "user.one");

    assert.equal(queryCalls.length, 1);
    assert.equal(rows.length, 1);
    assert.deepEqual(rows[0].edit_history, [
      {
        id: 5,
        request_id: 77,
        request_no: "1000000077",
        approval_stage: "Approval 2",
        approved_by_user_id: "APP-01",
        approved_by_username: "approval.user.one",
        approve_remark: "latest edit",
        approved_at: "2026-05-20T11:30:00.000Z",
        material_group_id: 12,
        material_sub_group_id: 120,
        plant_code: "P2",
        sloc_code: "S2",
        material_description: "Changed desc",
        base_uom: "KG",
        long_text_1: "l1",
        long_text_2: "l2",
        long_text_3: "l3",
        template_payload: { templateValues: { density: "1.2" } },
        created_by: "REQ-01",
        created_at: "2026-05-01T08:00:00.000Z",
      },
      {
        id: 4,
        request_id: 77,
        request_no: "1000000077",
        approval_stage: "Approval 1",
        approved_by_user_id: "APP-01",
        approved_by_username: "approval.user.one",
        approve_remark: "older edit",
        approved_at: "2026-05-20T09:15:00.000Z",
        material_group_id: 12,
        material_sub_group_id: 110,
        plant_code: "P1",
        sloc_code: "S1",
        material_description: "Original desc",
        base_uom: "EA",
        long_text_1: null,
        long_text_2: null,
        long_text_3: null,
        template_payload: { templateValues: { density: "1.0" } },
        created_by: "REQ-01",
        created_at: "2026-05-01T08:00:00.000Z",
      },
    ]);
  } finally {
    db.connect = originalConnect;
  }
});

test("getSingleRequestApprovalInbox falls back when edit history table is missing", async () => {
  const originalConnect = db.connect;
  const queryCalls = [];

  db.connect = async () => ({
    query: async queryText => {
      queryCalls.push(queryText);

      if (queryText === Material.__private.GET_SINGLE_REQUEST_APPROVAL_INBOX_QUERY) {
        const error = new Error('relation "mat_single_request_edit_history" does not exist');
        error.code = "42P01";
        throw error;
      }

      assert.equal(
        queryText,
        Material.__private.GET_SINGLE_REQUEST_APPROVAL_INBOX_LEGACY_QUERY
      );

      return {
        rows: [
          {
            id: 88,
            status: "Submit",
            approval_1_status: "WAITING",
            approval_2_status: null,
            approval_3_status: null,
            approval_1_user_id: "APP-01",
            approval_2_user_id: null,
            approval_3_user_id: null,
            edit_history: [],
          },
        ],
      };
    },
    release: () => {},
  });

  try {
    const rows = await Material.getSingleRequestApprovalInbox("APP-01", "user.one");

    assert.deepEqual(queryCalls, [
      Material.__private.GET_SINGLE_REQUEST_APPROVAL_INBOX_QUERY,
      Material.__private.GET_SINGLE_REQUEST_APPROVAL_INBOX_LEGACY_QUERY,
    ]);
    assert.equal(rows.length, 1);
    assert.deepEqual(rows[0].edit_history, []);
  } finally {
    db.connect = originalConnect;
  }
});

test("getSingleRequestApprovalInbox falls back when rework columns are missing", async () => {
  const originalConnect = db.connect;
  const queryCalls = [];

  db.connect = async () => ({
    query: async queryText => {
      queryCalls.push(queryText);

      if (queryText === Material.__private.GET_SINGLE_REQUEST_APPROVAL_INBOX_QUERY) {
        const error = new Error('column r.rework_stage does not exist');
        error.code = "42703";
        throw error;
      }

      assert.equal(
        queryText,
        Material.__private.GET_SINGLE_REQUEST_APPROVAL_INBOX_PRE_REWORK_QUERY
      );

      return {
        rows: [
          {
            id: 99,
            status: "Submit",
            approval_1_status: "WAITING",
            approval_2_status: null,
            approval_3_status: null,
            approval_1_user_id: "APP-01",
            approval_2_user_id: null,
            approval_3_user_id: null,
            rework_stage: null,
            rework_by_user_id: null,
            rework_at: null,
            rework_by_username: null,
            rework_reason: null,
            edit_history: [],
          },
        ],
      };
    },
    release: () => {},
  });

  try {
    const rows = await Material.getSingleRequestApprovalInbox("APP-01", "user.one");

    assert.deepEqual(queryCalls, [
      Material.__private.GET_SINGLE_REQUEST_APPROVAL_INBOX_QUERY,
      Material.__private.GET_SINGLE_REQUEST_APPROVAL_INBOX_PRE_REWORK_QUERY,
    ]);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].rework_stage, null);
  } finally {
    db.connect = originalConnect;
  }
});

test("getSingleRequestsByUser falls back when rework columns are missing", async () => {
  const originalConnect = db.connect;
  const queryCalls = [];

  db.connect = async () => ({
    query: async (queryText, params = []) => {
      queryCalls.push({ queryText, params });

      if (queryText === Material.__private.GET_SINGLE_REQUEST_LIST_QUERY) {
        const error = new Error('column r.rework_by_user_id does not exist');
        error.code = "42703";
        throw error;
      }

      assert.equal(
        queryText,
        Material.__private.GET_SINGLE_REQUEST_LIST_PRE_REWORK_QUERY
      );
      assert.deepEqual(params, ["REQ-01"]);

      return {
        rows: [
          {
            id: 71,
            requester_user_id: "REQ-01",
            rework_stage: null,
            rework_by_user_id: null,
            rework_at: null,
            rework_by_username: null,
            rework_reason: null,
          },
        ],
      };
    },
    release: () => {},
  });

  try {
    const rows = await Material.getSingleRequestsByUser("REQ-01");

    assert.deepEqual(
      queryCalls.map(call => call.queryText),
      [
        Material.__private.GET_SINGLE_REQUEST_LIST_QUERY,
        Material.__private.GET_SINGLE_REQUEST_LIST_PRE_REWORK_QUERY,
      ]
    );
    assert.equal(rows.length, 1);
    assert.equal(rows[0].id, 71);
  } finally {
    db.connect = originalConnect;
  }
});

test("approveSingleRequestByAdmin stores original request creator metadata in edit history", async () => {
  const originalConnect = db.connect;
  const originalGetSubGroupById = Material.getSubGroupById;
  const originalValidateMaterialRequestTemplate =
    MaterialTemplate.validateMaterialRequestTemplate;
  const queryLog = [];
  let insertHistoryParams = null;
  const snapshotCreatedAt = new Date("2026-05-01T08:00:00.000Z");

  db.connect = async () => ({
    query: async (queryText, params = []) => {
      queryLog.push({ queryText, params });

      if (queryText === "BEGIN" || queryText === "COMMIT" || queryText === "ROLLBACK") {
        return { rows: [], rowCount: null };
      }

      if (/FOR UPDATE OF r/.test(queryText)) {
        return {
          rows: [
            {
              request_id: 77,
              request_no: "1000000077",
              assigned_to: "Approval 1",
              created_by: "REQ-01",
              created_at: snapshotCreatedAt,
              status: "Submit",
              material_group_code: "CHEM",
              requester_user_id: "REQ-01",
              approval_1_user_id: "APP-01",
              approval_1_at: null,
              approval_1_status: "WAITING",
              approval_1_remark: null,
              approval_2_user_id: "APP-02",
              approval_2_at: null,
              approval_2_status: "WAITING",
              approval_2_remark: null,
              approval_3_user_id: null,
              approval_3_at: null,
              approval_3_status: null,
              approval_3_remark: null,
              material_group_id: 12,
              material_sub_group_id: 110,
              plant_code: "P1",
              sloc_code: "S1",
              material_description: "Original desc",
              base_uom: "EA",
              long_text_1: "old1",
              long_text_2: null,
              long_text_3: null,
              template_payload: {
                requestFields: { material_description: "Original desc" },
                templateValues: { density: "1.0" },
              },
            },
          ],
          rowCount: 1,
        };
      }

      if (/INSERT INTO mat_single_request_edit_history/i.test(queryText)) {
        insertHistoryParams = params;
        return { rows: [], rowCount: 1 };
      }

      if (/SET material_description = \$2, base_uom = \$3, template_payload = \$4,[\s\S]*updated_at = NOW\(\)/i.test(queryText)) {
        return { rows: [], rowCount: 1 };
      }

      if (/SET approval_1_user_id = \$2,[\s\S]*COALESCE\(approval_1_status, 'WAITING'\) = 'WAITING'/i.test(queryText)) {
        return {
          rows: [
            {
              request_id: 77,
              approval_1_user_id: "APP-01",
              approval_1_status: "APPROVED",
              approval_1_at: "2026-05-20 12:00",
              approval_1_remark: "approved with edit",
              approval_2_user_id: "APP-02",
              approval_2_status: "WAITING",
              approval_2_at: null,
              approval_2_remark: null,
              approval_3_user_id: null,
              approval_3_status: null,
              approval_3_at: null,
              approval_3_remark: null,
            },
          ],
          rowCount: 1,
        };
      }

      if (/SET assigned_to = \$2,/i.test(queryText)) {
        return { rows: [], rowCount: 1 };
      }

      throw new Error(`Unexpected query: ${queryText}`);
    },
    release: () => {},
  });

  Material.getSubGroupById = async () => ({
    id: 110,
    item_group_id: 12,
    deleted_at: null,
  });
  MaterialTemplate.validateMaterialRequestTemplate = async ({
    requestFields,
    templateValues,
  }) => ({
    errors: [],
    materialDescription: requestFields.material_description,
    normalizedRequestFields: {
      material_description: requestFields.material_description,
      base_unit_of_measure: requestFields.base_unit_of_measure,
      plant: requestFields.plant,
      storage_location: requestFields.storage_location,
      long_text_1: requestFields.long_text_1,
    },
    normalizedTemplateValues: templateValues,
  });

  try {
    await Material.approveSingleRequestByAdmin({
      requestId: 77,
      actorUserId: "APP-01",
      actorUsername: "user.one",
      remark: "approved with edit",
      editedRequest: {
        material_description: "Changed desc",
        base_uom: "KG",
        template_payload: { templateValues: { density: "1.2" } },
      },
    });

    assert.ok(insertHistoryParams);
    assert.equal(insertHistoryParams.length, 17);
    assert.equal(insertHistoryParams[0], 77);
    assert.equal(insertHistoryParams[1], "1000000077");
    assert.equal(insertHistoryParams[2], "Approval 1");
    assert.equal(insertHistoryParams[3], "APP-01");
    assert.equal(insertHistoryParams[4], "approved with edit");
    assert.equal(insertHistoryParams[5], 12);
    assert.equal(insertHistoryParams[6], 110);
    assert.equal(insertHistoryParams[7], "P1");
    assert.equal(insertHistoryParams[8], "S1");
    assert.equal(insertHistoryParams[9], "Original desc");
    assert.equal(insertHistoryParams[10], "EA");
    assert.equal(insertHistoryParams[11], "old1");
    assert.equal(insertHistoryParams[12], null);
    assert.equal(insertHistoryParams[13], null);
    assert.deepEqual(insertHistoryParams[14], {
      requestFields: { material_description: "Original desc" },
      templateValues: { density: "1.0" },
    });
    assert.equal(insertHistoryParams[15], "REQ-01");
    assert.equal(insertHistoryParams[16], snapshotCreatedAt);
    assert.notEqual(insertHistoryParams[15], "APP-01");

    const historyInsert = queryLog.find(entry =>
      /INSERT INTO mat_single_request_edit_history/i.test(entry.queryText)
    );
    assert.ok(historyInsert);
    assert.match(
      historyInsert.queryText,
      /\$15, \$16, \$17/
    );
    assert.doesNotMatch(
      historyInsert.queryText,
      /\$15, \$16, NOW\(\)/
    );
  } finally {
    db.connect = originalConnect;
    Material.getSubGroupById = originalGetSubGroupById;
    MaterialTemplate.validateMaterialRequestTemplate =
      originalValidateMaterialRequestTemplate;
  }
});

test("approveSingleRequestByAdmin skips history insert when edit-history table is missing", async () => {
  const originalConnect = db.connect;
  const originalGetSubGroupById = Material.getSubGroupById;
  const originalValidateMaterialRequestTemplate =
    MaterialTemplate.validateMaterialRequestTemplate;
  const originalWarn = console.warn;
  const queryLog = [];
  const warnings = [];

  db.connect = async () => ({
    query: async (queryText, params = []) => {
      queryLog.push({ queryText, params });

      if (queryText === "BEGIN" || queryText === "COMMIT" || queryText === "ROLLBACK") {
        return { rows: [], rowCount: null };
      }

      if (/FOR UPDATE OF r/.test(queryText)) {
        return {
          rows: [
            {
              request_id: 77,
              request_no: "1000000077",
              assigned_to: "Approval 1",
              created_by: "REQ-01",
              created_at: new Date("2026-05-01T08:00:00.000Z"),
              status: "Submit",
              material_group_code: "CHEM",
              requester_user_id: "REQ-01",
              approval_1_user_id: "APP-01",
              approval_1_at: null,
              approval_1_status: "WAITING",
              approval_1_remark: null,
              approval_2_user_id: "APP-02",
              approval_2_at: null,
              approval_2_status: "WAITING",
              approval_2_remark: null,
              approval_3_user_id: null,
              approval_3_at: null,
              approval_3_status: null,
              approval_3_remark: null,
              material_group_id: 12,
              material_sub_group_id: 110,
              plant_code: "P1",
              sloc_code: "S1",
              material_description: "Original desc",
              base_uom: "EA",
              long_text_1: "old1",
              long_text_2: null,
              long_text_3: null,
              template_payload: {
                requestFields: { material_description: "Original desc" },
                templateValues: { density: "1.0" },
              },
            },
          ],
          rowCount: 1,
        };
      }

      if (/INSERT INTO mat_single_request_edit_history/i.test(queryText)) {
        const error = new Error(
          'relation "mat_single_request_edit_history" does not exist'
        );
        error.code = "42P01";
        throw error;
      }

      if (/SET material_description = \$2, base_uom = \$3, template_payload = \$4,[\s\S]*updated_at = NOW\(\)/i.test(queryText)) {
        return { rows: [], rowCount: 1 };
      }

      if (/SET approval_1_user_id = \$2,[\s\S]*COALESCE\(approval_1_status, 'WAITING'\) = 'WAITING'/i.test(queryText)) {
        return {
          rows: [
            {
              request_id: 77,
              approval_1_user_id: "APP-01",
              approval_1_status: "APPROVED",
              approval_1_at: "2026-05-20 12:00",
              approval_1_remark: "approved with edit",
              approval_2_user_id: "APP-02",
              approval_2_status: "WAITING",
              approval_2_at: null,
              approval_2_remark: null,
              approval_3_user_id: null,
              approval_3_status: null,
              approval_3_at: null,
              approval_3_remark: null,
            },
          ],
          rowCount: 1,
        };
      }

      if (/SET assigned_to = \$2,/i.test(queryText)) {
        return { rows: [], rowCount: 1 };
      }

      throw new Error(`Unexpected query: ${queryText}`);
    },
    release: () => {},
  });

  Material.getSubGroupById = async () => ({
    id: 110,
    item_group_id: 12,
    deleted_at: null,
  });
  MaterialTemplate.validateMaterialRequestTemplate = async ({
    requestFields,
    templateValues,
  }) => ({
    errors: [],
    materialDescription: requestFields.material_description,
    normalizedRequestFields: {
      material_description: requestFields.material_description,
      base_unit_of_measure: requestFields.base_unit_of_measure,
      plant: requestFields.plant,
      storage_location: requestFields.storage_location,
      long_text_1: requestFields.long_text_1,
    },
    normalizedTemplateValues: templateValues,
  });
  console.warn = message => {
    warnings.push(message);
  };

  try {
    const result = await Material.approveSingleRequestByAdmin({
      requestId: 77,
      actorUserId: "APP-01",
      actorUsername: "user.one",
      remark: "approved with edit",
      editedRequest: {
        material_description: "Changed desc",
        base_uom: "KG",
        template_payload: { templateValues: { density: "1.2" } },
      },
    });

    assert.deepEqual(result, {
      request_id: 77,
      stage: "Approval 1",
      next_stage: "Approval 2",
    });
    assert.equal(
      queryLog.some(entry =>
        /INSERT INTO mat_single_request_edit_history/i.test(entry.queryText)
      ),
      true
    );
    assert.equal(
      queryLog.some(entry =>
        /SET material_description = \$2, base_uom = \$3, template_payload = \$4,[\s\S]*updated_at = NOW\(\)/i.test(
          entry.queryText
        )
      ),
      true
    );
    assert.equal(
      warnings.some(message =>
        /mat_single_request_edit_history is missing/.test(message)
      ),
      true
    );
  } finally {
    db.connect = originalConnect;
    Material.getSubGroupById = originalGetSubGroupById;
    MaterialTemplate.validateMaterialRequestTemplate =
      originalValidateMaterialRequestTemplate;
    console.warn = originalWarn;
  }
});

test("material model exposes single request rework and detail methods", () => {
  assert.equal(typeof Material.requestSingleRequestRework, "function");
  assert.equal(typeof Material.saveSingleRequestRework, "function");
  assert.equal(typeof Material.getSingleRequestById, "function");
});

test("requestSingleRequestRework does not write edit history rows", () => {
  assert.doesNotMatch(
    Material.requestSingleRequestRework.toString(),
    /mat_single_request_edit_history/i
  );
  assert.match(
    Material.requestSingleRequestRework.toString(),
    /buildSingleRequestReworkPatch/
  );
});

test("saveSingleRequestRework keeps latest rework metadata while resetting revised stage", () => {
  assert.match(
    Material.saveSingleRequestRework.toString(),
    /buildSingleRequestRevisedPatch/
  );
  assert.match(
    Material.saveSingleRequestRework.toString(),
    /prepareSingleRequestApprovalEditPatch/
  );
  assert.doesNotMatch(
    Material.saveSingleRequestRework.toString(),
    /mat_single_request_edit_history/i
  );
  assert.match(Material.saveSingleRequestRework.toString(), /rework_stage/);
  assert.match(Material.saveSingleRequestRework.toString(), /rework_reason/);
});

test("controller exports single request detail and rework handlers", () => {
  assert.equal(typeof MaterialController.getSingleRequestById, "function");
  assert.equal(typeof MaterialController.requestSingleRequestRework, "function");
  assert.equal(typeof MaterialController.saveSingleRequestRework, "function");
});

test("controller detail and rework handlers forward params and cookies", () => {
  assert.match(MaterialController.getSingleRequestById.toString(), /req\.params\.id/);
  assert.match(
    MaterialController.requestSingleRequestRework.toString(),
    /req\.body\?\.reason\s*\?\?\s*null/
  );
  assert.match(
    MaterialController.saveSingleRequestRework.toString(),
    /req\.body\?\.editedRequest\s*\?\?\s*null/
  );
  assert.match(
    MaterialController.saveSingleRequestRework.toString(),
    /multipart\/form-data/
  );
  assert.match(
    MaterialController.saveSingleRequestRework.toString(),
    /req\.body\?\.attachments != null/
  );
});

test("single request detail route is registered after inbox and approver master routes", () => {
  const routeSource = require("fs").readFileSync(
    require("path").join(__dirname, "../routes/MaterialRoute.js"),
    "utf8"
  );

  const detailRouteIndex = routeSource.indexOf('"/requests/single/:id"');
  const inboxRouteIndex = routeSource.indexOf('"/requests/single/approval-inbox"');
  const approverMasterRouteIndex = routeSource.indexOf('"/requests/single/approver-masters"');

  assert.notEqual(detailRouteIndex, -1);
  assert.notEqual(inboxRouteIndex, -1);
  assert.notEqual(approverMasterRouteIndex, -1);
  assert.ok(detailRouteIndex > inboxRouteIndex);
  assert.ok(detailRouteIndex > approverMasterRouteIndex);
});

test("single request rework routes are registered after detail route", () => {
  const routeSource = require("fs").readFileSync(
    require("path").join(__dirname, "../routes/MaterialRoute.js"),
    "utf8"
  );

  const detailRouteIndex = routeSource.indexOf('"/requests/single/:id"');
  const reworkPostRouteIndex = routeSource.indexOf('"/requests/single/:id/rework"');
  const approveRouteIndex = routeSource.indexOf('"/requests/single/:id/approve"');
  const reworkRouteMatches =
    routeSource.match(/"\/requests\/single\/:id\/rework"/g) || [];

  assert.notEqual(reworkPostRouteIndex, -1);
  assert.ok(reworkPostRouteIndex > detailRouteIndex);
  assert.ok(reworkPostRouteIndex > approveRouteIndex);
  assert.equal(reworkRouteMatches.length, 2);
});

test("Material exposes rejectSingleRequestByAdmin", () => {
  assert.equal(typeof Material.rejectSingleRequestByAdmin, "function");
});

test("rejectSingleRequestByAdmin uses shared reject patch and submit status guard", () => {
  const source = Material.rejectSingleRequestByAdmin.toString();

  assert.match(source, /buildSingleRequestRejectPatch/);
  assert.match(source, /isSubmittedSingleRequestStatus\(snapshot\.status\)/);
  assert.match(source, /canActorApproveSingleRequestStage/);
  assert.match(source, /SINGLE_REQUEST_REJECT_STATUS_CONFLICT/);
  assert.match(source, /SINGLE_REQUEST_REJECT_FORBIDDEN/);
});

test("MaterialController exposes rejectSingleRequest", () => {
  assert.equal(typeof MaterialController.rejectSingleRequest, "function");
});

test("rejectSingleRequest controller delegates request id, actor, and reason", () => {
  const source = MaterialController.rejectSingleRequest.toString();

  assert.match(source, /Material\.rejectSingleRequestByAdmin/);
  assert.match(source, /requestId:\s*req\.params\.id/);
  assert.match(source, /actorUserId:\s*req\.cookies\.user_id/);
  assert.match(source, /actorUsername:\s*req\.cookies\.username/);
  assert.match(source, /reason:\s*req\.body\?\.reason\s*\?\?\s*null/);
});

test("rejectSingleRequest controller preserves backend validation metadata", async () => {
  const originalRejectSingleRequestByAdmin =
    Material.rejectSingleRequestByAdmin;

  Material.rejectSingleRequestByAdmin = async () => {
    const error = new Error("reject reason is required");
    error.statusCode = 400;
    error.code = "REJECT_REASON_REQUIRED";
    error.errors = [
      {
        fieldKey: "reason",
        message: "reject reason is required",
      },
    ];
    throw error;
  };

  const response = {
    statusCode: null,
    jsonPayload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.jsonPayload = payload;
      return this;
    },
  };

  try {
    await MaterialController.rejectSingleRequest(
      {
        params: { id: "77" },
        cookies: { user_id: "APP-01", username: "approver.user" },
        body: { reason: "   " },
      },
      response
    );

    assert.equal(response.statusCode, 400);
    assert.equal(response.jsonPayload.message, "reject reason is required");
    assert.equal(response.jsonPayload.code, "REJECT_REASON_REQUIRED");
    assert.deepEqual(response.jsonPayload.errors, [
      {
        fieldKey: "reason",
        message: "reject reason is required",
      },
    ]);
  } finally {
    Material.rejectSingleRequestByAdmin = originalRejectSingleRequestByAdmin;
  }
});

test("MaterialRoute registers single request reject endpoint", () => {
  const routeSource = require("fs").readFileSync(
    require("path").join(__dirname, "../routes/MaterialRoute.js"),
    "utf8"
  );

  assert.match(routeSource, /\/requests\/single\/:id\/reject/);
  assert.match(routeSource, /MaterialController\.rejectSingleRequest/);
});

test("administrator approver queries exclude cancel rows from active request sync", () => {
  assert.match(
    Material.__private.GET_ADMINISTRATOR_APPROVER_MASTERS_QUERY,
    /UPPER\(COALESCE\(status, ''\)\) IN \('REJECT', 'REJECTED', 'CANCEL'\)/i
  );
  assert.match(
    Material.updateAdministratorApproverMaster.toString(),
    /UPPER\(COALESCE\(status, ''\)\) IN \('REJECT', 'REJECTED', 'CANCEL'\)/i
  );
});

test("requestSingleRequestRework delegates rework timestamp stamping to shared helper patch", () => {
  assert.match(
    Material.requestSingleRequestRework.toString(),
    /const patch = buildSingleRequestReworkPatch/
  );
});

test("updateSingleRequestColumns inlines SQL timestamp expressions instead of binding string literals", async () => {
  const calls = [];
  const client = {
    query: async (queryText, params) => {
      calls.push({ queryText, params });
      return { rows: [], rowCount: 1 };
    },
  };

  await Material.__private.updateSingleRequestColumns(
    client,
    77,
    buildSingleRequestReworkPatch({
      reworkStage: "Approval 1",
      actorUserId: "APP-01",
      reason: "Need revision",
    })
  );

  assert.equal(calls.length, 1);
  assert.match(calls[0].queryText, /rework_at = NOW\(\)/);
  assert.equal(calls[0].params.includes("NOW()"), false);
});

test("saveSingleRequestRework keeps requested attachments and appends new uploads safely", async () => {
  const originalConnect = db.connect;
  const originalGetSubGroupById = Material.getSubGroupById;
  const originalValidateMaterialRequestTemplate =
    MaterialTemplate.validateMaterialRequestTemplate;
  const originalExistsSync = require("fs").existsSync;
  const originalMkdirSync = require("fs").mkdirSync;
  const originalReadFileSync = require("fs").readFileSync;
  const originalWriteFileSync = require("fs").writeFileSync;
  const originalUnlinkSync = require("fs").unlinkSync;
  const queryLog = [];
  const deletedAttachmentParams = [];
  let insertedAttachmentParams = null;

  require("fs").existsSync = pathValue =>
    String(pathValue).includes("single-request-attachments");
  require("fs").mkdirSync = () => {};
  require("fs").readFileSync = () => Buffer.from("pdf");
  require("fs").writeFileSync = () => {};
  require("fs").unlinkSync = () => {};

  db.connect = async () => ({
    query: async (queryText, params = []) => {
      queryLog.push({ queryText, params });

      if (queryText === "BEGIN" || queryText === "COMMIT" || queryText === "ROLLBACK") {
        return { rows: [], rowCount: null };
      }

      if (/FOR UPDATE OF r/.test(queryText)) {
        return {
          rows: [
            {
              request_id: 77,
              request_no: "1000000077",
              created_by: "REQ-01",
              created_at: new Date("2026-05-01T08:00:00.000Z"),
              status: "Rework",
              material_group_code: "CHEM",
              requester_user_id: "REQ-01",
              approval_1_user_id: "APP-01",
              approval_1_at: null,
              approval_1_status: "REWORK",
              approval_1_remark: "Need update",
              approval_2_user_id: "APP-02",
              approval_2_at: null,
              approval_2_status: "WAITING",
              approval_2_remark: null,
              approval_3_user_id: null,
              approval_3_at: null,
              approval_3_status: null,
              approval_3_remark: null,
              rework_stage: "Approval 1",
              rework_by_user_id: "APP-01",
              rework_at: new Date("2026-05-21T08:00:00.000Z"),
              rework_reason: "Need update",
              material_group_id: 12,
              material_sub_group_id: 110,
              plant_code: "P1",
              sloc_code: "S1",
              material_description: "Original desc",
              base_uom: "EA",
              long_text_1: "old1",
              long_text_2: null,
              long_text_3: null,
              template_payload: {
                requestFields: { material_description: "Original desc" },
                templateValues: { density: "1.0" },
              },
            },
          ],
          rowCount: 1,
        };
      }

      if (/SELECT id, file_name, file_path, file_type\s+FROM mat_single_request_attachment/i.test(queryText)) {
        return {
          rows: [
            {
              id: 10,
              file_name: "keep.pdf",
              file_path: "single-request-attachments/CHEM/SUB/keep.pdf",
              file_type: "application/pdf",
            },
            {
              id: 11,
              file_name: "drop.pdf",
              file_path: "single-request-attachments/CHEM/SUB/drop.pdf",
              file_type: "application/pdf",
            },
          ],
          rowCount: 2,
        };
      }

      if (/UPDATE mat_single_request[\s\S]*rework_stage = \$\d[\s\S]*updated_at = NOW\(\)/i.test(queryText)) {
        return { rows: [], rowCount: 1 };
      }

      if (/DELETE FROM mat_single_request_attachment\s+WHERE request_id = \$1 AND id = ANY/i.test(queryText)) {
        deletedAttachmentParams.push(params);
        return { rows: [], rowCount: 1 };
      }

      if (/INSERT INTO mat_single_request_attachment/i.test(queryText)) {
        insertedAttachmentParams = params;
        return { rows: [{ id: 12 }], rowCount: 1 };
      }

      throw new Error(`Unexpected query: ${queryText}`);
    },
    release: () => {},
  });

  Material.getSubGroupById = async () => ({
    id: 110,
    item_group_id: 12,
    deleted_at: null,
  });
  MaterialTemplate.validateMaterialRequestTemplate = async ({
    requestFields,
    templateValues,
  }) => ({
    errors: [],
    materialDescription: requestFields.material_description,
    normalizedRequestFields: {
      material_description: requestFields.material_description,
      base_unit_of_measure: requestFields.base_unit_of_measure,
      plant: requestFields.plant,
      storage_location: requestFields.storage_location,
      long_text_1: requestFields.long_text_1,
    },
    normalizedTemplateValues: templateValues,
  });

  try {
    const result = await Material.saveSingleRequestRework({
      requestId: 77,
      actorUserId: "REQ-01",
      actorUsername: "requester.user",
      editedRequest: {
        material_description: "Changed desc",
        base_uom: "KG",
        template_payload: { templateValues: { density: "1.2" } },
      },
      attachments: {
        keepAttachmentIds: [10],
        newAttachments: [
          {
            tempPath: "C:\\tmp\\new-file.pdf",
            originalName: "new-file.pdf",
            relativePath: "single-request-attachments/CHEM/SUB/new-file.pdf",
            mimeType: "application/pdf",
          },
        ],
      },
    });

    assert.deepEqual(result, {
      request_id: 77,
      stage: "Approval 1",
      status: "Submit",
    });
    assert.equal(deletedAttachmentParams.length, 1);
    assert.deepEqual(deletedAttachmentParams[0], [77, [11]]);
    assert.deepEqual(insertedAttachmentParams, [
      77,
      "new-file.pdf",
      "single-request-attachments/CHEM/SUB/new-file.pdf",
      "application/pdf",
    ]);
    assert.equal(
      queryLog.some(
        entry =>
          entry.queryText ===
          "DELETE FROM mat_single_request_attachment WHERE request_id = $1"
      ),
      false
    );
  } finally {
    db.connect = originalConnect;
    Material.getSubGroupById = originalGetSubGroupById;
    MaterialTemplate.validateMaterialRequestTemplate =
      originalValidateMaterialRequestTemplate;
    require("fs").existsSync = originalExistsSync;
    require("fs").mkdirSync = originalMkdirSync;
    require("fs").readFileSync = originalReadFileSync;
    require("fs").writeFileSync = originalWriteFileSync;
    require("fs").unlinkSync = originalUnlinkSync;
  }
});

test("saveSingleRequestRework persists selected material group for rework edits", async () => {
  const originalConnect = db.connect;
  const originalGetSubGroupById = Material.getSubGroupById;
  const originalValidateMaterialRequestTemplate =
    MaterialTemplate.validateMaterialRequestTemplate;
  const queryLog = [];
  let validationMaterialGroupCode = null;

  db.connect = async () => ({
    query: async (queryText, params = []) => {
      queryLog.push({ queryText, params });

      if (queryText === "BEGIN" || queryText === "COMMIT" || queryText === "ROLLBACK") {
        return { rows: [], rowCount: null };
      }

      if (/FOR UPDATE OF r/.test(queryText)) {
        return {
          rows: [
            {
              request_id: 77,
              request_no: "1000000077",
              created_by: "REQ-01",
              created_at: new Date("2026-05-01T08:00:00.000Z"),
              status: "Rework",
              material_group_code: "CHEM",
              requester_user_id: "REQ-01",
              approval_1_user_id: "APP-01",
              approval_1_at: null,
              approval_1_status: "REWORK",
              approval_1_remark: "Need update",
              approval_2_user_id: "APP-02",
              approval_2_at: null,
              approval_2_status: "WAITING",
              approval_2_remark: null,
              approval_3_user_id: null,
              approval_3_at: null,
              approval_3_status: null,
              approval_3_remark: null,
              rework_stage: "Approval 1",
              rework_by_user_id: "APP-01",
              rework_at: new Date("2026-05-21T08:00:00.000Z"),
              rework_reason: "Need update",
              material_group_id: 12,
              material_sub_group_id: 110,
              plant_code: "P1",
              sloc_code: "S1",
              material_description: "Original desc",
              base_uom: "EA",
              long_text_1: "old1",
              long_text_2: null,
              long_text_3: null,
              template_payload: {
                requestFields: { material_description: "Original desc" },
                templateValues: { density: "1.0" },
              },
            },
          ],
          rowCount: 1,
        };
      }

      if (
        /UPDATE mat_single_request[\s\S]*material_group_id = \$\d/i.test(queryText) &&
        /UPDATE mat_single_request[\s\S]*material_sub_group_id = \$\d/i.test(queryText) &&
        /updated_at = NOW\(\)/i.test(queryText)
      ) {
        return { rows: [], rowCount: 1 };
      }

      throw new Error(`Unexpected query: ${queryText}`);
    },
    release: () => {},
  });

  Material.getSubGroupById = async () => ({
    id: 210,
    item_group_id: 21,
    deleted_at: null,
  });
  MaterialTemplate.validateMaterialRequestTemplate = async ({
    materialGroupCode,
    requestFields,
    templateValues,
  }) => {
    validationMaterialGroupCode = materialGroupCode;
    return {
      errors: [],
      materialDescription: requestFields.material_description,
      normalizedRequestFields: {
        material_description: requestFields.material_description,
        base_unit_of_measure: requestFields.base_unit_of_measure,
        plant: requestFields.plant,
        storage_location: requestFields.storage_location,
      },
      normalizedTemplateValues: templateValues,
    };
  };

  try {
    const result = await Material.saveSingleRequestRework({
      requestId: 77,
      actorUserId: "REQ-01",
      actorUsername: "requester.user",
      editedRequest: {
        material_group_id: 21,
        material_group_code: "PACK",
        material_sub_group_id: 210,
        material_description: "Changed desc",
        base_uom: "KG",
        template_payload: { templateValues: { density: "1.2" } },
      },
    });

    assert.deepEqual(result, {
      request_id: 77,
      stage: "Approval 1",
      status: "Submit",
    });
    assert.equal(validationMaterialGroupCode, "PACK");
    assert.equal(
      queryLog.some(
        entry =>
          /UPDATE mat_single_request[\s\S]*material_group_id = \$\d/i.test(
            entry.queryText
          ) &&
          /UPDATE mat_single_request[\s\S]*material_sub_group_id = \$\d/i.test(
            entry.queryText
          ) &&
          /updated_at = NOW\(\)/i.test(entry.queryText) &&
          entry.params.includes(21) &&
          entry.params.includes(210)
      ),
      true
    );
  } finally {
    db.connect = originalConnect;
    Material.getSubGroupById = originalGetSubGroupById;
    MaterialTemplate.validateMaterialRequestTemplate =
      originalValidateMaterialRequestTemplate;
  }
});

test("saveSingleRequestRework controller parses multipart keepAttachmentIds and uploaded files", async () => {
  const formidable = require("formidable");
  const fs = require("fs");
  const originalIncomingForm = formidable.IncomingForm;
  const originalExistsSync = fs.existsSync;
  const originalUnlinkSync = fs.unlinkSync;
  const originalGetMaterialGroupByCode = Material.getMaterialGroupByCode;
  const originalGetSubGroupById = Material.getSubGroupById;
  const originalSaveSingleRequestRework = Material.saveSingleRequestRework;
  const unlinked = [];
  let receivedPayload = null;

  formidable.IncomingForm = function IncomingFormStub() {
    this.options = {};
    this.parse = async () => [
      {
        materialGroupCode: "CHEM",
        subgroup: "110",
        requestFields: JSON.stringify({
          material_description: "Changed desc",
          base_uom: "KG",
          plant: "P1",
          storage_location: "S1",
        }),
        templateValues: JSON.stringify({ density: "1.2" }),
        attachments: JSON.stringify({ keepAttachmentIds: [10] }),
      },
      {
        files: [
          {
            filepath: "C:\\tmp\\upload-1.pdf",
            originalFilename: "upload-1.pdf",
          },
        ],
      },
    ];
  };
  fs.existsSync = filepath => String(filepath).includes("upload-1.pdf");
  fs.unlinkSync = filepath => {
    unlinked.push(filepath);
  };
  Material.getMaterialGroupByCode = async () => ({ id: 12, code: "CHEM" });
  Material.getSubGroupById = async () => ({
    id: 110,
    item_group_id: 12,
    subgroup_code: "SUB",
    deleted_at: null,
  });
  Material.saveSingleRequestRework = async payload => {
    receivedPayload = payload;
    return { request_id: 77, stage: "Approval 1", status: "Submit" };
  };

  const req = {
    params: { id: "77" },
    cookies: { user_id: "REQ-01", username: "requester.user" },
    headers: { "content-type": "multipart/form-data; boundary=123" },
  };
  const response = {
    statusCode: null,
    jsonPayload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.jsonPayload = payload;
      return this;
    },
  };

  try {
    await MaterialController.saveSingleRequestRework(req, response);

    assert.equal(response.statusCode, 200);
    assert.ok(receivedPayload);
    assert.equal(receivedPayload.requestId, "77");
    assert.equal(receivedPayload.editedRequest.material_group_id, 12);
    assert.equal(receivedPayload.editedRequest.material_sub_group_id, 110);
    assert.equal(receivedPayload.editedRequest.base_uom, "KG");
    assert.deepEqual(receivedPayload.attachments.keepAttachmentIds, [10]);
    assert.equal(receivedPayload.attachments.newAttachments.length, 1);
    assert.match(
      receivedPayload.attachments.newAttachments[0].relativePath,
      /single-request-attachments\/CHEM\/SUB\/.+upload-1\.pdf/i
    );
    assert.deepEqual(unlinked, ["C:\\tmp\\upload-1.pdf"]);
  } finally {
    formidable.IncomingForm = originalIncomingForm;
    fs.existsSync = originalExistsSync;
    fs.unlinkSync = originalUnlinkSync;
    Material.getMaterialGroupByCode = originalGetMaterialGroupByCode;
    Material.getSubGroupById = originalGetSubGroupById;
    Material.saveSingleRequestRework = originalSaveSingleRequestRework;
  }
});

test("saveSingleRequestRework controller rejects non-multipart attachment updates", async () => {
  const req = {
    headers: { "content-type": "application/json" },
    body: {
      editedRequest: { material_description: "Updated" },
      attachments: { keepAttachmentIds: [10] },
    },
  };
  const response = {
    statusCode: null,
    jsonPayload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.jsonPayload = payload;
      return this;
    },
  };

  await MaterialController.saveSingleRequestRework(req, response);

  assert.equal(response.statusCode, 400);
  assert.match(
    response.jsonPayload.message,
    /Attachment updates for single request rework require multipart\/form-data/i
  );
});

test("attachment path helpers normalize and contain filesystem paths", () => {
  assert.match(
    Material.__private.normalizeSingleRequestAttachmentRelativePath.toString(),
    /path\.posix[\s\S]*\.normalize/
  );
  assert.match(
    Material.__private.normalizeSingleRequestAttachmentRelativePath.toString(),
    /single-request-attachments\//
  );
  assert.match(
    Material.__private.normalizeSingleRequestAttachmentRelativePath.toString(),
    /Invalid single request attachment path/
  );
  assert.throws(
    () =>
      Material.__private.normalizeSingleRequestAttachmentRelativePath(
        "single-request-attachments/../../secrets.txt"
      ),
    /Invalid single request attachment path/
  );
});

test("serveFile resolves files inside configured directories only", () => {
  assert.match(
    MaterialController.serveFile.toString(),
    /resolveMaterialFilePath/
  );
  const controllerSource = require("fs").readFileSync(
    require("path").join(__dirname, "../controllers/MaterialController.js"),
    "utf8"
  );
  assert.match(controllerSource, /path\.resolve\(absoluteDirectory, normalizedFilename\)/);
  assert.match(controllerSource, /candidatePath\.startsWith\(directoryPrefix\)/);
});
