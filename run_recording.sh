#!/bin/bash
# run_recording.sh
# Reliably runs the demo recorder

echo "🧹 Cleaning up Chrome locks..."
pkill -f chrome
rm -f demo-recorder/chrome_data/Singleton*

echo "🎬 Starting Recorder (Take 1)..."
# Using standard node execution, inherited stdio so user sees output
node demo-recorder/record_final.js --take=1
