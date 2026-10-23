#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# Generate narrated PPTX with embedded audio (audio icon, play on click) + produce per-slide transitions where possible
import os, pathlib
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from PIL import Image
import io

# Reuse helpers from generate_presentations.py logic
NAVY = RGBColor(0x0B, 0x3C, 0x49)
GOLD = RGBColor(0xE3, 0xB2, 0x3C)
WHITE = RGBColor(0xFF,0xFF,0xFF)
TEAL = RGBColor(0x14,0x65,0x7A)
GOLD_LIGHT = RGBColor(0xFF,0xF0,0xC0)
SLATE_BG = RGBColor(0xF2,0xF9,0xFB)
SLATE_700 = RGBColor(0x33,0x41,0x55)
SLATE_100 = RGBColor(0xF1,0xF5,0xF9)

OUT_DIR = pathlib.Path(__file__).parent.parent / "presentations"
AUDIO_DIR = OUT_DIR / "audio"
OUT_DIR.mkdir(exist_ok=True)

# Poster image 1x1 transparent for audio icon
def make_poster(path):
    img = Image.new("RGBA", (64,64), (227,178,60,255))
    # draw simple play triangle
    from PIL import ImageDraw
    draw = ImageDraw.Draw(img)
    draw.polygon([(20,18),(20,46),(44,32)], fill=(11,60,73,255))
    img.save(path, "PNG")
    return path

POSTER = OUT_DIR / "_poster.png"
make_poster(POSTER)

# Import slide definitions from generate_presentations
import importlib.util, sys
spec = importlib.util.spec_from_file_location("gen", str(pathlib.Path(__file__).parent / "generate_presentations.py"))
gen = importlib.util.module_from_spec(spec)
sys.modules["gen"] = gen
spec.loader.exec_module(gen)
SLIDES_EN = gen.SLIDES_EN
SLIDES_AR = gen.SLIDES_AR

def add_bg(slide, color):
    bg = slide.background
    fill = bg.fill
    fill.solid()
    fill.fore_color.rgb = color

def add_shape(slide, shape_type, left, top, width, height, fill_color=None, line_color=None):
    shape = slide.shapes.add_shape(shape_type, left, top, width, height)
    if fill_color:
        shape.fill.solid()
        shape.fill.fore_color.rgb = fill_color
    else:
        shape.fill.background()
    if line_color:
        shape.line.color.rgb = line_color
    else:
        shape.line.fill.background()
    return shape

def add_textbox(slide, left, top, width, height, text, font_size=14, bold=False, color=NAVY, alignment=PP_ALIGN.LEFT, font_name="Calibri", italic=False):
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = text
    p.font.size = Pt(font_size)
    p.font.bold = bold
    p.font.color.rgb = color
    p.font.name = font_name
    p.font.italic = italic
    p.alignment = alignment
    return txBox

def add_para(text_frame, text, font_size=12, bold=False, color=SLATE_700, alignment=PP_ALIGN.LEFT, font_name="Calibri", space_after=Pt(6)):
    p = text_frame.add_paragraph()
    p.text = text
    p.font.size = Pt(font_size)
    p.font.bold = bold
    p.font.color.rgb = color
    p.font.name = font_name
    p.alignment = alignment
    p.space_after = space_after
    return p

def add_badge(slide, left, top, text, bg=GOLD, fg=NAVY):
    shape = add_shape(slide, MSO_SHAPE.ROUNDED_RECTANGLE, left, top, Inches(1.6), Inches(0.35), fill_color=bg)
    tf = shape.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.text = text
    p.font.size = Pt(8)
    p.font.bold = True
    p.font.color.rgb = fg
    p.font.name = "Calibri"
    p.alignment = PP_ALIGN.CENTER
    return shape

def embed_audio(slide, audio_path, left, top, width, height):
    # Embed audio as media; requires poster frame
    # add_movie works for audio if mime_type audio/mpeg
    if not pathlib.Path(audio_path).exists():
        print(f"⚠ audio missing {audio_path}")
        return None
    shape = slide.shapes.add_movie(str(audio_path), left, top, width, height, poster_frame_image=str(POSTER), mime_type="audio/mpeg")
    return shape

