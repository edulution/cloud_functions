#!/bin/bash

# Unzip all perseus files into a specified directory
ORI_DIR=$1
UNZIP_DIR=$2

for file in "$ORI_DIR"/*;
do
    sans_extension=$(basename -s .perseus "$file")
    unzip "$file" -d "$UNZIP_DIR/$sans_extension"
done
