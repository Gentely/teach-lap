from PIL import Image, ImageDraw, ImageFont
from moviepy import AudioFileClip, ImageClip, concatenate_videoclips
import pathlib
OUT_DIR = pathlib.Path("presentations")
VIDEO_DIR = OUT_DIR / "video"
TEMP_IMG_DIR = pathlib.Path("/tmp/slides_img")

def get_font(size):
    for p in ["/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"]:
        if pathlib.Path(p).exists():
            try:
                return ImageFont.truetype(p, size)
            except: pass
    return ImageFont.load_default()

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
AUDIO_MAP_AR = [
    "audio/ar/01_AR_intro.mp3","audio/ar/02_AR_definition.mp3","audio/ar/03_AR_importance.mp3","audio/ar/04_AR_audience.mp3","audio/ar/05_AR_benefits.mp3","audio/ar/06_AR_workflow.mp3","audio/ar/07_AR_tech.mp3",None,"audio/ar/08_AR_closing.mp3",
]

def make_slide_image(title, subtitle, kind, width=1280, height=720):
    if kind in ("cover","closing"):
        bg=(11,60,73); fg_title=(255,255,255); fg_sub=(227,178,60)
    elif kind=="screen": bg=(242,249,251); fg_title=(11,60,73); fg_sub=(100,116,139)
    else: bg=(255,255,255); fg_title=(11,60,73); fg_sub=(51,65,85)
    img=Image.new("RGB",(width,height),bg)
    draw=ImageDraw.Draw(img)
    if kind not in ("cover","closing"):
        draw.rectangle([0,0,width,8], fill=(227,178,60))
    if kind in ("cover","closing"):
        draw.rectangle([0,height-8,width,height], fill=(227,178,60))
        draw.rounded_rectangle([width-150,18,width-20,46], radius=8, fill=(227,178,60))
        font_badge=get_font(10)
        draw.text((width-85,32), "Next.js • Supabase • Gemini", fill=(11,60,73), font=font_badge, anchor="mm")
    font_title=get_font(44 if kind in ("cover","closing") else 32)
    font_sub=get_font(18)
    if kind in ("cover","closing"):
        draw.text((width//2, height//2-40), title, fill=fg_title, font=font_title, anchor="mm", align="center")
        draw.text((width//2, height//2+20), subtitle, fill=fg_sub, font=font_sub, anchor="mm", align="center")
        if kind=="cover":
            cx,cy,r=width-140,height//2+60,45
            draw.ellipse([cx-r,cy-r,cx+r,cy+r], fill=(227,178,60))
            font_s=get_font(36)
            draw.text((cx,cy), "S", fill=(11,60,73), font=font_s, anchor="mm")
        if kind=="closing":
            draw.rectangle([width//2-40, height//2+50, width//2+40, height//2+53], fill=(227,178,60))
    else:
        draw.text((50,40), title, fill=fg_title, font=font_title, anchor="lm")
        draw.rectangle([50,78,120,82], fill=(227,178,60))
        draw.text((50,110), subtitle, fill=fg_sub, font=font_sub, anchor="lm")
        if kind=="tech":
            draw.rounded_rectangle([40,height-50,width-40,height-20], radius=8, fill=(255,248,225))
    return img

clips=[]
for idx,((title,subtitle,kind),audio_rel) in enumerate(zip(SLIDES_AR_VIDEO, AUDIO_MAP_AR)):
    img=make_slide_image(title,subtitle,kind)
    img_path=TEMP_IMG_DIR / f"ar_{idx}_{kind}_2.png"
    img.save(img_path)
    if audio_rel:
        audio_path=OUT_DIR / audio_rel
        audio_clip=AudioFileClip(str(audio_path))
        duration=audio_clip.duration+0.4
    else:
        duration=3.5
        audio_clip=None
    img_clip=ImageClip(str(img_path), duration=duration)
    if audio_clip:
        img_clip=img_clip.with_audio(audio_clip)
    clips.append(img_clip)
    print(f"AR slide {idx+1} {duration:.1f}s")

final=concatenate_videoclips(clips, method="compose")
out=VIDEO_DIR / "TEACH-LAP_AR_narrated.mp4"
final.write_videofile(str(out), fps=24, codec="libx264", audio_codec="aac", threads=2, preset="ultrafast")
print(f"Saved {out} {out.stat().st_size/1_048_576:.1f} MB")
