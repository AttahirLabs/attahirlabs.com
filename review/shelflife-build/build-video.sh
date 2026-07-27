#!/usr/bin/env bash
set -euo pipefail

build_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
output_file="$build_dir/shelflife-app-store-review-2026-07-26.mp4"
durations=(5 6 6 6 6 7 7 7 6 6 7 5)
offsets=(4.35 9.70 15.05 20.40 25.75 32.10 38.45 44.80 50.15 55.50 61.85)
input_args=()
filter_parts=()

for slide_index in "${!durations[@]}"; do
  slide_path="$(printf "%s/slides/%02d.png" "$build_dir" "$slide_index")"
  input_args+=(-loop 1 -t "${durations[$slide_index]}" -i "$slide_path")
  filter_parts+=(
    "[$slide_index:v]scale=1920:1080:flags=lanczos,setsar=1,fps=30,format=yuv420p,setpts=PTS-STARTPTS[v$slide_index]"
  )
done

previous_label="v0"
for slide_index in $(seq 1 11); do
  next_label="x$slide_index"
  offset_index=$((slide_index - 1))
  filter_parts+=(
    "[$previous_label][v$slide_index]xfade=transition=fade:duration=0.65:offset=${offsets[$offset_index]}[$next_label]"
  )
  previous_label="$next_label"
done

filter_graph="$(IFS=';'; printf '%s' "${filter_parts[*]}")"

ffmpeg -hide_banner -loglevel warning -y \
  "${input_args[@]}" \
  -f lavfi -t 66.85 -i "anullsrc=channel_layout=stereo:sample_rate=48000" \
  -filter_complex "$filter_graph" \
  -map "[$previous_label]" \
  -map "12:a" \
  -c:v libx264 \
  -preset medium \
  -crf 23 \
  -profile:v high \
  -level 4.1 \
  -pix_fmt yuv420p \
  -c:a aac \
  -b:a 96k \
  -movflags +faststart \
  -shortest \
  "$output_file"

ffprobe -v error \
  -show_entries format=duration,size:stream=codec_name,width,height,r_frame_rate \
  -of json \
  "$output_file"

file_size="$(stat -c %s "$output_file")"
if (( file_size >= 52428800 )); then
  echo "Encoded review video exceeds the 50 MiB launch limit" >&2
  exit 1
fi

