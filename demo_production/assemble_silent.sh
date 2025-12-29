#!/bin/bash
cd "$(dirname "$0")"

# Silent Assembly - Revision 7 (Integrated Videos + No Stills)
# Strictly 2:48 (168s)
# 1:21 integrated with 09solution.mp4
# No static images (Ken Burns applied to PNGs)

# Ensure output directory exists
mkdir -p output

STILLS="../demo_stills"
REC="rec"

echo "Starting Assembly (Rev 7 - No Stills)..."

ffmpeg -y \
  -t 4 -i "$STILLS/01.mp4" \
  -t 4 -i "$STILLS/02.mp4" \
  -t 6 -i "$STILLS/03.mp4" \
  -t 6 -i "$STILLS/04.mp4" \
  -t 6 -i "$STILLS/05.mp4" \
  -t 6 -i "$STILLS/06.mp4" \
  -t 6 -i "$STILLS/07.mp4" \
  -t 20 -i "$REC/take_01_app.mp4" \
  -t 4 -i "$STILLS/08.mp4" \
  -t 18 -i "$REC/take_02_obs.mp4" \
  -t 4 -i "$STILLS/09solution.mp4" \
  -t 20 -i "$REC/take_03_monitors.mp4" \
  -t 8 -i "$REC/take_04_incident.mp4" \
  -t 4 -i "$STILLS/09problem.mp4" \
  -t 32 -i "$REC/take_05_healing.mp4" \
  -t 4 -i "$STILLS/05.mp4" \
  -ss 00:00:10 -t 4 -i "$REC/take_01_app.mp4" \
  -t 4 -i "$STILLS/10.mp4" \
  -t 4 -i "$STILLS/03.mp4" \
  -loop 1 -t 2 -i "$STILLS/11.png" \
  -loop 1 -t 2 -i "$STILLS/12.png" \
  -filter_complex "\
    [0:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v0]; \
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
    [18:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v18]; \
    [19:v]zoompan=z='min(zoom+0.0015,1.5)':d=125:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)',scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v19]; \
    [20:v]zoompan=z='min(zoom+0.0015,1.5)':d=125:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)',scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v20]; \
    [v0][v1][v2][v3][v4][v5][v6][v7][v8][v9][v10][v11][v12][v13][v14][v15][v16][v17][v18][v19][v20]concat=n=21:v=1:a=0[outv]" \
  -map "[outv]" \
  -c:v libx264 -preset fast -crf 23 \
  -movflags +faststart \
  output/prompt_prompter_silent_draft.mp4

echo "Done! Output at demo_production/output/prompt_prompter_silent_draft.mp4"
