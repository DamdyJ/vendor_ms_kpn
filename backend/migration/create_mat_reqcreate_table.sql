-- Create mat_reqcreate table for storing material request form submissions
-- This table stores all original form data for audit trail while materials are created in mat_sap_data

CREATE TABLE public.mat_reqcreate (
    id serial4 NOT NULL,
    tanggal_permintaan date NOT NULL,
    nama_pemohon varchar(100) NOT NULL,
    departemen varchar(100) NOT NULL,
    nama_material varchar(200) NOT NULL,
    deskripsi_material text NOT NULL,
    material_group varchar(100) NULL,
    sub_material_group varchar(100) NULL,
    register_number varchar(100) NULL,
    part_number varchar(100) NULL,
    dimensi varchar(100) NULL,
    berat varchar(50) NULL,
    bahan varchar(100) NULL,
    type varchar(100) NULL,
    series varchar(100) NULL,
    power varchar(100) NULL,
    other_specification text NULL,
    uom varchar(20) NOT NULL,
    plant varchar(50) NULL,
    storage_location varchar(50) NULL,
    valuation_type varchar(50) NULL,
    has_attachment boolean NOT NULL DEFAULT false,
    catatan_tambahan text NULL,
    status varchar(20) NOT NULL DEFAULT 'processed',
    material_id int4 NULL, -- Reference to created mat_sap_data record
    created_at timestamptz NOT NULL DEFAULT NOW(),
    created_by varchar(100) NULL,
    CONSTRAINT mat_reqcreate_pkey PRIMARY KEY (id)
);

-- Create index for efficient querying by status and creation date
CREATE INDEX idx_mat_reqcreate_status_created ON public.mat_reqcreate (status, created_at);

-- Create index for efficient querying by user
CREATE INDEX idx_mat_reqcreate_pemohon ON public.mat_reqcreate (nama_pemohon);

-- Create index for efficient querying by material group
CREATE INDEX idx_mat_reqcreate_material_group ON public.mat_reqcreate (material_group);

-- Add foreign key constraint to mat_sap_data (optional, allows null)
ALTER TABLE public.mat_reqcreate
ADD CONSTRAINT mat_reqcreate_material_id_fkey
FOREIGN KEY (material_id) REFERENCES public.mat_sap_data(id);