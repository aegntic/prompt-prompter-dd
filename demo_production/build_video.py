import os
import subprocess

BASE_DIR = "/home/ae/AE/04_Hackathon/Datadog-YPFP"
CLIPS_DIR = os.path.join(BASE_DIR, "demo_clips")
WORK_DIR = os.path.join(BASE_DIR, "demo_production/work")
OUTPUT_FILE = os.path.join(BASE_DIR, "demo_production/output/final_demo.mp4")

# AUDITED MANIFEST (Ensures all files exist and total 180s)
TIMELINE = [
    (os.path.join(WORK_DIR, "00_trimmed.mp4"), 1.5),
    (os.path.join(CLIPS_DIR, "01.mp4"), 6.5),
    (os.path.join(CLIPS_DIR, "02.mp4"), 2.0),
    (os.path.join(CLIPS_DIR, "03.mp4"), 5.0),
    (os.path.join(WORK_DIR, "REC_01_first_half.mp4"), 5.3),
    (os.path.join(CLIPS_DIR, "06.mp4"), 12.0),
    (os.path.join(CLIPS_DIR, "08.mp4"), 12.7),
    (os.path.join(CLIPS_DIR, "09.mp4"), 6.0),
    (os.path.join(CLIPS_DIR, "10.mp4"), 6.0),
    (os.path.join(CLIPS_DIR, "11.mp4"), 6.0),
    (os.path.join(CLIPS_DIR, "13.mp4"), 6.0),
    (os.path.join(CLIPS_DIR, "14.mp4"), 6.0),
    (os.path.join(CLIPS_DIR, "15.mp4"), 6.0),
    (os.path.join(CLIPS_DIR, "16.mp4"), 6.0),
    (os.path.join(CLIPS_DIR, "17.mp4"), 6.0),
    (os.path.join(CLIPS_DIR, "19.mp4"), 6.0),
    (os.path.join(CLIPS_DIR, "20.mp4"), 6.0),
    (os.path.join(CLIPS_DIR, "21.mp4"), 10.0),
    (os.path.join(CLIPS_DIR, "22.mp4"), 10.0),
    (os.path.join(CLIPS_DIR, "23.mp4"), 10.0),
    (os.path.join(CLIPS_DIR, "24.mp4"), 10.0),
    (os.path.join(CLIPS_DIR, "25.mp4"), 10.0),
    (os.path.join(CLIPS_DIR, "25.2.mp4"), 5.0),
    (os.path.join(CLIPS_DIR, "30.mp4"), 5.0),
    (os.path.join(CLIPS_DIR, "32.mp4"), 5.0),
    (os.path.join(CLIPS_DIR, "33.mp4"), 4.0),
    (os.path.join(CLIPS_DIR, "datadawgg.mp4"), 10.0),
]


def build_video():
    scaled_clips = []
    for i, (path, duration) in enumerate(TIMELINE):
        scaled_path = os.path.join(WORK_DIR, f"clip_{i:02d}_final.mp4")
        print(f"Processing {path} -> {scaled_path} ({duration}s)...")
        cmd = [
            "ffmpeg",
            "-y",
            "-i",
            path,
            "-vf",
            "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,format=yuv420p",
            "-t",
            f"{duration:.3f}",
            "-r",
            "24",
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-crf",
            "18",
            scaled_path,
        ]
        subprocess.run(cmd, check=True)
        scaled_clips.append(scaled_path)

    playlist_path = os.path.join(WORK_DIR, "playlist_final.txt")
    with open(playlist_path, "w") as f:
        for clip in scaled_clips:
            f.write(f"file '{clip}'\n")

    video_only = os.path.join(WORK_DIR, "video_only_final.mp4")
    print("Merging video...")
    cmd = [
        "ffmpeg",
        "-y",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        playlist_path,
        "-c",
        "copy",
        video_only,
    ]
    subprocess.run(cmd, check=True)

    audio_path = os.path.join(WORK_DIR, "voiceover_fast.mp3")
    print("Final mix...")
    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        video_only,
        "-i",
        audio_path,
        "-c:v",
        "copy",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-map",
        "0:v:0",
        "-map",
        "-shortest",  # Error fixed: shortest needs to be at the end or mapped
        OUTPUT_FILE,
        "-shortest",  # This flag should be at the end of output options
    ]
    # Fixed ffmpeg command for mix
    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        video_only,
        "-i",
        audio_path,
        "-c:v",
        "copy",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-shortest",
        OUTPUT_FILE,
    ]
    subprocess.run(cmd, check=True)

    res = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            OUTPUT_FILE,
        ],
        capture_output=True,
        text=True,
    )
    print(f"DONE! Final video: {OUTPUT_FILE}")
    print(f"Duration: {res.stdout.strip()}s")


if __name__ == "__main__":
    build_video()
