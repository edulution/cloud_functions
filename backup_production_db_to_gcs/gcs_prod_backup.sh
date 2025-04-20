#!/bin/bash

# Source the bash profile of the current user
source $HOME/.profile

# Set HEROKU_APP_NAME and GCS_BUCKET_NAME using environment variables
HEROKU_APP_NAME=$PROD_APP_NAME
GCS_BUCKET_NAME=$PROD_BACKUPS_BUCKET_NAME


# Get path variable to ensure that heroku cli and gsutil commands work
export PATH="/usr/local/bin:/usr/bin:/bin:/snap/bin:$PATH"

# Set boto config needed for gsutil
# The env variable should point to .boto in the home directory
# e.g /home/techzm/.boto
export BOTO_CONFIG=$BOTO_CONFIG_PATH

# Create helper log function to put timestamps in front of echo statements
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Main function
download_backup_upload_to_gcs_bucket() {
    log "Fetching latest backup ID for app: $HEROKU_APP_NAME"

    # Get the ID of the latest completed backup from the output of heroku pg:backups
    HEROKU_BACKUP_NAME=$(heroku pg:backups --app "$HEROKU_APP_NAME" | awk '/Completed/ { print $1; exit }')

    # If no backups are found, exit the script
    if [ -z "$HEROKU_BACKUP_NAME" ]; then
        log "No completed backup found for app: $HEROKU_APP_NAME"
        exit 1
    fi

    # Log the ID of the latest completed backup
    log "Latest backup ID: $HEROKU_BACKUP_NAME"

    # Generate timestamp suffix
    TIMESTAMP=$(date +"%Y%m%d%H%M%S")
    # Use the timestamp prefix to create the name of the output file
    OUTPUT_FILE="${HEROKU_BACKUP_NAME}_${TIMESTAMP}.dump"

    # Get the backup URL and download the file
    BACKUP_URL=$(heroku pg:backups:url "$HEROKU_BACKUP_NAME" --app "$HEROKU_APP_NAME")
    wget -O "$OUTPUT_FILE" "$BACKUP_URL"
    log "Backup downloaded as $OUTPUT_FILE"

    # Uploda the file to the GCS bucket using gsutil
    log "Uploding $OUTPUT_FILE to GCS Bucket $GCS_BUCKET_NAME"
    gsutil cp "$OUTPUT_FILE" gs://"$GCS_BUCKET_NAME"
}

# Run the main function
download_backup_upload_to_gcs_bucket

# Clean up excess dump files from the directory in which the script runs and the home directory
log "Cleaning up dump files"
rm $HOME/*.dump
rm $HOME/prod_gcs_backups/*.dump
