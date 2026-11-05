import re,sys
T='/workspace/mugoujia/kaoyan1/学习资料/01_中国建筑史/中国建筑史第7版_OCR文本版.md'
pages={};cur=None
for line in open(T,encoding='utf-8'):
    m=re.match(r'\[P(\d+)\]',line)
    if not m: continue
    n=int(m.group(1))
    mm=re.search(r'〔原PDF第(\d+)页｜教材页码(\d+)〕',line)
    if mm: cur=mm.group(2)
    pages[n]=(cur,line)
for a in sys.argv[1:]:
    n=int(a.strip('P')); print(a,'≈p.',pages[n][0], '(页锚在段落前；跨页段落可能延续到下一页)')
