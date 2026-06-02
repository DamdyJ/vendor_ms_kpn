ALTER TABLE mat_sap_data
    ADD COLUMN IF NOT EXISTS plant_code varchar(20) NULL,
    ADD COLUMN IF NOT EXISTS sloc_code varchar(20) NULL;
