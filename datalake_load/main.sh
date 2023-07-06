#!/bin/bash

# Function to restore and dump the temp db
restore_and_dump_temp_db() {
  # Assign the args to variables
  KOLIBRI_BACKUP_FILE="$1"

  # Terminate all active connections to the temp database
  PGPASSWORD="$TEMP_DATABASE_PASSWORD" psql \
  -h "$TEMP_DATABASE_HOST" \
  -U "$TEMP_DATABASE_USER" \
  -d "$TEMP_DATABASE_NAME" \
  -c "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '$TEMP_DATABASE_NAME' AND pid <> pg_backend_pid();"

  # Drop and recreate the temp database
  sudo -i -u postgres psql <<EOF
    DROP DATABASE IF EXISTS restore_tmp;
    CREATE DATABASE restore_tmp;
EOF

  # Restore the kolibri backup file to the temp database
  echo "Restoring backup file: $1 into Database: $TEMP_DATABASE_NAME"
  PGPASSWORD="$TEMP_DATABASE_PASSWORD" pg_restore \
  -U "$TEMP_DATABASE_USER" \
  -h "$TEMP_DATABASE_HOST" \
  -p "$TEMP_DATABASE_PORT" \
  -d "$TEMP_DATABASE_NAME" \
  --no-owner --verbose "$KOLIBRI_BACKUP_FILE"

  # Create a dump of the temp database with --inserts and --on-conflict-do-nothing
  echo "Creating dump of database: $TEMP_DATABASE_NAME with --inserts and --on-conflict-do-nothing"
  PGPASSWORD="$TEMP_DATABASE_PASSWORD" pg_dump "$TEMP_DATABASE_NAME" \
  -U "$TEMP_DATABASE_USER" \
  -h "$TEMP_DATABASE_HOST" \
  -p "$TEMP_DATABASE_PORT" \
  --inserts --on-conflict-do-nothing -Fc >"restore_tmp.backup"

  echo "$KOLIBRI_BACKUP_FILE" >>"$PROCESSED_FILES_LIST"
}

# Function to restore dump to the data lake
restore_dump_to_datalake() {
  echo "Restoring backup file: $1 into Database: $DATALAKE_DB_NAME"
  PGPASSWORD="$DATALAKE_DB_PASSWORD" pg_restore \
  -U "$DATALAKE_DB_USER" \
  -h "$DATALAKE_DB_HOST" \
  -p "$DATALAKE_DB_PORT" \
  -d "$DATALAKE_DB_NAME" \
  --no-owner --verbose "$1"
}

# Globals
#-------------
# Name of GCS bucket
BUCKET_NAME=""

# File to store processed file names
PROCESSED_FILES_LIST="processed_files.txt"

# Directory for unzipped files
UNZIPPED_FILES_DIR="unzipped_files"

# Get list of files from GCS bucket
FILES_LIST=$(gsutil ls -r "gs://$BUCKET_NAME")

# Loop through files in the list
for gcs_file in $FILES_LIST; do
  if [[ $gcs_file == *.zip ]]; then
    # Download the file using gsutil
    gsutil cp "$gcs_file" .

    # Unzip the file to the unzipped_files directory
    unzip -q "$gcs_file" -d "$UNZIPPED_FILES_DIR"

    # Loop through the files in the unzipped_files directory
    for file in "$UNZIPPED_FILES_DIR"/*; do
      if [[ $file == *kolibri* && $file == *.backup ]]; then
        # Perform database operations
        restore_and_dump_temp_db "$file"
        restore_dump_to_datalake "restore_tmp.backup"

        # Add the filename to the list of processed files
        echo "$file" >>"$PROCESSED_FILES_LIST"

      fi
    done


    # Clean up the files in the unzipped_files directory
    rm -f "$UNZIPPED_FILES_DIR"/*
  fi
done
