#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# Generate MP4 narrated videos for EN and AR using moviepy + PIL + ffmpeg
import pathlib, os
from PIL import Image, ImageDraw, ImageFont
from moviepy import AudioFileClip, ImageClip, concatenate_videoclips
import imageio_ffmpeg

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
print("ffmpeg:", FFMPEG)

OUT_DIR = pathlib.Path(__file__).parent.parent / "presentations"
AUDIO_DIR = OUT_DIR / "audio"
VIDEO_DIR = OUT_DIR / "video"
VIDEO_DIR.mkdir(exist_ok=True)

# Try to find a font for Arabic; fallback to default
# On linux, check common fonts
FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
]

def get_font(size, bold=False):
    for p in FONT_CANDIDATES:
        if pathlib.Path(p).exists():
            try:
                return ImageFont.truetype(p, size)
            except: pass
    return ImageFont.load_default()

# Slide data for video titles
SLIDES_EN_VIDEO = [
    ("TEACH-LAP", "AI-Powered Teaching Assistant for ELT", "cover"),
    ("What is TEACH-LAP?", "Private platform • Gemini → Markdown • auto-saved", "def"),
    ("Why It Matters", "Save time • Quality SAMR/TPACK • Privacy • Real fit", "imp"),
    ("Who Is It For?", "Teacher A/B • Students invited • Management", "aud"),
    ("Benefits & Conclusion", "Generate→Save→Publish→Track • Professional hub", "ben"),
    ("How It Works — 8 Steps", "Login → Courses → Invite → Generate → History → Publish → Track → Logout", "work"),
    ("Technical Concept", "Next.js • Supabase • Gemini • HMAC", "tech"),
    ("Screens & Experience", "Home • Teacher Dashboard • Course • Student", "screen"),
    ("Technical Project Idea — A. Inas Mesbah", "English Dept • Faculty of Education • Sabratha University", "closing"),
]

SLIDES_AR_VIDEO = [
    ("TEACH-LAP", "المساعد التدريسي الذكي لتدريس اللغة الإنجليزية", "cover"),
    ("ما هو TEACH-LAP؟", "منصة خاصة • تحويل نصوص → محاضرة منظمة", "def"),
    ("لماذا هو مهم؟", "توفير وقت • جودة SAMR/TPACK • خصوصية", "imp"),
    ("لمن هذا الموقع؟", "أستاذتان معزولتان • طالبات مدعوات • إدارة", "aud"),
    ("الفائدة والخلاصة", "توليد←حفظ←نشر←متابعة • مركز مهني", "ben"),
    ("كيف يعمل — 8 خطوات", "دخول → مقررات → دعوة → توليد → سجل → نشر → متابعة → خروج", "work"),
    ("البنية التقنية", "Next.js • Supabase • Gemini • HMAC", "tech"),
    ("الشاشات والتجربة", "الرئيسية • لوحة الأستاذة • المقرر • الطالبة", "screen"),
    ("الفكرة التقنية للمشروع — أ. إيناس مصباح", "قسم الإنجليزية • كلية التربية • جامعة صبراتة", "closing"),
]

AUDIO_MAP_EN = [
    "audio/en/01_EN_intro.mp3",
    "audio/en/02_EN_definition.mp3",
    "audio/en/03_EN_importance.mp3",
    "audio/en/04_EN_audience.mp3",
    "audio/en/05_EN_benefits.mp3",
    "audio/en/06_EN_workflow.mp3",
    "audio/en/07_EN_tech.mp3",
    None,  # screenshots — no audio, silent 3s
    "audio/en/08_EN_closing.mp3",
]
AUDIO_MAP_AR = [
    "audio/ar/01_AR_intro.mp3",
    "audio/ar/02_AR_definition.mp3",
    "audio/ar/03_AR_importance.mp3",
    "audio/ar/04_AR_audience.mp3",
    "audio/ar/05_AR_benefits.mp3",
    "audio/ar/06_AR_workflow.mp3",
    "audio/ar/07_AR_tech.mp3",
    None,
    "audio/ar/08_AR_closing.mp3",
]

