CREATE TABLE IF NOT EXISTS public.mat_request_field_rules (
    rule_id serial4 PRIMARY KEY,
    field_key varchar(100) NOT NULL UNIQUE,
    section_name varchar(50) NOT NULL,
    field_label varchar(100) NOT NULL,
    display_order int4 NOT NULL,
    is_required bool NOT NULL DEFAULT false,
    is_locked bool NOT NULL DEFAULT false,
    default_value varchar(255) NULL,
    source_type varchar(50) NULL,
    source_reference varchar(100) NULL,
    notes text NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mat_request_field_rules
    DROP COLUMN IF EXISTS max_length;

CREATE TABLE IF NOT EXISTS public.mat_template_master (
    template_id serial4 PRIMARY KEY,
    template_code varchar(100) NOT NULL UNIQUE,
    template_name varchar(150) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mat_template_group_map (
    template_group_map_id serial4 PRIMARY KEY,
    template_id int4 NOT NULL
        REFERENCES public.mat_template_master(template_id)
        ON DELETE CASCADE,
    material_group_code varchar(10) NOT NULL UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mat_field_master (
    field_id serial4 PRIMARY KEY,
    field_code varchar(10) NOT NULL UNIQUE,
    field_key varchar(100) NOT NULL UNIQUE,
    field_name_id varchar(100) NOT NULL,
    data_type varchar(20) NOT NULL DEFAULT 'TEXT',
    is_template_field bool NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mat_template_field_rules (
    template_rule_id serial4 PRIMARY KEY,
    template_id int4 NOT NULL
        REFERENCES public.mat_template_master(template_id)
        ON DELETE CASCADE,
    field_id int4 NOT NULL
        REFERENCES public.mat_field_master(field_id)
        ON DELETE CASCADE,
    field_order int4 NOT NULL,
    is_mandatory bool NOT NULL DEFAULT false,
    validation_rule_type varchar(50) NULL,
    prefix_value varchar(50) NULL,
    rule_detail text NULL,
    max_length int4 NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT mat_template_field_rules_un_template_field UNIQUE (template_id, field_id),
    CONSTRAINT mat_template_field_rules_un_template_order UNIQUE (template_id, field_order)
);

-- Seed: request field rules
INSERT INTO public.mat_request_field_rules (
    field_key, section_name, field_label, display_order, is_required, is_locked,
    default_value, source_type, source_reference, notes, updated_at
) VALUES (
    'material_number', 'PRODUCT', 'Material', 1, false, true,
    NULL, 'SYSTEM', 'SAP_MATERIAL_NUMBER', 'Tidak dapat diubah', NOW()
) ON CONFLICT (field_key) DO UPDATE SET
    section_name = EXCLUDED.section_name,
    field_label = EXCLUDED.field_label,
    display_order = EXCLUDED.display_order,
    is_required = EXCLUDED.is_required,
    is_locked = EXCLUDED.is_locked,
    default_value = EXCLUDED.default_value,
    source_type = EXCLUDED.source_type,
    source_reference = EXCLUDED.source_reference,
    notes = EXCLUDED.notes,
    updated_at = NOW();
INSERT INTO public.mat_request_field_rules (
    field_key, section_name, field_label, display_order, is_required, is_locked,
    default_value, source_type, source_reference, notes, updated_at
) VALUES (
    'industry_sector', 'PRODUCT', 'Industry Sector', 2, true, true,
    'C - CHEMICAL INDUSTRY', 'STATIC_DEFAULT', NULL, 'Default "C - Chemical Industry" dan tidak dapat diubah', NOW()
) ON CONFLICT (field_key) DO UPDATE SET
    section_name = EXCLUDED.section_name,
    field_label = EXCLUDED.field_label,
    display_order = EXCLUDED.display_order,
    is_required = EXCLUDED.is_required,
    is_locked = EXCLUDED.is_locked,
    default_value = EXCLUDED.default_value,
    source_type = EXCLUDED.source_type,
    source_reference = EXCLUDED.source_reference,
    notes = EXCLUDED.notes,
    updated_at = NOW();
INSERT INTO public.mat_request_field_rules (
    field_key, section_name, field_label, display_order, is_required, is_locked,
    default_value, source_type, source_reference, notes, updated_at
) VALUES (
    'material_type', 'PRODUCT', 'Material Type', 3, true, false,
    NULL, 'USER_INPUT', NULL, 'Ditentukan pengguna', NOW()
) ON CONFLICT (field_key) DO UPDATE SET
    section_name = EXCLUDED.section_name,
    field_label = EXCLUDED.field_label,
    display_order = EXCLUDED.display_order,
    is_required = EXCLUDED.is_required,
    is_locked = EXCLUDED.is_locked,
    default_value = EXCLUDED.default_value,
    source_type = EXCLUDED.source_type,
    source_reference = EXCLUDED.source_reference,
    notes = EXCLUDED.notes,
    updated_at = NOW();
INSERT INTO public.mat_request_field_rules (
    field_key, section_name, field_label, display_order, is_required, is_locked,
    default_value, source_type, source_reference, notes, updated_at
) VALUES (
    'language', 'PRODUCT_DESCRIPTION', 'Language', 4, true, true,
    'EN', 'STATIC_DEFAULT', NULL, 'Default "EN" dan tidak dapat diubah', NOW()
) ON CONFLICT (field_key) DO UPDATE SET
    section_name = EXCLUDED.section_name,
    field_label = EXCLUDED.field_label,
    display_order = EXCLUDED.display_order,
    is_required = EXCLUDED.is_required,
    is_locked = EXCLUDED.is_locked,
    default_value = EXCLUDED.default_value,
    source_type = EXCLUDED.source_type,
    source_reference = EXCLUDED.source_reference,
    notes = EXCLUDED.notes,
    updated_at = NOW();
INSERT INTO public.mat_request_field_rules (
    field_key, section_name, field_label, display_order, is_required, is_locked,
    default_value, source_type, source_reference, notes, updated_at
) VALUES (
    'material_description', 'PRODUCT_DESCRIPTION', 'Material Description', 5, true, true,
    NULL, 'COMPUTED_TEMPLATE', 'MAT_TEMPLATE', 'Wajib diisi, maksimal 40 karakter, auto uppercase', NOW()
) ON CONFLICT (field_key) DO UPDATE SET
    section_name = EXCLUDED.section_name,
    field_label = EXCLUDED.field_label,
    display_order = EXCLUDED.display_order,
    is_required = EXCLUDED.is_required,
    is_locked = EXCLUDED.is_locked,
    default_value = EXCLUDED.default_value,
    source_type = EXCLUDED.source_type,
    source_reference = EXCLUDED.source_reference,
    notes = EXCLUDED.notes,
    updated_at = NOW();
INSERT INTO public.mat_request_field_rules (
    field_key, section_name, field_label, display_order, is_required, is_locked,
    default_value, source_type, source_reference, notes, updated_at
) VALUES (
    'purchase_order_text', 'PRODUCT_DESCRIPTION', 'Purchase Order Text', 6, false, false,
    NULL, 'USER_INPUT', NULL, 'Optional; tidak diisi otomatis dari Material Description', NOW()
) ON CONFLICT (field_key) DO UPDATE SET
    section_name = EXCLUDED.section_name,
    field_label = EXCLUDED.field_label,
    display_order = EXCLUDED.display_order,
    is_required = EXCLUDED.is_required,
    is_locked = EXCLUDED.is_locked,
    default_value = EXCLUDED.default_value,
    source_type = EXCLUDED.source_type,
    source_reference = EXCLUDED.source_reference,
    notes = EXCLUDED.notes,
    updated_at = NOW();
INSERT INTO public.mat_request_field_rules (
    field_key, section_name, field_label, display_order, is_required, is_locked,
    default_value, source_type, source_reference, notes, updated_at
) VALUES (
    'material_group', 'BASIC_DATA', 'Material Group', 7, true, false,
    NULL, 'USER_INPUT', 'MAT_ITEM_GROUP', 'Wajib diisi dan ditentukan pengguna', NOW()
) ON CONFLICT (field_key) DO UPDATE SET
    section_name = EXCLUDED.section_name,
    field_label = EXCLUDED.field_label,
    display_order = EXCLUDED.display_order,
    is_required = EXCLUDED.is_required,
    is_locked = EXCLUDED.is_locked,
    default_value = EXCLUDED.default_value,
    source_type = EXCLUDED.source_type,
    source_reference = EXCLUDED.source_reference,
    notes = EXCLUDED.notes,
    updated_at = NOW();
INSERT INTO public.mat_request_field_rules (
    field_key, section_name, field_label, display_order, is_required, is_locked,
    default_value, source_type, source_reference, notes, updated_at
) VALUES (
    'old_material_number', 'BASIC_DATA', 'Old Material Number', 8, false, false,
    NULL, 'USER_INPUT', NULL, 'Optional', NOW()
) ON CONFLICT (field_key) DO UPDATE SET
    section_name = EXCLUDED.section_name,
    field_label = EXCLUDED.field_label,
    display_order = EXCLUDED.display_order,
    is_required = EXCLUDED.is_required,
    is_locked = EXCLUDED.is_locked,
    default_value = EXCLUDED.default_value,
    source_type = EXCLUDED.source_type,
    source_reference = EXCLUDED.source_reference,
    notes = EXCLUDED.notes,
    updated_at = NOW();
INSERT INTO public.mat_request_field_rules (
    field_key, section_name, field_label, display_order, is_required, is_locked,
    default_value, source_type, source_reference, notes, updated_at
) VALUES (
    'division', 'BASIC_DATA', 'Division', 9, true, true,
    '90', 'STATIC_DEFAULT', NULL, 'Default "90" dan tidak dapat diubah', NOW()
) ON CONFLICT (field_key) DO UPDATE SET
    section_name = EXCLUDED.section_name,
    field_label = EXCLUDED.field_label,
    display_order = EXCLUDED.display_order,
    is_required = EXCLUDED.is_required,
    is_locked = EXCLUDED.is_locked,
    default_value = EXCLUDED.default_value,
    source_type = EXCLUDED.source_type,
    source_reference = EXCLUDED.source_reference,
    notes = EXCLUDED.notes,
    updated_at = NOW();
INSERT INTO public.mat_request_field_rules (
    field_key, section_name, field_label, display_order, is_required, is_locked,
    default_value, source_type, source_reference, notes, updated_at
) VALUES (
    'base_unit_of_measure', 'BASIC_DATA', 'Base Unit of Measure', 10, true, false,
    NULL, 'USER_INPUT', 'SAP_BASE_UOM', 'Wajib diisi dan ditentukan pengguna', NOW()
) ON CONFLICT (field_key) DO UPDATE SET
    section_name = EXCLUDED.section_name,
    field_label = EXCLUDED.field_label,
    display_order = EXCLUDED.display_order,
    is_required = EXCLUDED.is_required,
    is_locked = EXCLUDED.is_locked,
    default_value = EXCLUDED.default_value,
    source_type = EXCLUDED.source_type,
    source_reference = EXCLUDED.source_reference,
    notes = EXCLUDED.notes,
    updated_at = NOW();
INSERT INTO public.mat_request_field_rules (
    field_key, section_name, field_label, display_order, is_required, is_locked,
    default_value, source_type, source_reference, notes, updated_at
) VALUES (
    'plant', 'PLANT_DATA', 'Plant', 11, true, false,
    NULL, 'USER_INPUT', 'SAP_PLANT_MASTER', 'Wajib diisi dan ditentukan pengguna', NOW()
) ON CONFLICT (field_key) DO UPDATE SET
    section_name = EXCLUDED.section_name,
    field_label = EXCLUDED.field_label,
    display_order = EXCLUDED.display_order,
    is_required = EXCLUDED.is_required,
    is_locked = EXCLUDED.is_locked,
    default_value = EXCLUDED.default_value,
    source_type = EXCLUDED.source_type,
    source_reference = EXCLUDED.source_reference,
    notes = EXCLUDED.notes,
    updated_at = NOW();
INSERT INTO public.mat_request_field_rules (
    field_key, section_name, field_label, display_order, is_required, is_locked,
    default_value, source_type, source_reference, notes, updated_at
) VALUES (
    'availability_check', 'PLANT_DATA', 'Availability Check', 12, true, true,
    '20', 'STATIC_DEFAULT', NULL, 'Default "20" dan tidak dapat diubah', NOW()
) ON CONFLICT (field_key) DO UPDATE SET
    section_name = EXCLUDED.section_name,
    field_label = EXCLUDED.field_label,
    display_order = EXCLUDED.display_order,
    is_required = EXCLUDED.is_required,
    is_locked = EXCLUDED.is_locked,
    default_value = EXCLUDED.default_value,
    source_type = EXCLUDED.source_type,
    source_reference = EXCLUDED.source_reference,
    notes = EXCLUDED.notes,
    updated_at = NOW();
INSERT INTO public.mat_request_field_rules (
    field_key, section_name, field_label, display_order, is_required, is_locked,
    default_value, source_type, source_reference, notes, updated_at
) VALUES (
    'batch_management', 'PLANT_DATA', 'Batch Management', 13, true, false,
    'true', 'BOOLEAN_FLAG', NULL, 'Wajib dicentang', NOW()
) ON CONFLICT (field_key) DO UPDATE SET
    section_name = EXCLUDED.section_name,
    field_label = EXCLUDED.field_label,
    display_order = EXCLUDED.display_order,
    is_required = EXCLUDED.is_required,
    is_locked = EXCLUDED.is_locked,
    default_value = EXCLUDED.default_value,
    source_type = EXCLUDED.source_type,
    source_reference = EXCLUDED.source_reference,
    notes = EXCLUDED.notes,
    updated_at = NOW();
INSERT INTO public.mat_request_field_rules (
    field_key, section_name, field_label, display_order, is_required, is_locked,
    default_value, source_type, source_reference, notes, updated_at
) VALUES (
    'batch_management_plant', 'PLANT_DATA', 'Batch Management (Plant)', 14, true, false,
    'true', 'BOOLEAN_FLAG', NULL, 'Wajib dicentang', NOW()
) ON CONFLICT (field_key) DO UPDATE SET
    section_name = EXCLUDED.section_name,
    field_label = EXCLUDED.field_label,
    display_order = EXCLUDED.display_order,
    is_required = EXCLUDED.is_required,
    is_locked = EXCLUDED.is_locked,
    default_value = EXCLUDED.default_value,
    source_type = EXCLUDED.source_type,
    source_reference = EXCLUDED.source_reference,
    notes = EXCLUDED.notes,
    updated_at = NOW();
INSERT INTO public.mat_request_field_rules (
    field_key, section_name, field_label, display_order, is_required, is_locked,
    default_value, source_type, source_reference, notes, updated_at
) VALUES (
    'transportation_group', 'PLANT_DATA', 'Transportation Group', 15, true, true,
    '3000', 'STATIC_DEFAULT', NULL, 'Default "3000" dan tidak dapat diubah', NOW()
) ON CONFLICT (field_key) DO UPDATE SET
    section_name = EXCLUDED.section_name,
    field_label = EXCLUDED.field_label,
    display_order = EXCLUDED.display_order,
    is_required = EXCLUDED.is_required,
    is_locked = EXCLUDED.is_locked,
    default_value = EXCLUDED.default_value,
    source_type = EXCLUDED.source_type,
    source_reference = EXCLUDED.source_reference,
    notes = EXCLUDED.notes,
    updated_at = NOW();
INSERT INTO public.mat_request_field_rules (
    field_key, section_name, field_label, display_order, is_required, is_locked,
    default_value, source_type, source_reference, notes, updated_at
) VALUES (
    'loading_group', 'PLANT_DATA', 'Loading Group', 16, true, true,
    '1000', 'STATIC_DEFAULT', NULL, 'Default "1000" dan tidak dapat diubah', NOW()
) ON CONFLICT (field_key) DO UPDATE SET
    section_name = EXCLUDED.section_name,
    field_label = EXCLUDED.field_label,
    display_order = EXCLUDED.display_order,
    is_required = EXCLUDED.is_required,
    is_locked = EXCLUDED.is_locked,
    default_value = EXCLUDED.default_value,
    source_type = EXCLUDED.source_type,
    source_reference = EXCLUDED.source_reference,
    notes = EXCLUDED.notes,
    updated_at = NOW();
INSERT INTO public.mat_request_field_rules (
    field_key, section_name, field_label, display_order, is_required, is_locked,
    default_value, source_type, source_reference, notes, updated_at
) VALUES (
    'mrp_type', 'PLANT_DATA', 'MRP Type', 17, true, true,
    'ND', 'STATIC_DEFAULT', NULL, 'Default "ND" dan tidak dapat diubah', NOW()
) ON CONFLICT (field_key) DO UPDATE SET
    section_name = EXCLUDED.section_name,
    field_label = EXCLUDED.field_label,
    display_order = EXCLUDED.display_order,
    is_required = EXCLUDED.is_required,
    is_locked = EXCLUDED.is_locked,
    default_value = EXCLUDED.default_value,
    source_type = EXCLUDED.source_type,
    source_reference = EXCLUDED.source_reference,
    notes = EXCLUDED.notes,
    updated_at = NOW();
INSERT INTO public.mat_request_field_rules (
    field_key, section_name, field_label, display_order, is_required, is_locked,
    default_value, source_type, source_reference, notes, updated_at
) VALUES (
    'profit_center', 'PLANT_DATA', 'Profit Center', 18, true, false,
    NULL, 'PLANT_FILTER', 'SAP_PROFIT_CENTER_BY_PLANT', 'Value di filter berdasarkan kode Plant', NOW()
) ON CONFLICT (field_key) DO UPDATE SET
    section_name = EXCLUDED.section_name,
    field_label = EXCLUDED.field_label,
    display_order = EXCLUDED.display_order,
    is_required = EXCLUDED.is_required,
    is_locked = EXCLUDED.is_locked,
    default_value = EXCLUDED.default_value,
    source_type = EXCLUDED.source_type,
    source_reference = EXCLUDED.source_reference,
    notes = EXCLUDED.notes,
    updated_at = NOW();
INSERT INTO public.mat_request_field_rules (
    field_key, section_name, field_label, display_order, is_required, is_locked,
    default_value, source_type, source_reference, notes, updated_at
) VALUES (
    'storage_location', 'PLANT_DATA', 'Storage Location', 19, true, false,
    NULL, 'PLANT_FILTER', 'SAP_STORAGE_LOCATION_BY_PLANT', 'Value di filter berdasarkan kode Plant', NOW()
) ON CONFLICT (field_key) DO UPDATE SET
    section_name = EXCLUDED.section_name,
    field_label = EXCLUDED.field_label,
    display_order = EXCLUDED.display_order,
    is_required = EXCLUDED.is_required,
    is_locked = EXCLUDED.is_locked,
    default_value = EXCLUDED.default_value,
    source_type = EXCLUDED.source_type,
    source_reference = EXCLUDED.source_reference,
    notes = EXCLUDED.notes,
    updated_at = NOW();
INSERT INTO public.mat_request_field_rules (
    field_key, section_name, field_label, display_order, is_required, is_locked,
    default_value, source_type, source_reference, notes, updated_at
) VALUES (
    'sales_organization', 'SALES_DATA', 'Sales Organization', 20, true, false,
    NULL, 'PLANT_FILTER', 'SAP_SALES_ORG_BY_PLANT', 'Value di filter berdasarkan kode Plant', NOW()
) ON CONFLICT (field_key) DO UPDATE SET
    section_name = EXCLUDED.section_name,
    field_label = EXCLUDED.field_label,
    display_order = EXCLUDED.display_order,
    is_required = EXCLUDED.is_required,
    is_locked = EXCLUDED.is_locked,
    default_value = EXCLUDED.default_value,
    source_type = EXCLUDED.source_type,
    source_reference = EXCLUDED.source_reference,
    notes = EXCLUDED.notes,
    updated_at = NOW();
INSERT INTO public.mat_request_field_rules (
    field_key, section_name, field_label, display_order, is_required, is_locked,
    default_value, source_type, source_reference, notes, updated_at
) VALUES (
    'distribution_channel', 'SALES_DATA', 'Distribution Channel', 21, true, false,
    NULL, 'PLANT_FILTER', 'SAP_DISTRIBUTION_CHANNEL_BY_PLANT', 'Value di filter berdasarkan kode Plant', NOW()
) ON CONFLICT (field_key) DO UPDATE SET
    section_name = EXCLUDED.section_name,
    field_label = EXCLUDED.field_label,
    display_order = EXCLUDED.display_order,
    is_required = EXCLUDED.is_required,
    is_locked = EXCLUDED.is_locked,
    default_value = EXCLUDED.default_value,
    source_type = EXCLUDED.source_type,
    source_reference = EXCLUDED.source_reference,
    notes = EXCLUDED.notes,
    updated_at = NOW();
INSERT INTO public.mat_request_field_rules (
    field_key, section_name, field_label, display_order, is_required, is_locked,
    default_value, source_type, source_reference, notes, updated_at
) VALUES (
    'acct_assmt_group_mat', 'SALES_DATA', 'Acct Assmt Group Mat.', 22, true, true,
    '20', 'STATIC_DEFAULT', NULL, 'Default "20" dan tidak dapat diubah', NOW()
) ON CONFLICT (field_key) DO UPDATE SET
    section_name = EXCLUDED.section_name,
    field_label = EXCLUDED.field_label,
    display_order = EXCLUDED.display_order,
    is_required = EXCLUDED.is_required,
    is_locked = EXCLUDED.is_locked,
    default_value = EXCLUDED.default_value,
    source_type = EXCLUDED.source_type,
    source_reference = EXCLUDED.source_reference,
    notes = EXCLUDED.notes,
    updated_at = NOW();
INSERT INTO public.mat_request_field_rules (
    field_key, section_name, field_label, display_order, is_required, is_locked,
    default_value, source_type, source_reference, notes, updated_at
) VALUES (
    'item_category_group', 'SALES_DATA', 'Item Category Group', 23, true, true,
    'NORM', 'STATIC_DEFAULT', NULL, 'Default "NORM" dan tidak dapat diubah', NOW()
) ON CONFLICT (field_key) DO UPDATE SET
    section_name = EXCLUDED.section_name,
    field_label = EXCLUDED.field_label,
    display_order = EXCLUDED.display_order,
    is_required = EXCLUDED.is_required,
    is_locked = EXCLUDED.is_locked,
    default_value = EXCLUDED.default_value,
    source_type = EXCLUDED.source_type,
    source_reference = EXCLUDED.source_reference,
    notes = EXCLUDED.notes,
    updated_at = NOW();
INSERT INTO public.mat_request_field_rules (
    field_key, section_name, field_label, display_order, is_required, is_locked,
    default_value, source_type, source_reference, notes, updated_at
) VALUES (
    'valuation_category', 'ACCOUNTING', 'Valuation Category', 24, true, true,
    'X', 'STATIC_DEFAULT', NULL, 'Default "X" dan tidak dapat diubah', NOW()
) ON CONFLICT (field_key) DO UPDATE SET
    section_name = EXCLUDED.section_name,
    field_label = EXCLUDED.field_label,
    display_order = EXCLUDED.display_order,
    is_required = EXCLUDED.is_required,
    is_locked = EXCLUDED.is_locked,
    default_value = EXCLUDED.default_value,
    source_type = EXCLUDED.source_type,
    source_reference = EXCLUDED.source_reference,
    notes = EXCLUDED.notes,
    updated_at = NOW();
INSERT INTO public.mat_request_field_rules (
    field_key, section_name, field_label, display_order, is_required, is_locked,
    default_value, source_type, source_reference, notes, updated_at
) VALUES (
    'price_determination_control', 'ACCOUNTING', 'Price Determination Control', 25, true, true,
    '2', 'STATIC_DEFAULT', NULL, 'Default "2" dan tidak dapat diubah', NOW()
) ON CONFLICT (field_key) DO UPDATE SET
    section_name = EXCLUDED.section_name,
    field_label = EXCLUDED.field_label,
    display_order = EXCLUDED.display_order,
    is_required = EXCLUDED.is_required,
    is_locked = EXCLUDED.is_locked,
    default_value = EXCLUDED.default_value,
    source_type = EXCLUDED.source_type,
    source_reference = EXCLUDED.source_reference,
    notes = EXCLUDED.notes,
    updated_at = NOW();
INSERT INTO public.mat_request_field_rules (
    field_key, section_name, field_label, display_order, is_required, is_locked,
    default_value, source_type, source_reference, notes, updated_at
) VALUES (
    'valuation_class', 'ACCOUNTING', 'Valuation Class', 26, true, false,
    NULL, 'MATERIAL_GROUP_FILTER', 'SAP_VALUATION_CLASS_BY_GROUP', 'Value di filter berdasarkan kode material group', NOW()
) ON CONFLICT (field_key) DO UPDATE SET
    section_name = EXCLUDED.section_name,
    field_label = EXCLUDED.field_label,
    display_order = EXCLUDED.display_order,
    is_required = EXCLUDED.is_required,
    is_locked = EXCLUDED.is_locked,
    default_value = EXCLUDED.default_value,
    source_type = EXCLUDED.source_type,
    source_reference = EXCLUDED.source_reference,
    notes = EXCLUDED.notes,
    updated_at = NOW();
INSERT INTO public.mat_request_field_rules (
    field_key, section_name, field_label, display_order, is_required, is_locked,
    default_value, source_type, source_reference, notes, updated_at
) VALUES (
    'valuation_class_project_stock', 'ACCOUNTING', 'Valuation Class for Project Stock', 27, true, false,
    NULL, 'MATERIAL_GROUP_FILTER', 'SAP_VALUATION_CLASS_PROJECT_BY_GROUP', 'Value di filter berdasarkan kode material group', NOW()
) ON CONFLICT (field_key) DO UPDATE SET
    section_name = EXCLUDED.section_name,
    field_label = EXCLUDED.field_label,
    display_order = EXCLUDED.display_order,
    is_required = EXCLUDED.is_required,
    is_locked = EXCLUDED.is_locked,
    default_value = EXCLUDED.default_value,
    source_type = EXCLUDED.source_type,
    source_reference = EXCLUDED.source_reference,
    notes = EXCLUDED.notes,
    updated_at = NOW();
INSERT INTO public.mat_request_field_rules (
    field_key, section_name, field_label, display_order, is_required, is_locked,
    default_value, source_type, source_reference, notes, updated_at
) VALUES (
    'price_control', 'ACCOUNTING', 'Price Control', 28, true, true,
    'V', 'STATIC_DEFAULT', NULL, 'Default "V" dan tidak dapat diubah', NOW()
) ON CONFLICT (field_key) DO UPDATE SET
    section_name = EXCLUDED.section_name,
    field_label = EXCLUDED.field_label,
    display_order = EXCLUDED.display_order,
    is_required = EXCLUDED.is_required,
    is_locked = EXCLUDED.is_locked,
    default_value = EXCLUDED.default_value,
    source_type = EXCLUDED.source_type,
    source_reference = EXCLUDED.source_reference,
    notes = EXCLUDED.notes,
    updated_at = NOW();
INSERT INTO public.mat_request_field_rules (
    field_key, section_name, field_label, display_order, is_required, is_locked,
    default_value, source_type, source_reference, notes, updated_at
) VALUES (
    'moving_price', 'ACCOUNTING', 'Moving Price', 29, true, true,
    '1', 'STATIC_DEFAULT', NULL, 'Default "1" dan tidak dapat diubah', NOW()
) ON CONFLICT (field_key) DO UPDATE SET
    section_name = EXCLUDED.section_name,
    field_label = EXCLUDED.field_label,
    display_order = EXCLUDED.display_order,
    is_required = EXCLUDED.is_required,
    is_locked = EXCLUDED.is_locked,
    default_value = EXCLUDED.default_value,
    source_type = EXCLUDED.source_type,
    source_reference = EXCLUDED.source_reference,
    notes = EXCLUDED.notes,
    updated_at = NOW();
INSERT INTO public.mat_request_field_rules (
    field_key, section_name, field_label, display_order, is_required, is_locked,
    default_value, source_type, source_reference, notes, updated_at
) VALUES (
    'departure_country_line_1', 'TAX_DATA', 'Departure Country Line 1', 30, true, true,
    'ID', 'STATIC_DEFAULT', NULL, 'Line 1 default "ID" dan tidak dapat diubah', NOW()
) ON CONFLICT (field_key) DO UPDATE SET
    section_name = EXCLUDED.section_name,
    field_label = EXCLUDED.field_label,
    display_order = EXCLUDED.display_order,
    is_required = EXCLUDED.is_required,
    is_locked = EXCLUDED.is_locked,
    default_value = EXCLUDED.default_value,
    source_type = EXCLUDED.source_type,
    source_reference = EXCLUDED.source_reference,
    notes = EXCLUDED.notes,
    updated_at = NOW();
INSERT INTO public.mat_request_field_rules (
    field_key, section_name, field_label, display_order, is_required, is_locked,
    default_value, source_type, source_reference, notes, updated_at
) VALUES (
    'departure_country_line_2', 'TAX_DATA', 'Departure Country Line 2', 31, true, true,
    'ID', 'STATIC_DEFAULT', NULL, 'Line 2 default "ID" dan tidak dapat diubah', NOW()
) ON CONFLICT (field_key) DO UPDATE SET
    section_name = EXCLUDED.section_name,
    field_label = EXCLUDED.field_label,
    display_order = EXCLUDED.display_order,
    is_required = EXCLUDED.is_required,
    is_locked = EXCLUDED.is_locked,
    default_value = EXCLUDED.default_value,
    source_type = EXCLUDED.source_type,
    source_reference = EXCLUDED.source_reference,
    notes = EXCLUDED.notes,
    updated_at = NOW();
INSERT INTO public.mat_request_field_rules (
    field_key, section_name, field_label, display_order, is_required, is_locked,
    default_value, source_type, source_reference, notes, updated_at
) VALUES (
    'tax_category_line_1', 'TAX_DATA', 'Tax Category Line 1', 32, true, true,
    'MWST', 'STATIC_DEFAULT', NULL, 'Line 1 default "MWST" dan tidak dapat diubah', NOW()
) ON CONFLICT (field_key) DO UPDATE SET
    section_name = EXCLUDED.section_name,
    field_label = EXCLUDED.field_label,
    display_order = EXCLUDED.display_order,
    is_required = EXCLUDED.is_required,
    is_locked = EXCLUDED.is_locked,
    default_value = EXCLUDED.default_value,
    source_type = EXCLUDED.source_type,
    source_reference = EXCLUDED.source_reference,
    notes = EXCLUDED.notes,
    updated_at = NOW();
INSERT INTO public.mat_request_field_rules (
    field_key, section_name, field_label, display_order, is_required, is_locked,
    default_value, source_type, source_reference, notes, updated_at
) VALUES (
    'tax_category_line_2', 'TAX_DATA', 'Tax Category Line 2', 33, true, true,
    'ZMWS', 'STATIC_DEFAULT', NULL, 'Line 2 default "ZMWS" dan tidak dapat diubah', NOW()
) ON CONFLICT (field_key) DO UPDATE SET
    section_name = EXCLUDED.section_name,
    field_label = EXCLUDED.field_label,
    display_order = EXCLUDED.display_order,
    is_required = EXCLUDED.is_required,
    is_locked = EXCLUDED.is_locked,
    default_value = EXCLUDED.default_value,
    source_type = EXCLUDED.source_type,
    source_reference = EXCLUDED.source_reference,
    notes = EXCLUDED.notes,
    updated_at = NOW();
INSERT INTO public.mat_request_field_rules (
    field_key, section_name, field_label, display_order, is_required, is_locked,
    default_value, source_type, source_reference, notes, updated_at
) VALUES (
    'tax_classification_line_1', 'TAX_DATA', 'Tax Classification Line 1', 34, true, true,
    '1 - FULL TAX', 'STATIC_DEFAULT', NULL, 'Line 1 default "1 - Full Tax" dan tidak dapat diubah', NOW()
) ON CONFLICT (field_key) DO UPDATE SET
    section_name = EXCLUDED.section_name,
    field_label = EXCLUDED.field_label,
    display_order = EXCLUDED.display_order,
    is_required = EXCLUDED.is_required,
    is_locked = EXCLUDED.is_locked,
    default_value = EXCLUDED.default_value,
    source_type = EXCLUDED.source_type,
    source_reference = EXCLUDED.source_reference,
    notes = EXCLUDED.notes,
    updated_at = NOW();
INSERT INTO public.mat_request_field_rules (
    field_key, section_name, field_label, display_order, is_required, is_locked,
    default_value, source_type, source_reference, notes, updated_at
) VALUES (
    'tax_classification_line_2', 'TAX_DATA', 'Tax Classification Line 2', 35, true, true,
    '0 - NO TAX', 'STATIC_DEFAULT', NULL, 'Line 2 default "0 - No Tax" dan tidak dapat diubah', NOW()
) ON CONFLICT (field_key) DO UPDATE SET
    section_name = EXCLUDED.section_name,
    field_label = EXCLUDED.field_label,
    display_order = EXCLUDED.display_order,
    is_required = EXCLUDED.is_required,
    is_locked = EXCLUDED.is_locked,
    default_value = EXCLUDED.default_value,
    source_type = EXCLUDED.source_type,
    source_reference = EXCLUDED.source_reference,
    notes = EXCLUDED.notes,
    updated_at = NOW();

-- Seed: template master
INSERT INTO public.mat_template_master (template_code, template_name, updated_at)
VALUES ('MECHANICAL_COMPONENT', 'Mechanical Component', NOW())
ON CONFLICT (template_code) DO UPDATE SET
    template_name = EXCLUDED.template_name,
    updated_at = NOW();
INSERT INTO public.mat_template_master (template_code, template_name, updated_at)
VALUES ('ELECTRICAL_COMPONENT', 'Electrical Component', NOW())
ON CONFLICT (template_code) DO UPDATE SET
    template_name = EXCLUDED.template_name,
    updated_at = NOW();
INSERT INTO public.mat_template_master (template_code, template_name, updated_at)
VALUES ('EQUIPMENT_MACHINERY', 'Equipment / Machinery', NOW())
ON CONFLICT (template_code) DO UPDATE SET
    template_name = EXCLUDED.template_name,
    updated_at = NOW();
INSERT INTO public.mat_template_master (template_code, template_name, updated_at)
VALUES ('PROCESS_PLANT_EQUIPMENT', 'Process / Plant Equipment', NOW())
ON CONFLICT (template_code) DO UPDATE SET
    template_name = EXCLUDED.template_name,
    updated_at = NOW();
INSERT INTO public.mat_template_master (template_code, template_name, updated_at)
VALUES ('PIPING_SYSTEM', 'Piping System', NOW())
ON CONFLICT (template_code) DO UPDATE SET
    template_name = EXCLUDED.template_name,
    updated_at = NOW();
INSERT INTO public.mat_template_master (template_code, template_name, updated_at)
VALUES ('CHEMICAL_CONSUMABLES', 'Chemical & Consumables', NOW())
ON CONFLICT (template_code) DO UPDATE SET
    template_name = EXCLUDED.template_name,
    updated_at = NOW();
INSERT INTO public.mat_template_master (template_code, template_name, updated_at)
VALUES ('PACKAGING_PRODUCT_MATERIAL', 'Packaging & Product Material', NOW())
ON CONFLICT (template_code) DO UPDATE SET
    template_name = EXCLUDED.template_name,
    updated_at = NOW();
INSERT INTO public.mat_template_master (template_code, template_name, updated_at)
VALUES ('CONSTRUCTION_CIVIL_MATERIAL', 'Construction / Civil Material', NOW())
ON CONFLICT (template_code) DO UPDATE SET
    template_name = EXCLUDED.template_name,
    updated_at = NOW();
INSERT INTO public.mat_template_master (template_code, template_name, updated_at)
VALUES ('OFFICE_GENERAL_SUPPLIES', 'Office & General Supplies', NOW())
ON CONFLICT (template_code) DO UPDATE SET
    template_name = EXCLUDED.template_name,
    updated_at = NOW();
INSERT INTO public.mat_template_master (template_code, template_name, updated_at)
VALUES ('VEHICLE_TRANSPORTATION', 'Vehicle & Transportation', NOW())
ON CONFLICT (template_code) DO UPDATE SET
    template_name = EXCLUDED.template_name,
    updated_at = NOW();
INSERT INTO public.mat_template_master (template_code, template_name, updated_at)
VALUES ('CAPITAL_EQUIPMENT', 'Capital Equipment', NOW())
ON CONFLICT (template_code) DO UPDATE SET
    template_name = EXCLUDED.template_name,
    updated_at = NOW();
INSERT INTO public.mat_template_master (template_code, template_name, updated_at)
VALUES ('GENERAL_MISCELLANEOUS', 'General / Miscellaneous', NOW())
ON CONFLICT (template_code) DO UPDATE SET
    template_name = EXCLUDED.template_name,
    updated_at = NOW();

-- Seed: template to material group map
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'MECHANICAL_COMPONENT'),
    '905', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'MECHANICAL_COMPONENT'),
    '907', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'MECHANICAL_COMPONENT'),
    '911', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'MECHANICAL_COMPONENT'),
    '917', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'MECHANICAL_COMPONENT'),
    '925', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'MECHANICAL_COMPONENT'),
    '932', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'MECHANICAL_COMPONENT'),
    '950', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'MECHANICAL_COMPONENT'),
    '957', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'MECHANICAL_COMPONENT'),
    '968', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'MECHANICAL_COMPONENT'),
    '940', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'MECHANICAL_COMPONENT'),
    '955', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'ELECTRICAL_COMPONENT'),
    '909', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'ELECTRICAL_COMPONENT'),
    '920', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'ELECTRICAL_COMPONENT'),
    '921', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'ELECTRICAL_COMPONENT'),
    '947', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'ELECTRICAL_COMPONENT'),
    '953', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'ELECTRICAL_COMPONENT'),
    '944', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'ELECTRICAL_COMPONENT'),
    '915', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'EQUIPMENT_MACHINERY'),
    '903', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'EQUIPMENT_MACHINERY'),
    '904', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'EQUIPMENT_MACHINERY'),
    '902', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'EQUIPMENT_MACHINERY'),
    '906', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'EQUIPMENT_MACHINERY'),
    '913', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'EQUIPMENT_MACHINERY'),
    '916', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'EQUIPMENT_MACHINERY'),
    '927', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'EQUIPMENT_MACHINERY'),
    '935', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'EQUIPMENT_MACHINERY'),
    '936', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'EQUIPMENT_MACHINERY'),
    '937', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'EQUIPMENT_MACHINERY'),
    '938', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'EQUIPMENT_MACHINERY'),
    '969', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'EQUIPMENT_MACHINERY'),
    '941', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'EQUIPMENT_MACHINERY'),
    '982', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'EQUIPMENT_MACHINERY'),
    '946', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'EQUIPMENT_MACHINERY'),
    '971', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'PROCESS_PLANT_EQUIPMENT'),
    '928', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'PROCESS_PLANT_EQUIPMENT'),
    '954', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'PROCESS_PLANT_EQUIPMENT'),
    '973', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'PROCESS_PLANT_EQUIPMENT'),
    '984', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'PROCESS_PLANT_EQUIPMENT'),
    '960', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'PROCESS_PLANT_EQUIPMENT'),
    '918', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'PROCESS_PLANT_EQUIPMENT'),
    '943', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'PROCESS_PLANT_EQUIPMENT'),
    '942', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'PROCESS_PLANT_EQUIPMENT'),
    '961', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'PIPING_SYSTEM'),
    '962', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'PIPING_SYSTEM'),
    '963', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'PIPING_SYSTEM'),
    '965', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'PIPING_SYSTEM'),
    '966', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'PIPING_SYSTEM'),
    '979', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'CHEMICAL_CONSUMABLES'),
    '912', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'CHEMICAL_CONSUMABLES'),
    '959', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'CHEMICAL_CONSUMABLES'),
    '929', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'CHEMICAL_CONSUMABLES'),
    '931', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'CHEMICAL_CONSUMABLES'),
    '922', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'CHEMICAL_CONSUMABLES'),
    '980', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'CHEMICAL_CONSUMABLES'),
    '985', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'PACKAGING_PRODUCT_MATERIAL'),
    '958', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'PACKAGING_PRODUCT_MATERIAL'),
    '983', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'PACKAGING_PRODUCT_MATERIAL'),
    '972', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'PACKAGING_PRODUCT_MATERIAL'),
    '967', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'PACKAGING_PRODUCT_MATERIAL'),
    '948', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'PACKAGING_PRODUCT_MATERIAL'),
    '926', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'PACKAGING_PRODUCT_MATERIAL'),
    '949', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'CONSTRUCTION_CIVIL_MATERIAL'),
    '914', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'CONSTRUCTION_CIVIL_MATERIAL'),
    '976', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'CONSTRUCTION_CIVIL_MATERIAL'),
    '945', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'OFFICE_GENERAL_SUPPLIES'),
    '956', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'OFFICE_GENERAL_SUPPLIES'),
    '974', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'OFFICE_GENERAL_SUPPLIES'),
    '978', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'OFFICE_GENERAL_SUPPLIES'),
    '930', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'OFFICE_GENERAL_SUPPLIES'),
    '939', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'VEHICLE_TRANSPORTATION'),
    '952', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'CAPITAL_EQUIPMENT'),
    '910', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'GENERAL_MISCELLANEOUS'),
    '934', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();
