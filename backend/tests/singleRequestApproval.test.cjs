const assert = require("node:assert/strict");
const test = require("node:test");
const Material = require("../models/MaterialModel");
const MaterialController = require("../controllers/MaterialController");
const db = require("../config/connection");
const MaterialTemplate = require("../models/MaterialTemplateModel");
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
    /'approved_by_user_id', eh\.approved_by_user_id[\s\S]*'approve_remark', eh\.approve_remark[\s\S]*'created_by', eh\.created_by[\s\S]*'created_at', eh\.created_at/i
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
