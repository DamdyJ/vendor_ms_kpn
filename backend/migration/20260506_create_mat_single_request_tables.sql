-- Single material request persistence tables
-- Created: 2026-05-06
-- Purpose:
-- 1. Store single material request submissions separately from mat_sap_data
-- 2. Store request attachments without altering existing material attachment tables

CREATE TABLE IF NOT EXISTS public.mat_single_request (
    id bigserial PRIMARY KEY,
    request_no varchar(30) NOT NULL,
    ticket_type varchar(20) NOT NULL DEFAULT 'Create',
    material_group_id int4 NOT NULL,
    material_sub_group_id int4 NULL,
    plant_code varchar(20) NULL,
    sloc_code varchar(20) NULL,
    material_description varchar(255) NOT NULL,
    base_uom varchar(20) NOT NULL,
    long_text_1 text NULL,
    long_text_2 text NULL,
    long_text_3 text NULL,
    template_payload jsonb NULL,
    status varchar(20) NOT NULL DEFAULT 'Submit',
    assigned_to varchar(100) NOT NULL DEFAULT 'Approval 1',
    created_by varchar(100) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_mat_single_request_no UNIQUE (request_no),
    CONSTRAINT fk_mat_single_request_group
        FOREIGN KEY (material_group_id)
        REFERENCES public.mat_item_group(id),
    CONSTRAINT fk_mat_single_request_sub_group
        FOREIGN KEY (material_sub_group_id)
        REFERENCES public.mat_item_sub_group(id)
);

CREATE INDEX IF NOT EXISTS idx_mat_single_request_status
    ON public.mat_single_request(status);

CREATE INDEX IF NOT EXISTS idx_mat_single_request_created_by
    ON public.mat_single_request(created_by);

CREATE INDEX IF NOT EXISTS idx_mat_single_request_group
    ON public.mat_single_request(material_group_id);

CREATE INDEX IF NOT EXISTS idx_mat_single_request_sub_group
    ON public.mat_single_request(material_sub_group_id);

CREATE TABLE IF NOT EXISTS public.mat_single_request_attachment (
    id bigserial PRIMARY KEY,
    request_id bigint NOT NULL,
    file_name varchar(255) NOT NULL,
    file_path varchar(500) NOT NULL,
    file_type varchar(100) NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_mat_single_request_attachment_request
        FOREIGN KEY (request_id)
        REFERENCES public.mat_single_request(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_mat_single_request_attachment_request_id
    ON public.mat_single_request_attachment(request_id);