INSERT INTO public.mat_template_group_map (template_id, material_group_code, updated_at)
VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'GENERAL_MISCELLANEOUS'),
    '951', NOW()
) ON CONFLICT (material_group_code) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = NOW();

-- Seed: template field rules
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'MECHANICAL_COMPONENT'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '101'),
    1, true, 'PREFIX', 'P/N', 'Diawali "P/N"', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'MECHANICAL_COMPONENT'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '102'),
    2, true, 'CAPITAL_NO_SPECIAL_CHARS', NULL, 'Huruf kapital, tanpa tanda baca khusus', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'MECHANICAL_COMPONENT'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '103'),
    3, true, 'ALPHANUMERIC_CAPITAL', NULL, 'Huruf kapital dan angka', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'MECHANICAL_COMPONENT'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '104'),
    4, false, 'NONE', NULL, 'Tidak ada ketentuan input', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'MECHANICAL_COMPONENT'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '105'),
    5, false, 'CAPITAL_ONLY', NULL, 'Huruf kapital', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'MECHANICAL_COMPONENT'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '106'),
    6, false, 'CAPITAL_ONLY', NULL, 'Huruf kapital', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'MECHANICAL_COMPONENT'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '107'),
    7, true, 'CAPITAL_ONLY', NULL, 'Huruf kapital', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'ELECTRICAL_COMPONENT'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '101'),
    1, true, 'PREFIX', 'P/N', 'Diawali "P/N"', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'ELECTRICAL_COMPONENT'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '102'),
    2, true, 'CAPITAL_NO_SPECIAL_CHARS', NULL, 'Huruf kapital, tanpa tanda baca khusus', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'ELECTRICAL_COMPONENT'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '103'),
    3, true, 'ALPHANUMERIC_CAPITAL', NULL, 'Huruf kapital dan angka', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'ELECTRICAL_COMPONENT'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '104'),
    4, false, 'NONE', NULL, 'Tidak ada ketentuan input', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'ELECTRICAL_COMPONENT'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '108'),
    5, false, 'NONE', NULL, 'Tidak ada ketentuan input', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'ELECTRICAL_COMPONENT'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '109'),
    6, false, 'NONE', NULL, 'Tidak ada ketentuan input', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'ELECTRICAL_COMPONENT'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '110'),
    7, false, 'NONE', NULL, 'Tidak ada ketentuan input', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'ELECTRICAL_COMPONENT'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '111'),
    8, false, 'NONE', NULL, 'Tidak ada ketentuan input', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'ELECTRICAL_COMPONENT'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '112'),
    9, false, 'NONE', NULL, 'Tidak ada ketentuan input', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'ELECTRICAL_COMPONENT'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '106'),
    10, false, 'CAPITAL_ONLY', NULL, 'Huruf kapital', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'ELECTRICAL_COMPONENT'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '107'),
    11, true, 'CAPITAL_ONLY', NULL, 'Huruf kapital', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'EQUIPMENT_MACHINERY'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '101'),
    1, true, 'PREFIX', 'P/N|POS', 'Diawali "P/N" atau "POS"', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'EQUIPMENT_MACHINERY'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '102'),
    2, true, 'CAPITAL_NO_SPECIAL_CHARS', NULL, 'Huruf kapital, tanpa tanda baca khusus', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'EQUIPMENT_MACHINERY'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '103'),
    3, true, 'ALPHANUMERIC_CAPITAL', NULL, 'Huruf kapital dan angka', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'EQUIPMENT_MACHINERY'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '113'),
    4, false, 'NONE', NULL, 'Tidak ada ketentuan input', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'EQUIPMENT_MACHINERY'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '114'),
    5, false, 'NONE', NULL, 'Tidak ada ketentuan input', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'EQUIPMENT_MACHINERY'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '115'),
    6, false, 'NONE', NULL, 'Tidak ada ketentuan input', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'EQUIPMENT_MACHINERY'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '106'),
    7, false, 'CAPITAL_ONLY', NULL, 'Huruf kapital', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'EQUIPMENT_MACHINERY'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '107'),
    8, true, 'CAPITAL_ONLY', NULL, 'Huruf kapital', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'PROCESS_PLANT_EQUIPMENT'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '102'),
    1, true, 'CAPITAL_NO_SPECIAL_CHARS', NULL, 'Huruf kapital, tanpa tanda baca khusus', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'PROCESS_PLANT_EQUIPMENT'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '103'),
    2, true, 'ALPHANUMERIC_CAPITAL', NULL, 'Huruf kapital dan angka', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'PROCESS_PLANT_EQUIPMENT'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '113'),
    3, false, 'NONE', NULL, 'Tidak ada ketentuan input', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'PROCESS_PLANT_EQUIPMENT'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '105'),
    4, false, 'CAPITAL_ONLY', NULL, 'Huruf kapital', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'PROCESS_PLANT_EQUIPMENT'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '106'),
    5, false, 'CAPITAL_ONLY', NULL, 'Huruf kapital', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'PROCESS_PLANT_EQUIPMENT'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '107'),
    6, true, 'CAPITAL_ONLY', NULL, 'Huruf kapital', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'PIPING_SYSTEM'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '102'),
    1, true, 'CAPITAL_ONLY', NULL, 'Huruf kapital', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'PIPING_SYSTEM'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '103'),
    2, true, 'ALPHANUMERIC_CAPITAL', NULL, 'Huruf kapital dan angka', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'PIPING_SYSTEM'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '104'),
    3, false, 'MIXED_ALPHA_NUM_UNIT', NULL, 'Angka dan satuan ukuran', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'PIPING_SYSTEM'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '116'),
    4, false, 'MIXED_ALPHA_NUM_UNIT', NULL, 'Angka dan huruf', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'PIPING_SYSTEM'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '105'),
    5, false, 'CAPITAL_ONLY', NULL, 'Huruf kapital', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'PIPING_SYSTEM'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '117'),
    6, false, 'ALPHANUMERIC_CAPITAL', NULL, 'Huruf kapital dan angka', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'CHEMICAL_CONSUMABLES'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '102'),
    1, true, 'CAPITAL_ONLY', NULL, 'Huruf kapital', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'CHEMICAL_CONSUMABLES'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '103'),
    2, true, 'CAPITAL_ONLY', NULL, 'Huruf kapital', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'CHEMICAL_CONSUMABLES'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '118'),
    3, false, 'ALPHANUMERIC_CAPITAL', NULL, 'Huruf kapital dan angka', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'CHEMICAL_CONSUMABLES'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '119'),
    4, false, 'CAPITAL_ONLY', NULL, 'Huruf kapital', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'CHEMICAL_CONSUMABLES'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '104'),
    5, false, 'MIXED_ALPHA_NUM_UNIT', NULL, 'Angka dan satuan', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'CHEMICAL_CONSUMABLES'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '107'),
    6, true, 'CAPITAL_ONLY', NULL, 'Huruf kapital', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'PACKAGING_PRODUCT_MATERIAL'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '102'),
    1, true, 'CAPITAL_ONLY', NULL, 'Huruf kapital', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'PACKAGING_PRODUCT_MATERIAL'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '103'),
    2, true, 'CAPITAL_ONLY', NULL, 'Huruf kapital', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'PACKAGING_PRODUCT_MATERIAL'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '120'),
    3, false, 'NUMERIC_ONLY', NULL, 'Angka', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'PACKAGING_PRODUCT_MATERIAL'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '105'),
    4, false, 'CAPITAL_ONLY', NULL, 'Huruf kapital', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'PACKAGING_PRODUCT_MATERIAL'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '121'),
    5, false, 'NUMERIC_ONLY', NULL, 'Angka', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'PACKAGING_PRODUCT_MATERIAL'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '107'),
    6, true, 'CAPITAL_ONLY', NULL, 'Huruf kapital', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'CONSTRUCTION_CIVIL_MATERIAL'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '102'),
    1, true, 'CAPITAL_ONLY', NULL, 'Huruf kapital', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'CONSTRUCTION_CIVIL_MATERIAL'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '103'),
    2, true, 'CAPITAL_ONLY', NULL, 'Huruf kapital', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'CONSTRUCTION_CIVIL_MATERIAL'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '119'),
    3, false, 'CAPITAL_ONLY', NULL, 'Huruf kapital', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'CONSTRUCTION_CIVIL_MATERIAL'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '120'),
    4, false, 'NUMERIC_ONLY', NULL, 'Angka', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'CONSTRUCTION_CIVIL_MATERIAL'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '117'),
    5, false, 'ALPHANUMERIC_CAPITAL', NULL, 'Huruf kapital dan angka', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'OFFICE_GENERAL_SUPPLIES'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '102'),
    1, true, 'CAPITAL_ONLY', NULL, 'Huruf kapital', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'OFFICE_GENERAL_SUPPLIES'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '103'),
    2, true, 'CAPITAL_ONLY', NULL, 'Huruf kapital', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'OFFICE_GENERAL_SUPPLIES'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '118'),
    3, false, 'ALPHANUMERIC_CAPITAL', NULL, 'Huruf kapital dan angka', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'OFFICE_GENERAL_SUPPLIES'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '120'),
    4, false, 'NUMERIC_ONLY', NULL, 'Angka', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'OFFICE_GENERAL_SUPPLIES'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '107'),
    5, true, 'CAPITAL_ONLY', NULL, 'Huruf kapital', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'VEHICLE_TRANSPORTATION'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '122'),
    1, true, 'CAPITAL_ONLY', NULL, 'Huruf kapital', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'VEHICLE_TRANSPORTATION'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '107'),
    2, true, 'CAPITAL_ONLY', NULL, 'Huruf kapital', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'VEHICLE_TRANSPORTATION'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '106'),
    3, false, 'ALPHANUMERIC_CAPITAL', NULL, 'Huruf kapital dan angka', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'VEHICLE_TRANSPORTATION'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '113'),
    4, false, 'NUMERIC_ONLY', NULL, 'Angka', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'VEHICLE_TRANSPORTATION'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '123'),
    5, false, 'NUMERIC_ONLY', NULL, 'Angka', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'CAPITAL_EQUIPMENT'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '102'),
    1, true, 'CAPITAL_ONLY', NULL, 'Huruf kapital', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'CAPITAL_EQUIPMENT'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '103'),
    2, true, 'CAPITAL_ONLY', NULL, 'Huruf kapital', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'CAPITAL_EQUIPMENT'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '113'),
    3, false, 'NUMERIC_ONLY', NULL, 'Angka', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'CAPITAL_EQUIPMENT'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '114'),
    4, false, 'NUMERIC_ONLY', NULL, 'Angka', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'CAPITAL_EQUIPMENT'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '106'),
    5, false, 'ALPHANUMERIC_CAPITAL', NULL, 'Huruf kapital dan angka', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'CAPITAL_EQUIPMENT'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '107'),
    6, true, 'CAPITAL_ONLY', NULL, 'Huruf kapital', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'GENERAL_MISCELLANEOUS'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '102'),
    1, true, 'CAPITAL_ONLY', NULL, 'Huruf kapital', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'GENERAL_MISCELLANEOUS'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '103'),
    2, true, 'CAPITAL_ONLY', NULL, 'Huruf kapital', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'GENERAL_MISCELLANEOUS'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '118'),
    3, false, 'ALPHANUMERIC_CAPITAL', NULL, 'Huruf kapital dan angka', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'GENERAL_MISCELLANEOUS'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '120'),
    4, false, 'NUMERIC_ONLY', NULL, 'Angka', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
INSERT INTO public.mat_template_field_rules (
    template_id, field_id, field_order, is_mandatory, validation_rule_type, prefix_value, rule_detail, max_length, updated_at
) VALUES (
    (SELECT template_id FROM public.mat_template_master WHERE template_code = 'GENERAL_MISCELLANEOUS'),
    (SELECT field_id FROM public.mat_field_master WHERE field_code = '107'),
    5, true, 'CAPITAL_ONLY', NULL, 'Huruf kapital', NULL, NOW()
) ON CONFLICT (template_id, field_id) DO UPDATE SET
    field_order = EXCLUDED.field_order,
    is_mandatory = EXCLUDED.is_mandatory,
    validation_rule_type = EXCLUDED.validation_rule_type,
    prefix_value = EXCLUDED.prefix_value,
    rule_detail = EXCLUDED.rule_detail,
    max_length = EXCLUDED.max_length,
    updated_at = NOW();
