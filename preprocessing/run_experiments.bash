#!/bin/bash


# Basic settings for the model
models=("resnet" "cnn") # "cnn"
datasets=("FordA" "FordB" "ECG5000") # "FordB" "ECG5000"


# Generate a timestamp
timestamp=$(date +%Y%m%d-%H%M%S)


# Base path for the processed data
path="./data_$timestamp/"
mkdir "$path"

# Loop through models
for model in "${models[@]}"; do

    # Loop through datasets
    for dataset in "${datasets[@]}"; do

        # Convert model and dataset names to lower case
        model_lowercase=$(echo "$model" | tr '[:upper:]' '[:lower:]')
        dataset_lowercase=$(echo "$dataset" | tr '[:upper:]' '[:lower:]')

        echo "Looking for $model_lowercase-$dataset_lowercase.pt"

        # Generate a timestamp
        timestamp=$(date +%Y%m%d-%H%M%S)

        # Create a directory with the timestamp
        directory="$path/result_$timestamp/"
        mkdir "$directory"

        # Check how large the files are and what is even in the subdirectories
        du -ah "$directory"

        # Train the model if not available
        if ! ls "$directory$model_lowercase-$dataset_lowercase.pt" 1> /dev/null 2>&1; then
            echo "Model or dataset not found. Calling Python script..."
            python train_model.py -d "$dataset" -m "$model" -p "$directory"
        else
            echo "Model and dataset exist."
        fi

        # Extract data from the model
        python dense-pixel-orderings.py -d "$dataset" -m "$model" -rp "$directory"

        # Fix permissions to standard user
        if [ ! -z "$HOST_UID" ] && [ ! -z "$HOST_GID" ]; then
            chown -R $HOST_UID:$HOST_GID "$path"
        fi

    done
done


