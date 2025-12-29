#!/bin/bash
cd "$(dirname "$0")"

# Paths
AUDIO="audio/ElevenLabs_2025-12-28T14_20_36__s50_v3.mp3"
CLIPS="../demo_clips"
REC="rec"
OUTPUT="output/final_perfect_cut.mp4"

mkdir -p output

echo "=== Assembling Final Video with Perfect Cuts ==="

# Define the filter complex for concatenation
# We scale everything to 1920x1080 and set SAR to 1 to ensure compatibility

# Inputs:
# 0: Audio
# 1-5: Intro Clips
# 6: App Recording
# 7: Metrics Transition Clip
# 8: Metrics Recording
# 9: Monitors Recording
# 10: Incident Recording
# 11: Healing Transition Clip
# 12: Healing Recording
# 13-17: Outro Clips

ffmpeg -y \
  -i "$AUDIO" \
  -t 8 -i "$CLIPS/01.mp4" \
  -t 8 -i "$CLIPS/02.mp4" \
  -t 8 -i "$CLIPS/03.mp4" \
  -t 8 -i "$CLIPS/04.mp4" \
  -t 8 -i "$CLIPS/05.mp4" \
  -i "$REC/take_01_app.mp4" \
  -t 5 -i "$CLIPS/06.mp4" \
  -i "$REC/take_02_obs.mp4" \
  -i "$REC/take_03_monitors.mp4" \
  -i "$REC/take_04_incident.mp4" \
  -t 5 -i "$CLIPS/07.mp4" \
  -i "$REC/take_05_healing.mp4" \
  -t 8 -i "$CLIPS/08.mp4" \
  -t 8 -i "$CLIPS/09.mp4" \
  -t 8 -i "$CLIPS/10.mp4" \
  -t 8 -i "$CLIPS/11.mp4" \
  -stream_loop 5 -t 15 -i "$CLIPS/12.mp4" \
  -filter_complex " \
    [1:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v1]; \
    [2:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v2]; \
    [3:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v3]; \
    [4:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v4]; \
    [5:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v5]; \
    [6:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v6]; \
    [7:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v7]; \
    [8:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v8]; \
    [9:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v9]; \
    [10:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v10]; \
    [11:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v11]; \
    [12:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v12]; \
    [13:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v13]; \
    [14:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v14]; \
    [15:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v15]; \
    [16:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v16]; \
    [17:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v17]; \
    [v1][v2][v3][v4][v5][v6][v7][v8][v9][v10][v11][v12][v13][v14][v15][v16][v17]concat=n=17:v=1:a=0[outv]" \
  -map "[outv]" -map 0:a \
  -c:v libx264 -preset fast -crf 23 -shortest \
  -c:a aac -b:a 192k \
  -movflags +faststart \
  "$OUTPUT"

echo "Done! Output at $OUTPUT"
