#!/bin/bash

# Re-zip the perseus files to be redeployed into the content pack
perseus_dir=$1

rm -rf $perseus_dir/*.perseus

for dir in "$perseus_dir"/*; do
    [ -d "$dir" ] && cd "$dir" && zip -r -Z store "$dir".perseus ./*
done
