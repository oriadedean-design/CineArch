#!/usr/bin/env bash
# Builds the two CineArch videos from simulator captures and the rendered text:
#   out/cinearch-app-preview.mp4  App Store app preview: 886 x 1920, H.264, 30 fps, 15-30 s
#   out/cinearch-explainer.mp4    explainer for the website and social: 1920 x 1080, 30 fps
# Steps: capture (README), node src/render-text.cjs <chromium>, then bash src/build.sh
set -euo pipefail
cd "$(dirname "$0")/.."
CAP=capture; TXT=out/text; SEG=out/seg
mkdir -p "$SEG"
FPS=30; XF=0.5          # crossfade length (s)
WALK_START=2.0          # walkthrough recordings: the scene is on screen from here
ENC=(-c:v libx264 -profile:v high -pix_fmt yuv420p -r $FPS -crf 16 -preset slow)

# The app footage for a clip, as a stream labelled [cap]: a walkthrough
# recording (trimmed, last frame held) or a still screen with a slow zoom.
# $1 clip  $2 seconds  $3 width  $4 height
capture() {
  local clip=$1 d=$2 w=$3 h=$4
  if [[ -f $CAP/$clip.mov ]]; then
    CAP_IN=(-ss $WALK_START -i $CAP/$clip.mov)
    CAP_F="[0:v]fps=$FPS,setpts=PTS-STARTPTS,scale=$w:$h:flags=lanczos,tpad=stop_mode=clone:stop_duration=$d,trim=duration=$d[cap]"
  else
    CAP_IN=(-loop 1 -framerate $FPS -t $d -i $CAP/$clip.png)
    # 0 -> 4% zoom from the top centre over the clip; crop keeps the frame size.
    # Scaled by height so the image is never shorter than the crop.
    CAP_F="[0:v]scale=w=-2:h='trunc($h*(1+0.04*t/$d)/2)*2':eval=frame:flags=lanczos,crop=$w:$h:(iw-$w)/2:0,setsar=1[cap]"
  fi
}

# ── App Store preview ───────────────────────────────────────────────
PW=886; PH=1920; CW=740; CH=1608; CX=73; CY=292
n=$(jq '.preview | length' src/copy.json)
durs=()
for ((i = 0; i < n; i++)); do
  clip=$(jq -r ".preview[$i].clip" src/copy.json); d=$(jq -r ".preview[$i].secs" src/copy.json); durs+=($d)
  capture $clip $d $CW $CH
  ffmpeg -v error -y "${CAP_IN[@]}" -loop 1 -framerate $FPS -t $d -i $TXT/preview-$i.png -f lavfi -i "color=black:s=${PW}x${PH}:r=$FPS:d=$d" \
    -filter_complex "$CAP_F;[cap]pad=$((CW+4)):$((CH+4)):2:2:color=0x2a2a2a[c];
      [1:v]format=rgba,fade=t=in:st=0.15:d=0.45:alpha=1[t];
      [2:v][c]overlay=x=$((CX-2)):y=$((CY-2))[b];
      [b][t]overlay=x=0:y='if(lt(t,0.15),28,max(0,28-28*(t-0.15)/0.45))':shortest=1,format=yuv420p" \
    -t $d "${ENC[@]}" $SEG/p$i.mp4
done

# ── Explainer ───────────────────────────────────────────────────────
EW=1920; EH=1080; PCW=432; PCH=940; PCX=$((EW - 160 - PCW)); PCY=70
m=$(jq '.explainer.scenes | length' src/copy.json); ED=4.6; OD=3.6
ffmpeg -v error -y -loop 1 -framerate $FPS -t $OD -i $TXT/explainer-open.png \
  -vf "scale=w='trunc($EW*(1+0.03*t/$OD)/2)*2':h=-2:eval=frame,crop=$EW:$EH,setsar=1,format=yuv420p" -t $OD "${ENC[@]}" $SEG/e-open.mp4
edurs=($OD)
for ((i = 0; i < m; i++)); do
  clip=$(jq -r ".explainer.scenes[$i].clip" src/copy.json); edurs+=($ED)
  capture $clip $ED $PCW $PCH
  ffmpeg -v error -y "${CAP_IN[@]}" -loop 1 -framerate $FPS -t $ED -i $TXT/explainer-$i.png -f lavfi -i "color=black:s=${EW}x${EH}:r=$FPS:d=$ED" \
    -filter_complex "$CAP_F;[cap]pad=$((PCW+4)):$((PCH+4)):2:2:color=0x2a2a2a[c];
      [1:v]format=rgba,fade=t=in:st=0.2:d=0.5:alpha=1[t];
      [2:v][c]overlay=x='$PCX-2+60*max(0,1-t/0.6)*max(0,1-t/0.6)':y=$((PCY-2))[b];
      [b][t]overlay=x='-30*min(1,max(0,1-(t-0.2)/0.5))':y=0:shortest=1,format=yuv420p" \
    -t $ED "${ENC[@]}" $SEG/e$i.mp4
done
ffmpeg -v error -y -loop 1 -framerate $FPS -t $OD -i $TXT/explainer-close.png -vf "setsar=1,format=yuv420p" -t $OD "${ENC[@]}" $SEG/e-close.mp4
edurs+=($OD)

# Joins segments with crossfades and adds a silent stereo AAC track (Apple
# lists AAC 256 kbps, 44.1/48 kHz stereo for previews with sound).
# $1 output  $2.. segment files; durations come from the matching array.
join() {
  local out=$1; shift; local -a files=("$@") inputs=() ; local f="" prev="[0:v]" off=0
  for ((k = 0; k < ${#files[@]}; k++)); do inputs+=(-i "${files[$k]}"); done
  for ((k = 1; k < ${#files[@]}; k++)); do
    off=$(echo "$off + ${D[$((k-1))]} - $XF" | bc)
    f+="$prev[$k:v]xfade=transition=fade:duration=$XF:offset=$off[v$k];"; prev="[v$k]"
  done
  local total=$(echo "$off + ${D[$(( ${#files[@]} - 1 ))]}" | bc)
  ffmpeg -v error -y "${inputs[@]}" -f lavfi -i "anullsrc=r=48000:cl=stereo" \
    -filter_complex "${f%;}" -map "$prev" -map ${#files[@]}:a -t $total \
    "${ENC[@]}" -c:a aac -b:a 256k -ar 48000 -ac 2 -movflags +faststart "$out"
}

D=("${durs[@]}");  pf=(); for ((i = 0; i < n; i++)); do pf+=($SEG/p$i.mp4); done
join out/cinearch-app-preview.mp4 "${pf[@]}"
D=("${edurs[@]}"); ef=($SEG/e-open.mp4); for ((i = 0; i < m; i++)); do ef+=($SEG/e$i.mp4); done; ef+=($SEG/e-close.mp4)
join out/cinearch-explainer.mp4 "${ef[@]}"

for v in out/cinearch-app-preview.mp4 out/cinearch-explainer.mp4; do
  printf '%s  ' "$v"; ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,sample_rate,channels:format=duration,size -of compact=p=0:nk=1 "$v" | tr '\n' ' '; echo
done
