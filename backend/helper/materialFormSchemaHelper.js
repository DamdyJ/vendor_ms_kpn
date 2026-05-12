const REQUEST_SECTION_KEY_MAP = {
    PRODUCT: "basic_info",
    PRODUCT_DESCRIPTION: "basic_info",
    BASIC_DATA: "basic_info",
    PLANT_DATA: "plant_data",
    SALES_DATA: "sales_data",
    ACCOUNTING_DATA: "accounting_data",
};

const SECTION_TITLES = {
    basic_info: "Basic Info",
    plant_data: "Plant Data",
    sales_data: "Sales Data",
    accounting_data: "Accounting Data",
    specification: "Specification",
};

const SECTION_ORDER = [
    "basic_info",
    "plant_data",
    "sales_data",
    "accounting_data",
    "specification",
];

const toNumberOrNull = value => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const normalizeSectionKey = value => {
    if (!value) {
        return null;
    }

    return String(value)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
};

const resolveRequestSectionKey = sectionName => {
    const mappedSection =
        REQUEST_SECTION_KEY_MAP[String(sectionName || "").toUpperCase()];
    return mappedSection || normalizeSectionKey(sectionName) || "basic_info";
};

const resolveSectionTitle = sectionKey =>
    SECTION_TITLES[sectionKey] ||
    String(sectionKey || "")
        .split("_")
        .filter(Boolean)
        .map(token => token.charAt(0).toUpperCase() + token.slice(1))
        .join(" ");

const normalizeUiMetadata = (uiMetadata = []) => {
    const entries = new Map();

    for (const row of uiMetadata) {
        const fieldKey = row.fieldKey || row.field_key;
        if (!fieldKey) {
            continue;
        }

        entries.set(fieldKey, {
            fieldKey,
            sectionKey: normalizeSectionKey(
                row.sectionKey || row.section_key || row.sectionName
            ),
            fieldLabel:
                row.fieldLabel ||
                row.field_label ||
                row.label ||
                row.label_override ||
                null,
            helperText:
                row.helperText ||
                row.helper_text ||
                row.notes ||
                row.description ||
                null,
            placeholder:
                row.placeholder ||
                row.placeholder_text ||
                row.placeholder_value ||
                null,
            displayOrder:
                toNumberOrNull(row.displayOrder) ??
                toNumberOrNull(row.display_order),
        });
    }

    return entries;
};

const createSectionMap = () => new Map();

const ensureSection = (sections, sectionKey) => {
    if (!sections.has(sectionKey)) {
        sections.set(sectionKey, {
            key: sectionKey,
            title: resolveSectionTitle(sectionKey),
            fields: [],
        });
    }

    return sections.get(sectionKey);
};

const pushRequestField = (sections, requestFieldRule, override) => {
    const fallbackSectionKey = resolveRequestSectionKey(
        requestFieldRule.sectionName
    );
    const sectionKey = override.sectionKey || fallbackSectionKey;
    const section = ensureSection(sections, sectionKey);

    section.fields.push({
        kind: "request_rule",
        fieldKey: requestFieldRule.fieldKey,
        label: override.fieldLabel || requestFieldRule.fieldLabel,
        helperText: override.helperText || requestFieldRule.notes || null,
        placeholder: override.placeholder || null,
        dataType: "TEXT",
        sectionKey,
        sourceSectionName: requestFieldRule.sectionName,
        displayOrder:
            override.displayOrder ?? requestFieldRule.displayOrder ?? 0,
        isRequired: Boolean(requestFieldRule.isRequired),
        isLocked: Boolean(requestFieldRule.isLocked),
        defaultValue: requestFieldRule.defaultValue ?? null,
        sourceType: requestFieldRule.sourceType ?? null,
        sourceReference: requestFieldRule.sourceReference ?? null,
        notes: requestFieldRule.notes ?? null,
    });
};

const pushTemplateField = (sections, templateFieldRule, override) => {
    const sectionKey = override.sectionKey || "specification";
    const section = ensureSection(sections, sectionKey);

    section.fields.push({
        kind: "template_field",
        fieldKey: templateFieldRule.fieldKey,
        fieldCode: templateFieldRule.fieldCode ?? null,
        fieldId: templateFieldRule.fieldId ?? null,
        label: override.fieldLabel || templateFieldRule.fieldNameId,
        helperText: override.helperText || templateFieldRule.ruleDetail || null,
        placeholder: override.placeholder || null,
        dataType: templateFieldRule.dataType || "TEXT",
        sectionKey,
        displayOrder:
            override.displayOrder ?? templateFieldRule.fieldOrder ?? 0,
        isRequired: Boolean(templateFieldRule.isMandatory),
        validationRuleType: templateFieldRule.validationRuleType ?? null,
        prefixValue: templateFieldRule.prefixValue ?? null,
        maxLength: templateFieldRule.maxLength ?? null,
        ruleDetail: templateFieldRule.ruleDetail ?? null,
    });
};

const sortSections = sections =>
    Array.from(sections.values())
        .map(section => ({
            ...section,
            fields: [...section.fields].sort((left, right) => {
                if (left.displayOrder !== right.displayOrder) {
                    return left.displayOrder - right.displayOrder;
                }

                return left.fieldKey.localeCompare(right.fieldKey);
            }),
        }))
        .sort((left, right) => {
            const leftIndex = SECTION_ORDER.indexOf(left.key);
            const rightIndex = SECTION_ORDER.indexOf(right.key);

            if (leftIndex !== -1 || rightIndex !== -1) {
                const safeLeftIndex =
                    leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
                const safeRightIndex =
                    rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;

                if (safeLeftIndex !== safeRightIndex) {
                    return safeLeftIndex - safeRightIndex;
                }
            }

            return left.title.localeCompare(right.title);
        });

const buildMaterialFormSchema = ({
    materialGroup = null,
    subgroups = [],
    requestFieldRules = [],
    template = null,
    uiMetadata = [],
}) => {
    const sections = createSectionMap();
    const uiOverrides = normalizeUiMetadata(uiMetadata);

    for (const requestFieldRule of requestFieldRules) {
        const override = uiOverrides.get(requestFieldRule.fieldKey) || {};
        pushRequestField(sections, requestFieldRule, override);
    }

    const templateFields = Array.isArray(template?.fields)
        ? template.fields
        : [];
    for (const templateFieldRule of templateFields) {
        const override = uiOverrides.get(templateFieldRule.fieldKey) || {};
        pushTemplateField(sections, templateFieldRule, override);
    }

    return {
        materialGroup,
        template,
        subgroups,
        sections: sortSections(sections),
    };
};

module.exports = {
    buildMaterialFormSchema,
    REQUEST_SECTION_KEY_MAP,
};
