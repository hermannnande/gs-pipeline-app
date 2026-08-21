# Compression medias creme-anti-cerne-offre (retargeting)
# Sources : tmp-cerne-offre/ -> frontend/public/creme-anti-cerne/ (prefixe rtv-)
# 5 videos mp4 (sans piste audio, loops) + posters webp + 2 photos avant/apres webp
from PIL import Image
import subprocess, os

SRC = 'tmp-cerne-offre'
OUT = 'frontend/public/creme-anti-cerne'
FFMPEG = 'C:/Users/nande/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe'
os.makedirs(OUT, exist_ok=True)

VIDEOS = [
    ('Ma-video-1-1.mp4', 'rtv-1'),
    ('Ma-video-2.mp4',   'rtv-2'),
    ('Ma-video-3.mp4',   'rtv-3'),
    ('Ma-video-4.mp4',   'rtv-4'),
    ('Ma-video-2-1.mp4', 'rtv-5'),
]

def compress_video(src_name, out_name):
    src = os.path.join(SRC, src_name)
    dst = os.path.join(OUT, f'{out_name}.mp4')
    # 720p max, CRF 28, sans audio (videos muettes en boucle), faststart web
    subprocess.run([FFMPEG, '-y', '-i', src, '-vf', "scale='min(720,iw)':-2",
                    '-c:v', 'libx264', '-crf', '28', '-preset', 'slow',
                    '-an', '-movflags', '+faststart', dst],
                   check=True, capture_output=True)
    # poster : 1re frame -> webp
    frame = os.path.join(SRC, '_frame.jpg')
    subprocess.run([FFMPEG, '-y', '-i', dst, '-frames:v', '1', '-q:v', '3', frame],
                   check=True, capture_output=True)
    im = Image.open(frame).convert('RGB')
    if im.width > 720:
        im = im.resize((720, round(im.height * 720 / im.width)), Image.LANCZOS)
    im.save(os.path.join(OUT, f'{out_name}p.webp'), 'WEBP', quality=70, method=6)
    print(f'{out_name}.mp4  {os.path.getsize(dst)//1024:4} Ko  (+poster {os.path.getsize(os.path.join(OUT, out_name+"p.webp"))//1024} Ko)')

def webp(src_name, out_name, max_w=960, q=78):
    im = Image.open(os.path.join(SRC, src_name)).convert('RGB')
    if im.width > max_w:
        im = im.resize((max_w, round(im.height * max_w / im.width)), Image.LANCZOS)
    p = os.path.join(OUT, out_name)
    im.save(p, 'WEBP', quality=q, method=6)
    print(f'{out_name:16} {os.path.getsize(p)//1024:4} Ko  {im.width}x{im.height}')

for src_name, out_name in VIDEOS:
    compress_video(src_name, out_name)

webp('avant-apres-1.jpg', 'rtv-av1.webp')
webp('avant-apres-2.jpg', 'rtv-av2.webp')
print('OK')
