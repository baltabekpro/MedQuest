from docx import Document
from docx.shared import RGBColor

# Открываем сгенерированный файл
try:
    doc = Document('c:/Users/workb/Downloads/edu/баха/MedQuest/docs/Отчет_по_преддипломной_практике_Галахов_Ярослав_FINAL.docx')
    
    # Проходим по всем стилям и ищем заголовки (Heading 1, Heading 2 и т.д.)
    for style in doc.styles:
        if style.name.startswith('Heading'):
            # Делаем цвет черным и шрифт жирным
            style.font.color.rgb = RGBColor(0, 0, 0)
            style.font.bold = True
            
    # Сохраняем в новый файл, чтобы не конфликтовать, если старый открыт в Word
    doc.save('c:/Users/workb/Downloads/edu/баха/MedQuest/docs/Отчет_по_преддипломной_практике_Галахов_Ярослав_ГОТОВЫЙ.docx')
    print("Стили успешно изменены на черные!")
except Exception as e:
    print("Ошибка:", e)
