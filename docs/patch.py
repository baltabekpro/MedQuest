import re

with open('c:/Users/workb/Downloads/edu/баха/MedQuest/docs/Отчет_по_преддипломной_практике_Галахов_Ярослав.md', 'r', encoding='utf-8') as f:
    text = f.read()

# Find the TOC block and replace it
toc_start = text.find('<div style="page-break-inside: avoid;">\n<h2 align="center">СОДЕРЖАНИЕ</h2>')
toc_end = text.find('</div>', toc_start) + 6

openxml_toc = """<h2 align="center">СОДЕРЖАНИЕ</h2>

```{=openxml}
<w:sdt>
  <w:sdtContent>
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
      </w:pPr>
      <w:r>
        <w:t>Здесь появится оглавление. Нажмите правой кнопкой мыши по этому тексту -> "Обновить поле" (Update Field).</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:fldChar w:fldCharType="begin"/>
      </w:r>
      <w:r>
        <w:instrText xml:space="preserve"> TOC \\o "1-3" \\h \\z \\u </w:instrText>
      </w:r>
      <w:r>
        <w:fldChar w:fldCharType="separate"/>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:fldChar w:fldCharType="end"/>
      </w:r>
    </w:p>
  </w:sdtContent>
</w:sdt>
```
"""

if toc_start != -1:
    new_text = text[:toc_start] + openxml_toc + text[toc_end:]
    with open('c:/Users/workb/Downloads/edu/баха/MedQuest/docs/Отчет_по_преддипломной_практике_Галахов_Ярослав.md', 'w', encoding='utf-8') as f:
        f.write(new_text)
    print("TOC replaced!")
else:
    print("TOC not found.")
