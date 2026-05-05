CREATE TABLE IF NOT EXISTS public.mat_field_ui_meta (
    field_ui_meta_id serial4 PRIMARY KEY,
    field_id int4 NOT NULL
        REFERENCES public.mat_field_master(field_id)
        ON DELETE CASCADE,
    section_key varchar(50) NULL,
    field_label varchar(100) NULL,
    helper_text text NULL,
    placeholder varchar(255) NULL,
    display_order int4 NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT mat_field_ui_meta_un_field UNIQUE (field_id)
);
