import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter
W,H=1280,670
F="C:/Windows/Fonts/"
B=lambda s: ImageFont.truetype(F+"YuGothB.ttc", s)
M=lambda s: ImageFont.truetype(F+"BIZ-UDGothicB.ttc", s)
CYAN=(0,229,255); PINK=(255,46,170); WHITE=(240,246,255)

# background gradient
bg=Image.new("RGB",(W,H))
px=bg.load()
for y in range(H):
    for x in range(W):
        t=x/W; u=y/H
        px[x,y]=(int(6+18*t*u), int(10+8*(1-u)), int(22+30*t))
d=ImageDraw.Draw(bg,"RGBA")
for x in range(0,W,40): d.line([(x,0),(x,H)],fill=(0,229,255,18))
for y in range(0,H,40): d.line([(0,y),(W,y)],fill=(0,229,255,18))
# corner brackets
for (x,y,sx,sy) in [(40,40,1,1),(W-40,40,-1,1),(40,H-40,1,-1),(W-40,H-40,-1,-1)]:
    d.line([(x,y),(x+60*sx,y)],fill=CYAN+(200,),width=4); d.line([(x,y),(x,y+60*sy)],fill=CYAN+(200,),width=4)

def glow_text(img,pos,text,font,fill,glow,r=14,anchor="la"):
    layer=Image.new("RGBA",img.size,(0,0,0,0)); ImageDraw.Draw(layer).text(pos,text,font=font,fill=glow+(255,),anchor=anchor)
    img.paste(Image.alpha_composite(Image.new("RGBA",img.size,(0,0,0,0)),layer.filter(ImageFilter.GaussianBlur(r))),(0,0),layer.filter(ImageFilter.GaussianBlur(r)))
    ImageDraw.Draw(img).text(pos,text,font=font,fill=fill,anchor=anchor)

img=bg.convert("RGBA")
# big faint number on the right
num=Image.new("RGBA",img.size,(0,0,0,0)); nd=ImageDraw.Draw(num)
nd.text((W-90,H//2-10),"01",font=M(380),fill=(0,0,0,0),stroke_width=4,stroke_fill=PINK+(160,),anchor="rm")
img=Image.alpha_composite(img,num.filter(ImageFilter.GaussianBlur(10)))
img=Image.alpha_composite(img,num)
dd=ImageDraw.Draw(img,"RGBA")
# tag
tag="#週イチ自動化"; vol="VOL.01"
dd.rounded_rectangle([110,118,110+300,170],radius=8,outline=CYAN,width=3)
dd.text((128,124),tag,font=B(34),fill=CYAN)
dd.text((432,126),vol,font=M(32),fill=PINK)
# title
glow_text(img,(106,215),"募集フォームまで",B(96),WHITE,CYAN,18)
glow_text(img,(106,330),"自動化した話",B(96),WHITE,PINK,18)
# flow chips
dd=ImageDraw.Draw(img,"RGBA")
chips=["フォーム","AI判定","台帳","Gmail通知"]
x=110; y=490; f=B(30)
for i,c in enumerate(chips):
    w=dd.textlength(c,font=f)+40
    dd.rounded_rectangle([x,y,x+w,y+56],radius=28,fill=(10,44,66,255),outline=CYAN,width=2)
    dd.text((x+20,y+10),c,font=f,fill=WHITE)
    x+=w
    if i<len(chips)-1:
        dd.text((x+12,y+8),"→",font=f,fill=PINK); x+=60
dd.text((W-110,H-92),"GAS × Gemini × Claude Code",font=M(26),fill=(150,190,220),anchor="ra")
img.convert("RGB").save(sys.argv[1])
