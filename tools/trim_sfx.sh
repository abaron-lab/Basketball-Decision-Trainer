#!/bin/bash
# Kürzt die Rohdateien aus tools/make_sfx.mjs und legt kleine MP3s nach sfx/ (mono, 64 kbit/s).
# Schritte pro Datei: normalisieren, Stille am Anfang und Ende weg, auf Höchstlänge kürzen, kurz ausblenden,
# auf -1 dBFS Spitze normalisieren.
#   tools/trim_sfx.sh [ROHORDNER] [ZIELORDNER]     (Standard: ~/sfx_raw/basketball-iq → sfx)
set -euo pipefail
RAW="${1:-$HOME/sfx_raw/basketball-iq}"
OUT="${2:-$(cd "$(dirname "$0")/.." && pwd)/sfx}"
mkdir -p "$OUT"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

maxlen() { case "$1" in
  dribble*) echo 0.24;; catch*) echo 0.26;; step*) echo 0.14;; squeak*) echo 0.45;; swish*|rim*) echo 0.8;; release*) echo 0.22;; *) echo 0.5;; esac; }

# Vorlauf vor dem lautesten Punkt (Quietschen und Netz bauen sich auf)
prer() { case "$1" in squeak*) echo 0.12;; swish*|rim*) echo 0.06;; *) echo 0.015;; esac; }

shopt -s nullglob
for f in "$RAW"/*.mp3; do
  b="$(basename "$f" .mp3)"; L="$(maxlen "$b")"
  case "$b" in
    tape*)
      ffmpeg -v error -y -i "$f" -af "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.004,atempo=1.8,atrim=end=0.42,afade=t=out:st=0.31:d=0.11" -c:a libmp3lame -b:a 128k "$OUT/$b.mp3"
      continue;;
    hall*) continue;;  # alte Rohdateien der ersetzten Hallenschleife
    cheer*)
      # Beide Tribünenreaktionen auf dieselbe integrierte Lautheit bringen.
      ffmpeg -v error -y -i "$f" -af "silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.015,areverse,afade=t=in:d=0.65,areverse,loudnorm=I=-14:TP=-2:LRA=8" -ar 44100 -c:a libmp3lame -b:a 160k "$OUT/$b.mp3"
      continue;;
    gasp*)
      ffmpeg -v error -y -i "$f" -af "silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.025,volume=-4dB,areverse,afade=t=in:d=0.15,areverse" -c:a libmp3lame -b:a 128k "$OUT/$b.mp3"
      continue;;
  esac
  # Start am lautesten Punkt (5-ms-Fenster) minus Vorlauf: bei mehreren Aufprallen zählt der stärkste
  PK="$(ffmpeg -v error -i "$f" -ac 1 -af "asetnsamples=220,astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.Peak_level:file=-" -f null - 2>/dev/null \
    | awk -F'[ =:]+' '/pts_time/{for(i=1;i<=NF;i++)if($i=="pts_time")t=$(i+1)} /Peak_level/{v=$NF; if(v=="-inf")v=-999; if(v+0>m||m==""){m=v+0;bt=t}} END{print bt+0}')"
  S0="$(awk -v t="$PK" -v r="$(prer "$b")" 'BEGIN{s=t-r; if(s<0)s=0; printf "%.3f", s}')"
  # erst auf -1 dBFS normalisieren, dann Stille vorn (und hinten über umdrehen) entfernen und kürzen
  P="$(ffmpeg -v info -i "$f" -af volumedetect -f null - 2>&1 | sed -n 's/.*max_volume: \(-*[0-9.]*\) dB.*/\1/p')"
  if awk -v p="${P:--99}" 'BEGIN{exit !(p<-35)}'; then echo "$b: fast still (Spitze $P dB), übersprungen"; continue; fi
  ffmpeg -v error -y -i "$f" -ac 1 -af "atrim=start=$S0,asetpts=PTS-STARTPTS,volume=$(awk -v p="$P" 'BEGIN{printf "%.2f", -1-p}')dB,silenceremove=start_periods=1:start_threshold=-30dB:start_silence=0.004,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,atrim=0:$L" "$TMP/a.wav"
  D="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$TMP/a.wav")"
  FD="$(awk -v d="$D" 'BEGIN{x=d*0.25; if(x>0.06)x=0.06; printf "%.3f", x}')"
  # Quietschen hört abrupt auf (Schuh greift): hinter der letzten lauten Stelle (> -14 dBFS) hart abschneiden, kein Hallschwanz
  if [[ "$b" == squeak* ]]; then
    E="$(ffmpeg -v error -i "$TMP/a.wav" -af "asetnsamples=220,astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.Peak_level:file=-" -f null - 2>/dev/null \
      | awk -F'[ =:]+' '/pts_time/{for(i=1;i<=NF;i++)if($i=="pts_time")t=$(i+1)} /Peak_level/{if($NF!="-inf"&&$NF+0>-14)e=t} END{printf "%.3f", e+0.01}')"
    D="$(awk -v d="$D" -v e="$E" 'BEGIN{printf "%.3f", (e<d?e:d)}')"; FD=0.008
  fi
  ST="$(awk -v d="$D" -v f="$FD" 'BEGIN{printf "%.3f", d-f}')"
  MAX="$(ffmpeg -v info -i "$TMP/a.wav" -af volumedetect -f null - 2>&1 | sed -n 's/.*max_volume: \(-*[0-9.]*\) dB.*/\1/p')"
  G="$(awk -v m="${MAX:-0}" 'BEGIN{printf "%.2f", -1-m}')"
  ffmpeg -v error -y -i "$TMP/a.wav" -af "atrim=end=$D,afade=t=in:d=0.003,afade=t=out:st=$ST:d=$FD,volume=${G}dB" -ac 1 -ar 44100 -c:a libmp3lame -b:a 64k "$OUT/$b.mp3"
  printf '%-12s %5.2f s  %+6.1f dB  %s\n' "$b" "$D" "$G" "$(du -h "$OUT/$b.mp3" | cut -f1)"
done
du -ch "$OUT"/*.mp3 | tail -1
