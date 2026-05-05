const test = require("node:test");
const assert = require("node:assert/strict");

const {
    buildMaterialFormSchema,
} = require("../helper/materialFormSchemaHelper.js");

test("buildMaterialFormSchema groups request and template fields into renderable sections", () => {
    const schema = buildMaterialFormSchema({
        materialGroup: {
            id: 10,
            code: "MECH",
            name: "Mechanical",
        },
        subgroups: [
            { id: 21, code: "BRG", name: "Bearing" },
            { id: 22, code: "BLT", name: "Bolt" },
        ],
        requestFieldRules: [
            {
                fieldKey: "material_type",
                sectionName: "PRODUCT",
                fieldLabel: "Material Type",
                notes: "Choose SAP material type",
                displayOrder: 2,
                isRequired: true,
                isLocked: false,
                defaultValue: null,
                sourceType: null,
                sourceReference: null,
            },
            {
                fieldKey: "material_description",
                sectionName: "PRODUCT_DESCRIPTION",
                fieldLabel: "Material Description",
                notes: "Generated from template",
                displayOrder: 3,
                isRequired: true,
                isLocked: true,
                defaultValue: null,
                sourceType: "COMPUTED_TEMPLATE",
                sourceReference: null,
            },
            {
                fieldKey: "base_unit_of_measure",
                sectionName: "BASIC_DATA",
                fieldLabel: "Base Unit",
                notes: "Required for UoM",
                displayOrder: 4,
                isRequired: true,
                isLocked: false,
                defaultValue: "EA",
                sourceType: null,
                sourceReference: null,
            },
        ],
        template: {
            templateId: 50,
            templateCode: "MECHANICAL_COMPONENT",
            templateName: "Mechanical Component",
            materialGroupCode: "MECH",
            fields: [
                {
                    templateRuleId: 1,
                    fieldId: 101,
                    fieldCode: "MFG",
                    fieldKey: "manufacturer",
                    fieldNameId: "Manufacturer",
                    dataType: "TEXT",
                    fieldOrder: 1,
                    isMandatory: true,
                    validationRuleType: "CAPITAL_ONLY",
                    prefixValue: null,
                    ruleDetail: "Use uppercase manufacturer name",
                    maxLength: 20,
                },
                {
                    templateRuleId: 2,
                    fieldId: 102,
                    fieldCode: "SIZE",
                    fieldKey: "size",
                    fieldNameId: "Size",
                    dataType: "TEXT",
                    fieldOrder: 2,
                    isMandatory: false,
                    validationRuleType: "NONE",
                    prefixValue: null,
                    ruleDetail: "Optional dimensions",
                    maxLength: 10,
                },
            ],
        },
    });

    assert.deepEqual(schema.materialGroup, {
        id: 10,
        code: "MECH",
        name: "Mechanical",
    });
    assert.equal(schema.template.templateCode, "MECHANICAL_COMPONENT");
    assert.equal(schema.subgroups.length, 2);
    assert.deepEqual(
        schema.sections.map(section => section.key),
        ["basic_info", "specification"]
    );

    const basicInfo = schema.sections[0];
    assert.equal(basicInfo.title, "Basic Info");
    assert.deepEqual(
        basicInfo.fields.map(field => field.fieldKey),
        [
            "material_type",
            "material_description",
            "base_unit_of_measure",
        ]
    );
    assert.equal(basicInfo.fields[1].helperText, "Generated from template");

    const specification = schema.sections[1];
    assert.equal(specification.title, "Specification");
    assert.deepEqual(
        specification.fields.map(field => field.fieldKey),
        ["manufacturer", "size"]
    );
});

test("buildMaterialFormSchema prefers UI metadata overrides over fallback labels and helper text", () => {
    const schema = buildMaterialFormSchema({
        materialGroup: {
            id: 11,
            code: "ELEC",
            name: "Electrical",
        },
        subgroups: [],
        requestFieldRules: [
            {
                fieldKey: "material_type",
                sectionName: "PRODUCT",
                fieldLabel: "Material Type",
                notes: "Fallback request helper",
                displayOrder: 1,
                isRequired: true,
                isLocked: false,
                defaultValue: null,
                sourceType: null,
                sourceReference: null,
            },
        ],
        template: {
            templateId: 51,
            templateCode: "ELECTRICAL_COMPONENT",
            templateName: "Electrical Component",
            materialGroupCode: "ELEC",
            fields: [
                {
                    templateRuleId: 3,
                    fieldId: 201,
                    fieldCode: "VLT",
                    fieldKey: "voltage",
                    fieldNameId: "Voltage",
                    dataType: "TEXT",
                    fieldOrder: 1,
                    isMandatory: true,
                    validationRuleType: "NONE",
                    prefixValue: null,
                    ruleDetail: "Fallback template helper",
                    maxLength: 12,
                },
            ],
        },
        uiMetadata: [
            {
                fieldKey: "material_type",
                sectionKey: "sales_data",
                fieldLabel: "Commercial Material Type",
                helperText: "Override request helper",
                placeholder: "Pick material type",
                displayOrder: 9,
            },
            {
                fieldKey: "voltage",
                fieldLabel: "Nominal Voltage",
                helperText: "Override template helper",
                placeholder: "e.g. 24V DC",
            },
        ],
    });

    const salesData = schema.sections.find(section => section.key === "sales_data");
    assert.ok(salesData);
    assert.equal(salesData.fields[0].label, "Commercial Material Type");
    assert.equal(salesData.fields[0].helperText, "Override request helper");
    assert.equal(salesData.fields[0].placeholder, "Pick material type");

    const specification = schema.sections.find(
        section => section.key === "specification"
    );
    assert.ok(specification);
    assert.equal(specification.fields[0].label, "Nominal Voltage");
    assert.equal(specification.fields[0].helperText, "Override template helper");
    assert.equal(specification.fields[0].placeholder, "e.g. 24V DC");
});
