-- Create mat_reqedit table for tracking material edit requests with attachments
-- This table stores material attachment additions that need to be sent via email in batches

CREATE TABLE public.mat_reqedit (
    id serial4 NOT NULL,
    material_code varchar(100) NOT NULL,
    material_name varchar(100) NULL,
    attachment_path varchar(200) NULL,
    edited_alias varchar(100) NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    processed boolean NOT NULL DEFAULT false,
    processed_at timestamptz NULL,
    edited_by varchar(100) NULL,
    CONSTRAINT mat_reqedit_pkey PRIMARY KEY (id)
);

-- Create index for efficient querying of unprocessed records within time ranges
CREATE INDEX idx_mat_reqedit_processed_created ON public.mat_reqedit (processed, created_at);

-- Create index for efficient querying by material_code
CREATE INDEX idx_mat_reqedit_material_code ON public.mat_reqedit (material_code);