def make_slide_image(title, subtitle, kind, width=1280, height=720):
    # Background
    if kind in ("cover","closing"):
        bg = (11,60,73)  # NAVY
        fg_title = (255,255,255)
        fg_sub = (227,178,60)
    elif kind == "screen":
        bg = (242,249,251)
        fg_title = (11,60,73)
        fg_sub = (100,116,139)
    else:
        bg = (255,255,255)
        fg_title = (11,60,73)
        fg_sub = (51,65,85)
    img = Image.new("RGB", (width,height), bg)
    draw = ImageDraw.Draw(img)
    # Gold top bar for non-cover
    if kind not in ("cover","closing"):
        draw.rectangle([0,0,width,8], fill=(227,178,60))
    # Badge top right for cover/closing
    if kind in ("cover","closing"):
        # gold bar
        draw.rectangle([0,height-8,width,height], fill=(227,178,60))
        # badge
        draw.rounded_rectangle([width-150, 18, width-20, 46], radius=8, fill=(227,178,60))
        font_badge = get_font(10, True)
        draw.text((width-85, 32), "Next.js • Supabase • Gemini", fill=(11,60,73), font=font_badge, anchor="mm")
    # Title
    font_title = get_font(44 if kind in ("cover","closing") else 32, True)
    font_sub = get_font(18)
    # Wrap title
    # Simple centering
    # Cover large
    if kind in ("cover","closing"):
        # center vertically
        draw.text((width//2, height//2 - 40), title, fill=fg_title, font=font_title, anchor="mm", align="center")
        draw.text((width//2, height//2 + 20), subtitle, fill=fg_sub, font=font_sub, anchor="mm", align="center")
        # S circle for cover
        if kind == "cover":
            cx, cy, r = width-140, height//2 + 60, 45
            draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=(227,178,60))
            font_s = get_font(36, True)
            draw.text((cx, cy), "S", fill=(11,60,73), font=font_s, anchor="mm")
        # divider for closing
        if kind == "closing":
            draw.rectangle([width//2-40, height//2+50, width//2+40, height//2+53], fill=(227,178,60))
    else:
        # section title left
        draw.text((50, 40), title, fill=fg_title, font=font_title, anchor="lm")
        # gold line
        draw.rectangle([50, 78, 120, 82], fill=(227,178,60))
        draw.text((50, 110), subtitle, fill=fg_sub, font=font_sub, anchor="lm")
        # bottom note for tech
        if kind == "tech":
            draw.rounded_rectangle([40, height-50, width-40, height-20], radius=8, fill=(255,248,225))
            # outline not needed
    return img

# Cache images to temp
TEMP_IMG_DIR = pathlib.Path("/tmp/slides_img")
TEMP_IMG_DIR.mkdir(exist_ok=True)

def build_video(slides, audio_map, lang_code, out_name):
    clips = []
    total_sec = 0
    for idx, ((title, subtitle, kind), audio_rel) in enumerate(zip(slides, audio_map)):
        img = make_slide_image(title, subtitle, kind)
        img_path = TEMP_IMG_DIR / f"{lang_code}_{idx}_{kind}.png"
        img.save(img_path)
        if audio_rel:
            audio_path = OUT_DIR / audio_rel
            if not audio_path.exists():
                print(f"Missing audio {audio_path}, using 3s silent")
                duration = 3.0
                audio_clip = None
            else:
                audio_clip = AudioFileClip(str(audio_path))
                duration = audio_clip.duration + 0.4  # padding
        else:
            # silent slide 3.5s
            duration = 3.5
            audio_clip = None
        # Image clip
        img_clip = ImageClip(str(img_path), duration=duration)
        if audio_clip:
            img_clip = img_clip.with_audio(audio_clip)
        clips.append(img_clip)
        total_sec += duration
        print(f"Slide {idx+1} {kind}: {duration:.1f}s {audio_rel or 'silent'}")
    print(f"Total {lang_code} duration ~{total_sec:.1f}s, {len(clips)} clips")
    final = concatenate_videoclips(clips, method="compose")
    out_path = VIDEO_DIR / out_name
    # Write with ffmpeg via moviepy, using imageio_ffmpeg binary
    # moviepy will auto-find ffmpeg via imageio_ffmpeg
    final.write_videofile(str(out_path), fps=24, codec="libx264", audio_codec="aac", threads=2, preset="ultrafast", logger="bar")
    print(f"Saved {out_path} {out_path.stat().st_size/1_048_576:.1f} MB")
    return out_path

print("=== Building EN video ===")
en_video = build_video(SLIDES_EN_VIDEO, AUDIO_MAP_EN, "en", "TEACH-LAP_EN_narrated.mp4")
print("=== Building AR video ===")
ar_video = build_video(SLIDES_AR_VIDEO, AUDIO_MAP_AR, "ar", "TEACH-LAP_AR_narrated.mp4")
print("Done videos")
