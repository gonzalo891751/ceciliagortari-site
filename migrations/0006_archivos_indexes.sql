-- Composite indexes for archive_files common query patterns
-- folder_id + deleted_at: used on every folder listing
CREATE INDEX IF NOT EXISTS idx_archive_files_folder_active ON archive_files(folder_id, deleted_at);
-- is_pinned + deleted_at: used for pinned file queries
CREATE INDEX IF NOT EXISTS idx_archive_files_pinned_active ON archive_files(is_pinned, deleted_at);
-- created_at + deleted_at: used for recent files
CREATE INDEX IF NOT EXISTS idx_archive_files_recent ON archive_files(deleted_at, created_at DESC);
-- updated_at: used for ordering within folders
CREATE INDEX IF NOT EXISTS idx_archive_files_updated ON archive_files(updated_at DESC);

-- Composite index for archive_folders
-- parent_id + deleted_at: used on every folder listing
CREATE INDEX IF NOT EXISTS idx_archive_folders_parent_active ON archive_folders(parent_id, deleted_at);
