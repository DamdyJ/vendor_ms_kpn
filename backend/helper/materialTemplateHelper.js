const MAX_MATERIAL_DESCRIPTION_LENGTH = 40;

const normalizeWhitespace = value =>
    String(value || "")
        .replace(/\s+/g, " ")
        .trim();

const normalizeTemplateValue = value =>
    normalizeWhitespace(value).toUpperCase();

const hasValue = value =>
    value !== undefined &&
    value !== null &&
    !(typeof value === "string" && normalizeWhitespace(value) === "");

const TEMPLATE_VALIDATORS = {
    PREFIX: (value, rule) => {
        if (!hasValue(value)) return { valid: true, normalizedValue: "" };

        const prefixes = normalizeTemplateValue(rule.prefix_value || "")
            .split("|")
            .map(item => item.trim())
            .filter(Boolean);
        const normalizedValue = normalizeTemplateValue(value);
        if (prefixes.length === 0) return { valid: true, normalizedValue };

        const matchedPrefix = prefixes.find(prefix =>
            normalizedValue.startsWith(prefix)
        );

        if (matchedPrefix) {
            return { valid: true, normalizedValue };
        }

        return {
            valid: false,
            normalizedValue,
        };
    },
    CAPITAL_ONLY: value => {
        if (!hasValue(value)) return { valid: true, normalizedValue: "" };
        const normalizedValue = normalizeTemplateValue(value);
        return {
            valid: /^[A-Z ]+$/.test(normalizedValue),
            normalizedValue,
        };
    },
    CAPITAL_NO_SPECIAL_CHARS: value => {
        if (!hasValue(value)) return { valid: true, normalizedValue: "" };
        const normalizedValue = normalizeTemplateValue(value);
        return {
            valid: /^[A-Z ]+$/.test(normalizedValue),
            normalizedValue,
        };
    },
    ALPHANUMERIC_CAPITAL: value => {
        if (!hasValue(value)) return { valid: true, normalizedValue: "" };
        const normalizedValue = normalizeTemplateValue(value);
        return {
            valid: /^[A-Z0-9 ]+$/.test(normalizedValue),
            normalizedValue,
        };
    },
    MIXED_ALPHA_NUM_UNIT: value => {
        if (!hasValue(value)) return { valid: true, normalizedValue: "" };
        const normalizedValue = normalizeTemplateValue(value);
        return {
            valid: /^[A-Z0-9 .,\-\/()%]+$/.test(normalizedValue),
            normalizedValue,
        };
    },
    NUMERIC_ONLY: value => {
        if (!hasValue(value)) return { valid: true, normalizedValue: "" };
        const normalizedValue = normalizeTemplateValue(value).replace(
            /,/g,
            "."
        );
        return {
            valid: /^[0-9]+(\.[0-9]+)?$/.test(normalizedValue),
            normalizedValue,
        };
    },
    NONE: value => ({
        valid: true,
        normalizedValue: hasValue(value) ? normalizeTemplateValue(value) : "",
    }),
};

const mapTemplateConfigRows = rows => {
    if (!rows.length) return null;

    const firstRow = rows[0];
    const fieldRules = rows.map(row => ({
        templateRuleId: row.template_rule_id,
        fieldId: row.field_id,
        fieldCode: row.field_code,
        fieldKey: row.field_key,
        fieldNameId: row.field_name_id,
        dataType: row.data_type,
        fieldOrder: row.field_order,
        isMandatory: row.is_mandatory,
        validationRuleType: row.validation_rule_type,
        prefixValue: row.prefix_value,
        ruleDetail: row.rule_detail,
        maxLength: row.max_length,
    }));

    return {
        templateId: firstRow.template_id,
        templateCode: firstRow.template_code,
        templateName: firstRow.template_name,
        materialGroupCode: firstRow.material_group_code,
        fields: fieldRules,
    };
};

const validateTemplateValues = (templateConfig, rawValues = {}) => {
    const errors = [];
    const normalizedValues = {};
    const descriptionParts = [];

    for (const fieldRule of templateConfig.fields) {
        const rawValue = rawValues[fieldRule.fieldKey];
        const validator =
            TEMPLATE_VALIDATORS[fieldRule.validationRuleType] ||
            TEMPLATE_VALIDATORS.NONE;
        const result = validator(rawValue, {
            prefix_value: fieldRule.prefixValue,
        });
        const normalizedValue = result.normalizedValue || "";

        if (fieldRule.isMandatory && !normalizedValue) {
            errors.push({
                fieldKey: fieldRule.fieldKey,
                fieldLabel: fieldRule.fieldNameId,
                message: `${fieldRule.fieldNameId} wajib diisi`,
            });
        }

        if (normalizedValue && !result.valid) {
            errors.push({
                fieldKey: fieldRule.fieldKey,
                fieldLabel: fieldRule.fieldNameId,
                message: `${fieldRule.fieldNameId} tidak sesuai rule ${fieldRule.validationRuleType}`,
            });
        }

        if (
            normalizedValue &&
            fieldRule.maxLength &&
            normalizedValue.length > fieldRule.maxLength
        ) {
            errors.push({
                fieldKey: fieldRule.fieldKey,
                fieldLabel: fieldRule.fieldNameId,
                message: `${fieldRule.fieldNameId} melebihi ${fieldRule.maxLength} karakter`,
            });
        }

        normalizedValues[fieldRule.fieldKey] = normalizedValue;
        if (normalizedValue) {
            descriptionParts.push(normalizedValue);
        }
    }

    const fullDescription = normalizeWhitespace(descriptionParts.join(" "));
    const exceedsMaterialDescriptionLimit =
        fullDescription.length > MAX_MATERIAL_DESCRIPTION_LENGTH;

    if (exceedsMaterialDescriptionLimit) {
        errors.push({
            fieldKey: "material_description",
            fieldLabel: "Material Description",
            message: `Material Description melebihi ${MAX_MATERIAL_DESCRIPTION_LENGTH} karakter`,
        });
    }

    return {
        errors,
        normalizedValues,
        fullDescription,
        materialDescription: fullDescription,
        exceedsMaterialDescriptionLimit,
    };
};

module.exports = {
    MAX_MATERIAL_DESCRIPTION_LENGTH,
    hasValue,
    mapTemplateConfigRows,
    normalizeTemplateValue,
    normalizeWhitespace,
    validateTemplateValues,
};
