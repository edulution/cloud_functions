#!/bin/bash

# Input data file
DATA_FILE=$1

# Path to grade 7 analysis input data
GR7_ANALYSIS_INPUT_PATH="/srv/shiny-server/gr7_analysis/data"

# Copy the data file to bl_data.rds in the grade 7 analysis input directory
sudo cp "$DATA_FILE" "$GR7_ANALYSIS_INPUT_PATH/bl_data.rds"

# Clear the contents of last_updated in the grade 7 analysis input directory
sudo truncate -s 0 "$GR7_ANALYSIS_INPUT_PATH/last_updated"

# Write the current date to last_updated in the grade 7 analysis input directory
echo "$(date '+%Y-%m-%d')" >> "$GR7_ANALYSIS_INPUT_PATH/last_updated"

# restart the shiny server service
sudo systemctl restart shiny-server.service