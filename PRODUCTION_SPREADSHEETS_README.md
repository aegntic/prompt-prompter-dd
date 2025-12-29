# Production Asset Spreadsheets

This directory contains CSV files for tracking production assets for the "PROMPT PROMPTER" demo video.

## Files Overview

### 1. `production_assets_generated_visuals.csv`
**10 Generated Visual Assets**
- Columns: ID, Shot Name, Timecode, Duration, Image Prompt, Video Prompt, Status, Notes
- Total Runtime: 56 seconds
- Use: Track AI-generated visuals for abstract storytelling moments

### 2. `production_assets_screen_recordings.csv`
**5 Screen Recording Takes**
- Columns: ID, Take Name, Target Duration, Clips to Extract, Script Coverage, Status, Notes
- Total Runtime: ~112 seconds
- Use: Track screen capture sessions for product demo footage

### 3. `production_assets_recording_clips.csv`
**18 Individual Recording Clips**
- Columns: Take, Clip ID, Timecode, Duration, What to Capture, Status
- Use: Detailed breakdown of clips to extract from screen recordings

### 4. `production_checklist.csv`
**Production Task Checklist**
- Columns: Phase, Task, Owner, Status, Due
- Use: Track progress through pre-production, generation, recording, and post-production

### 5. `production_summary.csv`
**High-Level Metrics**
- Key production statistics and ratios
- Use: Quick reference for overall project scope

## How to Use

### Import into Spreadsheet Software
1. **Google Sheets**: File → Import → Upload → Select CSV files
2. **Excel**: Data → From Text/CSV → Select files
3. **Numbers**: File → Open → Select CSV files

### Tracking Progress
- Update Status columns (⬜ = pending, ✅ = complete)
- Check off items in production_checklist.csv as you complete them
- Use the production_summary.csv for quick reference during meetings

## Production Notes

### Ratio Breakdown
- **Generated Visuals**: 33% (56s)
- **Screen Recordings**: 67% (112s)
- **Total Runtime**: 2:48

### Workflow
1. Generate images using prompts in `production_assets_generated_visuals.csv`
2. Generate videos from images
3. Record screen captures for each take in `production_assets_screen_recordings.csv`
4. Extract clips according to `production_assets_recording_clips.csv`
5. Assemble and post-produce

## Status Legend
- ⬜ = Not Started / Pending
- 🟡 = In Progress
- ✅ = Complete
- ❌ = Blocked / Issue

---

**Project**: PROMPT PROMPTER Demo Video
**Total Duration**: 2:48
**Built with**: Vertex AI Gemini + Datadog