def build_narrated(slides_data, is_arabic, audio_subdir, filename):
    prs = Presentation()
    prs.slide_width = Inches(13.33)
    prs.slide_height = Inches(7.5)
    blank = prs.slide_layouts[6]
    mapping = ['intro','definition','importance','audience','benefits','workflow','tech','screenshots','closing']
    ar_map = ['intro','definition','importance','audience','benefits','workflow','tech','screenshots','closing']
    for idx, s in enumerate(slides_data):
        slide = prs.slides.add_slide(blank)
        t = s["type"]
        # Reuse rendering logic (copied simplified)
        if t == "cover":
            add_bg(slide, NAVY)
            add_shape(slide, MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.33), Inches(0.12), fill_color=GOLD)
            add_badge(slide, Inches(10.2), Inches(0.45), s["badge"])
            align = PP_ALIGN.RIGHT if is_arabic else PP_ALIGN.LEFT
            add_textbox(slide, Inches(0.8), Inches(0.9), Inches(11.7), Inches(0.4), s["kicker"], font_size=8, bold=True, color=GOLD, alignment=align)
            add_textbox(slide, Inches(0.8), Inches(1.6), Inches(11.7), Inches(1.1), s["title"], font_size=54, bold=True, color=WHITE, alignment=align)
            add_textbox(slide, Inches(0.8), Inches(2.7), Inches(11.7), Inches(0.6), s["subtitle"], font_size=22, bold=False, color=GOLD_LIGHT, alignment=align)
            add_textbox(slide, Inches(0.8), Inches(3.5), Inches(7.5), Inches(0.8), s["desc"], font_size=11, bold=False, color=WHITE, alignment=align)
            add_textbox(slide, Inches(0.8), Inches(6.9), Inches(11.7), Inches(0.3), s["footer"], font_size=7, bold=False, color=RGBColor(0xAA,0xBB,0xCC), alignment=PP_ALIGN.CENTER)
            c = add_shape(slide, MSO_SHAPE.OVAL, Inches(10.5), Inches(3.2), Inches(1.4), Inches(1.4), fill_color=GOLD)
            tf = c.text_frame
            tf.vertical_anchor = MSO_ANCHOR.MIDDLE
            tf.word_wrap = True
            p = tf.paragraphs[0]
            p.text = "S"
            p.font.size = Pt(44); p.font.bold = True; p.font.color.rgb = NAVY; p.font.name = "Calibri"; p.alignment = PP_ALIGN.CENTER
        elif t == "definition":
            add_bg(slide, WHITE)
            add_shape(slide, MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.33), Inches(0.08), fill_color=NAVY)
            add_textbox(slide, Inches(0.6), Inches(0.35), Inches(3), Inches(0.3), s["section"], font_size=8, bold=True, color=TEAL, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT)
            add_textbox(slide, Inches(0.6), Inches(0.75), Inches(8), Inches(0.5), s["title"], font_size=28, bold=True, color=NAVY, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT)
            left = Inches(0.6) if not is_arabic else Inches(4.8)
            tx = slide.shapes.add_textbox(left, Inches(1.5), Inches(7.6), Inches(5.2))
            tf = tx.text_frame; tf.word_wrap = True
            for bullet in s["bullets"]:
                add_para(tf, f"•  {bullet}", font_size=9, bold=False, color=SLATE_700, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT, space_after=Pt(8))
            side_left = Inches(8.8) if not is_arabic else Inches(0.6)
            card = add_shape(slide, MSO_SHAPE.ROUNDED_RECTANGLE, side_left, Inches(1.5), Inches(3.9), Inches(4.3), fill_color=SLATE_BG, line_color=RGBColor(0xE6,0xF2,0xF5))
            add_textbox(slide, side_left + Inches(0.3), Inches(1.8), Inches(3.3), Inches(0.3), s["side_title"], font_size=10, bold=True, color=NAVY, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT)
            t2 = slide.shapes.add_textbox(side_left + Inches(0.3), Inches(2.3), Inches(3.3), Inches(3.0))
            tf2 = t2.text_frame; tf2.word_wrap = True
            for b in s["side_bullets"]:
                add_para(tf2, f"✓  {b}", font_size=9, bold=False, color=SLATE_700, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT, space_after=Pt(10))
        elif t == "importance":
            add_bg(slide, WHITE)
            add_shape(slide, MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.33), Inches(0.08), fill_color=NAVY)
            add_textbox(slide, Inches(0.6), Inches(0.35), Inches(3), Inches(0.3), s["section"], font_size=8, bold=True, color=TEAL, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT)
            add_textbox(slide, Inches(0.6), Inches(0.75), Inches(8), Inches(0.5), s["title"], font_size=28, bold=True, color=NAVY, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT)
            for i, (title, desc) in enumerate(s["cards"]):
                col = i % 2; row = i // 2
                left = Inches(0.6) + col * Inches(6.4); top = Inches(1.6) + row * Inches(2.8)
                card = add_shape(slide, MSO_SHAPE.ROUNDED_RECTANGLE, left, top, Inches(6.1), Inches(2.45), fill_color=WHITE, line_color=RGBColor(0xE2,0xE8,0xF0))
                add_textbox(slide, left + Inches(0.3), top + Inches(0.25), Inches(5.5), Inches(0.4), title, font_size=10, bold=True, color=NAVY, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT)
                add_textbox(slide, left + Inches(0.3), top + Inches(0.75), Inches(5.5), Inches(1.4), desc, font_size=8.5, bold=False, color=SLATE_700, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT)
                add_shape(slide, MSO_SHAPE.RECTANGLE, left, top, Inches(0.08), Inches(2.45), fill_color=GOLD)
        elif t == "audience":
            add_bg(slide, WHITE)
            add_shape(slide, MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.33), Inches(0.08), fill_color=NAVY)
            add_textbox(slide, Inches(0.6), Inches(0.35), Inches(4), Inches(0.3), s["section"], font_size=8, bold=True, color=TEAL, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT)
            add_textbox(slide, Inches(0.6), Inches(0.75), Inches(8), Inches(0.5), s["title"], font_size=28, bold=True, color=NAVY, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT)
            for i, (col_title, bullets) in enumerate(s["cols"]):
                left = Inches(0.6) + i * Inches(4.25)
                hdr = add_shape(slide, MSO_SHAPE.ROUNDED_RECTANGLE, left, Inches(1.55), Inches(4.0), Inches(0.45), fill_color=NAVY)
                add_textbox(slide, left + Inches(0.15), Inches(1.6), Inches(3.7), Inches(0.35), col_title, font_size=8, bold=True, color=GOLD, alignment=PP_ALIGN.CENTER)
                tx = slide.shapes.add_textbox(left + Inches(0.15), Inches(2.2), Inches(3.7), Inches(4.8))
                tf = tx.text_frame; tf.word_wrap = True
                for b in bullets:
                    add_para(tf, f"•  {b}", font_size=7.5, bold=False, color=SLATE_700, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT, space_after=Pt(7))
        elif t == "benefits":
            add_bg(slide, WHITE)
            add_shape(slide, MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.33), Inches(0.08), fill_color=NAVY)
            add_textbox(slide, Inches(0.6), Inches(0.35), Inches(4), Inches(0.3), s["section"], font_size=8, bold=True, color=TEAL, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT)
            add_textbox(slide, Inches(0.6), Inches(0.75), Inches(8), Inches(0.5), s["title"], font_size=28, bold=True, color=NAVY, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT)
            left_tx = slide.shapes.add_textbox(Inches(0.6), Inches(1.55), Inches(7.5), Inches(5.3))
            tf = left_tx.text_frame; tf.word_wrap = True
            for title, desc in s["left"]:
                add_para(tf, title, font_size=9, bold=True, color=NAVY, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT, space_after=Pt(2))
                add_para(tf, desc, font_size=8, bold=False, color=SLATE_700, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT, space_after=Pt(14))
            card = add_shape(slide, MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.6), Inches(1.55), Inches(4.1), Inches(5.3), fill_color=NAVY)
            add_textbox(slide, Inches(8.9), Inches(1.8), Inches(3.5), Inches(0.4), s["right_title"], font_size=10, bold=True, color=GOLD, alignment=PP_ALIGN.CENTER)
            add_textbox(slide, Inches(8.9), Inches(2.35), Inches(3.5), Inches(4.4), s["right_text"], font_size=8.5, bold=False, color=WHITE, alignment=PP_ALIGN.CENTER)
        elif t == "workflow":
            add_bg(slide, WHITE)
            add_shape(slide, MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.33), Inches(0.08), fill_color=NAVY)
            add_textbox(slide, Inches(0.6), Inches(0.35), Inches(4), Inches(0.3), s["section"], font_size=8, bold=True, color=TEAL, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT)
            add_textbox(slide, Inches(0.6), Inches(0.75), Inches(8), Inches(0.5), s["title"], font_size=24, bold=True, color=NAVY, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT)
            for i, (step_title, step_desc) in enumerate(s["steps"]):
                col = i % 2; row = i // 2
                left = Inches(0.6) + col * Inches(6.4); top = Inches(1.5) + row * Inches(1.45)
                num = add_shape(slide, MSO_SHAPE.OVAL, left, top + Inches(0.05), Inches(0.45), Inches(0.45), fill_color=GOLD)
                tf = num.text_frame; tf.vertical_anchor = MSO_ANCHOR.MIDDLE; tf.word_wrap = True
                p = tf.paragraphs[0]; p.text = str(i+1); p.font.size = Pt(10); p.font.bold = True; p.font.color.rgb = NAVY; p.font.name = "Calibri"; p.alignment = PP_ALIGN.CENTER
                add_textbox(slide, left + Inches(0.6), top, Inches(5.6), Inches(0.35), step_title, font_size=8, bold=True, color=NAVY, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT)
                add_textbox(slide, left + Inches(0.6), top + Inches(0.3), Inches(5.6), Inches(1.0), step_desc, font_size=7, bold=False, color=SLATE_700, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT)
        elif t == "tech":
            add_bg(slide, WHITE)
            add_shape(slide, MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.33), Inches(0.08), fill_color=NAVY)
            add_textbox(slide, Inches(0.6), Inches(0.35), Inches(4), Inches(0.3), s["section"], font_size=8, bold=True, color=TEAL, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT)
            add_textbox(slide, Inches(0.6), Inches(0.75), Inches(8), Inches(0.5), s["title"], font_size=28, bold=True, color=NAVY, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT)
            for i, (col_title, bullets) in enumerate(s["cols2"]):
                left = Inches(0.6) + i * Inches(6.4)
                add_textbox(slide, left, Inches(1.55), Inches(6.0), Inches(0.35), col_title, font_size=9, bold=True, color=NAVY, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT)
                add_shape(slide, MSO_SHAPE.RECTANGLE, left, Inches(1.9), Inches(1.2), Inches(0.06), fill_color=GOLD)
                tx = slide.shapes.add_textbox(left, Inches(2.1), Inches(6.0), Inches(4.0))
                tf = tx.text_frame; tf.word_wrap = True
                for b in bullets:
                    add_para(tf, f"•  {b}", font_size=7.2, bold=False, color=SLATE_700, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT, space_after=Pt(8))
            note_box = add_shape(slide, MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), Inches(6.6), Inches(12.1), Inches(0.55), fill_color=RGBColor(0xFF,0xF8,0xE1), line_color=RGBColor(0xF0,0xE6,0xC2))
            add_textbox(slide, Inches(0.8), Inches(6.65), Inches(11.7), Inches(0.45), s["note"], font_size=6.5, bold=False, color=RGBColor(0x7C,0x5A,0x0A), alignment=PP_ALIGN.CENTER)
        elif t == "screenshots":
            add_bg(slide, SLATE_BG)
            add_shape(slide, MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.33), Inches(0.08), fill_color=NAVY)
            add_textbox(slide, Inches(0.6), Inches(0.35), Inches(4), Inches(0.3), s["section"], font_size=8, bold=True, color=TEAL, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT)
            add_textbox(slide, Inches(0.6), Inches(0.75), Inches(8), Inches(0.5), s["title"], font_size=28, bold=True, color=NAVY, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT)
            for i, (title, desc) in enumerate(s["items"]):
                col = i % 2; row = i // 2
                left = Inches(0.6) + col * Inches(6.4); top = Inches(1.55) + row * Inches(2.65)
                card = add_shape(slide, MSO_SHAPE.ROUNDED_RECTANGLE, left, top, Inches(6.1), Inches(2.35), fill_color=WHITE, line_color=RGBColor(0xE2,0xE8,0xF0))
                add_shape(slide, MSO_SHAPE.ROUNDED_RECTANGLE, left + Inches(0.15), top + Inches(0.2), Inches(5.8), Inches(0.35), fill_color=SLATE_100)
                add_textbox(slide, left + Inches(0.3), top + Inches(0.23), Inches(5.5), Inches(0.3), title, font_size=7, bold=True, color=NAVY, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT)
                add_textbox(slide, left + Inches(0.3), top + Inches(0.7), Inches(5.5), Inches(1.4), desc, font_size=7.5, bold=False, color=SLATE_700, alignment=PP_ALIGN.LEFT if not is_arabic else PP_ALIGN.RIGHT)
        elif t == "closing":
            add_bg(slide, NAVY)
            add_shape(slide, MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.33), Inches(0.12), fill_color=GOLD)
            add_textbox(slide, Inches(0.8), Inches(0.9), Inches(11.7), Inches(0.4), s["kicker"], font_size=8, bold=True, color=GOLD, alignment=PP_ALIGN.CENTER)
            add_textbox(slide, Inches(0.8), Inches(1.6), Inches(11.7), Inches(0.6), s["title"], font_size=30, bold=True, color=WHITE, alignment=PP_ALIGN.CENTER)
            add_shape(slide, MSO_SHAPE.RECTANGLE, Inches(5.9), Inches(2.4), Inches(1.5), Inches(0.08), fill_color=GOLD)
            add_textbox(slide, Inches(0.8), Inches(2.8), Inches(11.7), Inches(0.7), s["name"], font_size=28, bold=True, color=GOLD, alignment=PP_ALIGN.CENTER)
            add_textbox(slide, Inches(1.5), Inches(3.8), Inches(10.3), Inches(1.8), s["desc"], font_size=10, bold=False, color=WHITE, alignment=PP_ALIGN.CENTER)
            add_textbox(slide, Inches(1.5), Inches(6.1), Inches(10.3), Inches(0.5), s["note"], font_size=7, bold=False, color=RGBColor(0xAA,0xBB,0xCC), alignment=PP_ALIGN.CENTER, italic=True)
        # embed audio for this slide
        # mapping index to audio filename: for EN: 01_EN_intro etc, for AR similarly
        idx1 = idx+1
        # Map slide index to audio (screenshots slide has no narration — skip or use generic)
        if s["type"] == "screenshots":
            # No dedicated voiceover for screenshots preview — skip embedding but add note
            add_textbox(slide, Inches(11.0), Inches(0.15), Inches(1.2), Inches(0.4), "🔇 Preview", font_size=7, bold=True, color=GOLD if s["type"]=="cover" or s["type"]=="closing" else NAVY, alignment=PP_ALIGN.RIGHT)
            continue
        if not is_arabic:
            names = ['intro','definition','importance','audience','benefits','workflow','tech','screenshots','closing']
            audio_name = f"{idx1:02d}_EN_{names[idx]}.mp3"
            # Adjust for skipped screenshots: EN audios are only 8, but slide 8 is screenshots. For closing (idx 8), audio is 08_EN_closing
            # So we need to handle offset: if idx >=7 (screenshots) shift audio index
            # Simpler: direct mapping by slide type to audio file
            type_to_audio_en = {
                'cover':'01_EN_intro.mp3','definition':'02_EN_definition.mp3','importance':'03_EN_importance.mp3','audience':'04_EN_audience.mp3','benefits':'05_EN_benefits.mp3','workflow':'06_EN_workflow.mp3','tech':'07_EN_tech.mp3','closing':'08_EN_closing.mp3'
            }
            audio_name = type_to_audio_en.get(s["type"], f"{idx1:02d}_EN_{names[idx]}.mp3")
            audio_path = AUDIO_DIR / "en" / audio_name
        else:
            type_to_audio_ar = {
                'cover':'01_AR_intro.mp3','definition':'02_AR_definition.mp3','importance':'03_AR_importance.mp3','audience':'04_AR_audience.mp3','benefits':'05_AR_benefits.mp3','workflow':'06_AR_workflow.mp3','tech':'07_AR_tech.mp3','closing':'08_AR_closing.mp3'
            }
            names_ar = ['intro','definition','importance','audience','benefits','workflow','tech','screenshots','closing']
            audio_name = type_to_audio_ar.get(s["type"], f"{idx1:02d}_AR_{names_ar[idx]}.mp3")
            audio_path = AUDIO_DIR / "ar" / audio_name
        embed_audio(slide, audio_path, Inches(12.3), Inches(0.15), Inches(0.6), Inches(0.4))
        # add small label
        add_textbox(slide, Inches(11.0), Inches(0.15), Inches(1.2), Inches(0.4), "🔊 Audio", font_size=7, bold=True, color=GOLD if s["type"]=="cover" or s["type"]=="closing" else NAVY, alignment=PP_ALIGN.RIGHT)

    out = OUT_DIR / filename
    prs.save(str(out))
    print(f"Saved narrated {filename} with embedded audio")

build_narrated(SLIDES_EN, False, "en", "TEACH-LAP_Overview_EN_narrated.pptx")
build_narrated(SLIDES_AR, True, "ar", "TEACH-LAP_Overview_AR_narrated.pptx")
print("Done narrated PPTX")
