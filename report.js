const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, LevelFormat, TableOfContents,
  PageBreak, ImageRun, PageNumber, NumberFormat
} = require('docx');
const fs = require('fs');
const path = require('path');

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, bold: true, size: 28, font: "Times New Roman" })],
    spacing: { before: 360, after: 240 },
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, bold: true, size: 26, font: "Times New Roman" })],
    spacing: { before: 280, after: 160 },
  });
}

function p(text, opts = {}) {
  return new Paragraph({
    alignment: opts.center ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
    indent: opts.noIndent ? undefined : { firstLine: 720 },
    spacing: { line: 276, before: 0, after: 0 }, // 1.15 межстрочный интервал
    children: [new TextRun({ text, size: 24, font: "Times New Roman", ...opts.run })],
  });
}

function bold(text) {
  return new TextRun({ text, bold: true, size: 24, font: "Times New Roman" });
}

function run(text) {
  return new TextRun({ text, size: 24, font: "Times New Roman" });
}

function mixedPara(runs, opts = {}) {
  return new Paragraph({
    alignment: opts.center ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
    indent: opts.noIndent ? undefined : { firstLine: 720 },
    spacing: { line: 276, before: 0, after: 0 }, // 1.15 межстрочный интервал
    children: runs,
  });
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { line: 276, before: 0, after: 0 }, // 1.15 межстрочный интервал
    children: [new TextRun({ text, size: 24, font: "Times New Roman" })],
  });
}

function numbered(text) {
  return new Paragraph({
    numbering: { reference: "numbers", level: 0 },
    spacing: { line: 276, before: 0, after: 0 }, // 1.15 межстрочный интервал
    children: [new TextRun({ text, size: 24, font: "Times New Roman" })],
  });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function image(imagePath, width = 600, caption = "") {
  const imageBuffer = fs.readFileSync(path.join(__dirname, 'docs', imagePath));
  const elements = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 120 },
      children: [
        new ImageRun({
          data: imageBuffer,
          transformation: { width, height: width * 0.6 }
        })
      ]
    })
  ];
  
  if (caption) {
    elements.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 240 },
      children: [new TextRun({ text: caption, size: 20, italics: true, font: "Times New Roman" })]
    }));
  }
  
  return elements;
}

function headerRow(cells, widths) {
  return new TableRow({
    tableHeader: true,
    children: cells.map((text, i) => new TableCell({
      borders,
      width: { size: widths[i], type: WidthType.DXA },
      shading: { fill: "2E75B6", type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text, bold: true, size: 22, color: "FFFFFF", font: "Times New Roman" })]
      })]
    }))
  });
}

function dataRow(cells, widths, shade = false) {
  return new TableRow({
    children: cells.map((text, i) => new TableCell({
      borders,
      width: { size: widths[i], type: WidthType.DXA },
      shading: { fill: shade ? "EEF4FB" : "FFFFFF", type: ShadingType.CLEAR },
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        children: [new TextRun({ text, size: 20, font: "Times New Roman" })]
      })]
    }))
  });
}

const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "–", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 900, hanging: 360 } } }
        }]
      },
      {
        reference: "numbers",
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 900, hanging: 360 } } }
        }]
      },
    ]
  },
  styles: {
    default: {
      document: { run: { font: "Times New Roman", size: 24 } }
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Times New Roman", color: "1F3864" },
        paragraph: { spacing: { before: 360, after: 240 }, outlineLevel: 0 }
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Times New Roman", color: "2E75B6" },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 }
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Times New Roman", color: "333333" },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 }
      },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1700, right: 1134, bottom: 1134, left: 1701 }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "2E75B6" } },
          children: [new TextRun({ text: "Преддипломная практика — MedQuest CRM", size: 18, color: "666666", font: "Times New Roman" })]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: "2E75B6" } },
          children: [
            new TextRun({ text: "Страница ", size: 18, color: "666666", font: "Times New Roman" }),
            new TextRun({
              children: [PageNumber.CURRENT],
              size: 18,
              color: "666666",
              font: "Times New Roman"
            })
          ]
        })]
      })
    },
    children: [
      // ── ТИТУЛЬНАЯ СТРАНИЦА ──
      new Paragraph({ spacing: { before: 480 }, children: [] }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [new TextRun({ text: "МИНИСТЕРСТВО НАУКИ И ВЫСШЕГО ОБРАЗОВАНИЯ РЕСПУБЛИКИ КАЗАХСТАН", size: 22, font: "Times New Roman" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 480 },
        children: [new TextRun({ text: "Учебное заведение", size: 22, font: "Times New Roman" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 240, after: 240 },
        children: [new TextRun({ text: "ОТЧЁТ ПО ПРЕДДИПЛОМНОЙ ПРАКТИКЕ", bold: true, size: 32, font: "Times New Roman" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [new TextRun({ text: "на тему:", size: 24, font: "Times New Roman" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 480 },
        children: [new TextRun({ text: "«MedQuest — CRM-система для регистрации и обработки запросов пациентов»", bold: true, size: 28, font: "Times New Roman" })]
      }),
      new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 80 }, children: [new TextRun({ text: "Выполнил(а): студент(ка) __ курса", size: 22, font: "Times New Roman" })] }),
      new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 80 }, children: [new TextRun({ text: "специальности «Информационные системы»", size: 22, font: "Times New Roman" })] }),
      new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 80 }, children: [new TextRun({ text: "ФИО студента", size: 22, font: "Times New Roman" })] }),
      new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 80 }, children: [new TextRun({ text: "Руководитель практики: ФИО руководителя", size: 22, font: "Times New Roman" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600, after: 0 }, children: [new TextRun({ text: "Алматы, 2024", size: 24, font: "Times New Roman" })] }),

      pageBreak(),

      // ── СОДЕРЖАНИЕ ──
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: "СОДЕРЖАНИЕ", bold: true, size: 28, font: "Times New Roman" })]
      }),
      new TableOfContents("Содержание", {
        hyperlink: true,
        headingStyleRange: "1-3",
      }),

      pageBreak(),

      // ══════════════════════════════════════════
      // ВВЕДЕНИЕ
      // ══════════════════════════════════════════
      h1("ВВЕДЕНИЕ"),
      p("В условиях цифровой трансформации здравоохранения автоматизация процессов регистрации и сопровождения пациентов становится приоритетной задачей медицинских учреждений. Рост числа обращений, необходимость соблюдения регламентов и обеспечения прозрачности рабочих процессов требуют внедрения специализированных информационных систем."),
      p("Преддипломная практика проходила в рамках разработки веб-приложения MedQuest — CRM-системы, предназначенной для автоматизации регистратуры медицинского центра. Система охватывает полный жизненный цикл обращения пациента: от первичной регистрации до закрытия запроса и архивации."),
      p("Актуальность проекта обусловлена отсутствием у большинства небольших медицинских учреждений доступных, но функционально полных инструментов управления потоком пациентов. Коммерческие решения зачастую избыточны и дороги, тогда как MedQuest позиционируется как лёгкий и расширяемый MVP."),
      p("Целью настоящего отчёта является описание результатов, полученных в ходе преддипломной практики: архитектурных решений, реализованных модулей, применённых технологий и приобретённых профессиональных компетенций."),

      pageBreak(),

      // ══════════════════════════════════════════
      // РАЗДЕЛ 1
      // ══════════════════════════════════════════
      h1("1 ОБЩАЯ ХАРАКТЕРИСТИКА БАЗЫ ПРАКТИКИ, ДИПЛОМНОГО ПРОЕКТА И ОРГАНИЗАЦИИ ПРАКТИКИ"),

      h2("1.1 База прохождения практики"),
      p("Преддипломная практика проходила на базе медицинского центра (или IT-компании, осуществляющей разработку программного обеспечения для медицины). В период практики студент был ознакомлен с бизнес-процессами регистратуры, принципами ведения электронных медицинских карт и требованиями к информационной безопасности в сфере здравоохранения."),
      p("Организационная структура базы практики предполагает наличие нескольких категорий пользователей системы: административного персонала, регистраторов и врачей, что непосредственно нашло отражение в ролевой модели разрабатываемой системы."),

      h2("1.2 Характеристика проекта «MedQuest»"),
      p("MedQuest — это веб-ориентированная CRM-система, разработанная для автоматизации регистрации и обработки запросов пациентов в медицинском учреждении. Система обеспечивает:"),
      bullet("быструю регистрацию пациентов и создание медицинских запросов;"),
      bullet("назначение врача на запрос и контроль статусов обращений;"),
      bullet("ролевое разграничение доступа (администратор, регистратор, врач);"),
      bullet("ведение журнала аудита всех изменений в системе;"),
      bullet("сводную статистику и дашборд для оперативного мониторинга."),
      p("Проект реализован в формате монорепозитория с чётким разделением на клиентскую и серверную части, что соответствует принципам современной веб-разработки."),

      h2("1.3 Используемые программные средства"),
      p("В ходе разработки применялся следующий технологический стек:"),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { line: 276, before: 0, after: 0 },
        children: [bold("Frontend: "), run("React 18 + TypeScript — библиотека для построения пользовательских интерфейсов с типизацией;")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { line: 276, before: 0, after: 0 },
        children: [bold("Backend: "), run("FastAPI (Python) — высокопроизводительный асинхронный веб-фреймворк;")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { line: 276, before: 0, after: 0 },
        children: [bold("База данных: "), run("SQLite на этапе MVP, с возможностью последующей миграции на PostgreSQL;")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { line: 276, before: 0, after: 0 },
        children: [bold("ORM: "), run("SQLAlchemy — для абстракции работы с базой данных;")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { line: 276, before: 0, after: 0 },
        children: [bold("Валидация данных: "), run("Pydantic — схемы запросов и ответов API;")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { line: 276, before: 0, after: 0 },
        children: [bold("Аутентификация: "), run("JWT (access + refresh токены);")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { line: 276, before: 0, after: 0 },
        children: [bold("Миграции: "), run("Alembic — версионирование схемы базы данных;")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { line: 276, before: 0, after: 0 },
        children: [bold("HTTP-клиент: "), run("Axios — для взаимодействия фронтенда с API.")]
      }),

      h2("1.4 Цель, задачи и индивидуальное задание"),
      mixedPara([bold("Цель практики: "), run("разработать функциональный MVP CRM-системы MedQuest, включающий backend-ядро и пользовательский интерфейс.")]),
      p("Задачи, решённые в ходе практики:"),
      numbered("Проектирование архитектуры системы и структуры базы данных."),
      numbered("Реализация REST API на FastAPI с поддержкой JWT-аутентификации."),
      numbered("Создание CRUD-эндпоинтов для управления пациентами, запросами и пользователями."),
      numbered("Разработка пользовательского интерфейса на React + TypeScript."),
      numbered("Внедрение системы ролей и разграничения прав доступа."),
      numbered("Реализация журнала аудита и дашборда со статистикой."),
      numbered("Тестирование API через Swagger UI (/docs)."),

      h2("1.5 План выполнения работ"),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [500, 5026, 1500, 2000],
        rows: [
          headerRow(["№", "Этап работ", "Срок", "Статус"], [500, 5026, 1500, 2000]),
          dataRow(["1", "Анализ требований и проектирование архитектуры", "Неделя 1", "Выполнено"], [500, 5026, 1500, 2000], false),
          dataRow(["2", "Проектирование базы данных и создание моделей", "Неделя 2", "Выполнено"], [500, 5026, 1500, 2000], true),
          dataRow(["3", "Реализация backend API (аутентификация, пользователи)", "Неделя 2–3", "Выполнено"], [500, 5026, 1500, 2000], false),
          dataRow(["4", "CRUD пациентов, запросов, аудит", "Неделя 3–4", "Выполнено"], [500, 5026, 1500, 2000], true),
          dataRow(["5", "Разработка frontend: Layout, маршрутизация, роли", "Неделя 4–5", "Выполнено"], [500, 5026, 1500, 2000], false),
          dataRow(["6", "Страницы: Dashboard, Patients, Requests, Users, Audit", "Неделя 5–6", "Выполнено"], [500, 5026, 1500, 2000], true),
          dataRow(["7", "Тестирование и отладка", "Неделя 6–7", "Выполнено"], [500, 5026, 1500, 2000], false),
          dataRow(["8", "Подготовка отчёта", "Неделя 7–8", "Выполнено"], [500, 5026, 1500, 2000], true),
        ]
      }),

      pageBreak(),

      // ══════════════════════════════════════════
      // РАЗДЕЛ 2
      // ══════════════════════════════════════════
      h1("2 МАТЕРИАЛЫ ПО ДИПЛОМНОМУ ПРОЕКТУ"),

      h2("2.1 Анализ текущего состояния и архитектура"),
      p("До начала разработки был проведён анализ существующих решений в сегменте медицинских CRM-систем. Выявлено, что большинство коммерческих продуктов (МИС «МЕДИС», «Инфоклиника», 1С:Медицина) ориентированы на крупные медицинские организации и обладают избыточной функциональностью для небольших центров. Открытые решения (OpenMRS, Bahmni) требуют значительных ресурсов для развёртывания и адаптации."),
      p("На основании анализа была обоснована целесообразность разработки собственного облегчённого MVP с возможностью поэтапного масштабирования."),
      mixedPara([bold("Архитектурное решение: "), run("монорепозиторий с каталогами frontend/ и backend/, REST API как единый контракт взаимодействия, разделение ответственности через слои: маршруты → сервисы → репозитории → модели БД.")]),
      p("Структура проекта:"),
      bullet("medquest/"),
      bullet("  ├── backend/          # FastAPI приложение"),
      bullet("  │   ├── app/"),
      bullet("  │   │   ├── models/   # SQLAlchemy модели"),
      bullet("  │   │   ├── schemas/  # Pydantic схемы"),
      bullet("  │   │   ├── routers/  # API маршруты"),
      bullet("  │   │   └── services/ # Бизнес-логика"),
      bullet("  │   ├── alembic/      # Миграции БД"),
      bullet("  │   └── run.py"),
      bullet("  └── frontend/         # React + TypeScript"),
      bullet("      ├── src/"),
      bullet("      │   ├── pages/    # Страницы приложения"),
      bullet("      │   ├── components/"),
      bullet("      │   └── api/      # Axios-клиент"),

      h2("2.2 Разработка Backend-архитектуры и базы данных"),

      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun({ text: "2.2.1 Модели данных", bold: true, size: 24, font: "Times New Roman" })],
        spacing: { before: 200, after: 120 }
      }),
      p("В системе реализованы четыре основные модели данных:"),
      mixedPara([bold("User (Пользователь): "), run("хранит учётные данные сотрудников — email, хэш пароля, полное имя, роль (admin / registrar / doctor), статус активности и дату создания.")]),
      mixedPara([bold("Patient (Пациент): "), run("содержит демографические данные — ФИО, дата рождения, телефон, email, адрес, дата регистрации и ссылка на создавшего пользователя.")]),
      mixedPara([bold("PatientRequest (Запрос пациента): "), run("основная рабочая сущность — ссылки на пациента и назначенного врача, заголовок, описание, статус (new / in_progress / closed), приоритет (1–5), временны́е метки создания и обновления.")]),
      mixedPara([bold("AuditLog (Журнал аудита): "), run("автоматически создаётся при каждом значимом действии — фиксирует пользователя, тип действия, затронутую сущность, описание и IP-адрес источника.")]),

      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun({ text: "2.2.2 Таблица Users (Пользователи)", bold: true, size: 24, font: "Times New Roman" })],
        spacing: { before: 200, after: 120 }
      }),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2000, 2000, 2526, 2500],
        rows: [
          headerRow(["Поле", "Тип", "Ограничения", "Описание"], [2000, 2000, 2526, 2500]),
          dataRow(["id", "INTEGER", "PK, AUTO", "Уникальный идентификатор"], [2000, 2000, 2526, 2500], false),
          dataRow(["email", "VARCHAR(255)", "UNIQUE, NOT NULL", "Адрес электронной почты"], [2000, 2000, 2526, 2500], true),
          dataRow(["full_name", "VARCHAR(255)", "NOT NULL", "Полное имя пользователя"], [2000, 2000, 2526, 2500], false),
          dataRow(["hashed_password", "VARCHAR", "NOT NULL", "Bcrypt-хэш пароля"], [2000, 2000, 2526, 2500], true),
          dataRow(["role", "ENUM", "NOT NULL", "admin / registrar / doctor"], [2000, 2000, 2526, 2500], false),
          dataRow(["is_active", "BOOLEAN", "DEFAULT TRUE", "Статус активности аккаунта"], [2000, 2000, 2526, 2500], true),
          dataRow(["created_at", "DATETIME", "DEFAULT NOW", "Дата и время создания"], [2000, 2000, 2526, 2500], false),
        ]
      }),

      new Paragraph({ spacing: { before: 160 }, children: [] }),

      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun({ text: "2.2.3 Таблица Patients (Пациенты)", bold: true, size: 24, font: "Times New Roman" })],
        spacing: { before: 200, after: 120 }
      }),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2000, 2000, 2526, 2500],
        rows: [
          headerRow(["Поле", "Тип", "Ограничения", "Описание"], [2000, 2000, 2526, 2500]),
          dataRow(["id", "INTEGER", "PK, AUTO", "Уникальный идентификатор"], [2000, 2000, 2526, 2500], false),
          dataRow(["full_name", "VARCHAR(255)", "NOT NULL", "ФИО пациента"], [2000, 2000, 2526, 2500], true),
          dataRow(["birth_date", "DATE", "NOT NULL", "Дата рождения"], [2000, 2000, 2526, 2500], false),
          dataRow(["phone", "VARCHAR(20)", "NOT NULL", "Контактный телефон"], [2000, 2000, 2526, 2500], true),
          dataRow(["email", "VARCHAR(255)", "NULLABLE", "Электронная почта"], [2000, 2000, 2526, 2500], false),
          dataRow(["address", "TEXT", "NULLABLE", "Домашний адрес"], [2000, 2000, 2526, 2500], true),
          dataRow(["registered_at", "DATETIME", "DEFAULT NOW", "Дата регистрации"], [2000, 2000, 2526, 2500], false),
          dataRow(["created_by_id", "INTEGER", "FK → users.id", "Зарегистрировавший сотрудник"], [2000, 2000, 2526, 2500], true),
        ]
      }),

      new Paragraph({ spacing: { before: 160 }, children: [] }),

      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun({ text: "2.2.4 Таблица PatientRequests (Медицинские запросы)", bold: true, size: 24, font: "Times New Roman" })],
        spacing: { before: 200, after: 120 }
      }),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2000, 2000, 2526, 2500],
        rows: [
          headerRow(["Поле", "Тип", "Ограничения", "Описание"], [2000, 2000, 2526, 2500]),
          dataRow(["id", "INTEGER", "PK, AUTO", "Уникальный идентификатор"], [2000, 2000, 2526, 2500], false),
          dataRow(["patient_id", "INTEGER", "FK → patients.id", "Ссылка на пациента"], [2000, 2000, 2526, 2500], true),
          dataRow(["title", "VARCHAR(255)", "NOT NULL", "Заголовок обращения"], [2000, 2000, 2526, 2500], false),
          dataRow(["description", "TEXT", "NOT NULL", "Подробное описание симптомов"], [2000, 2000, 2526, 2500], true),
          dataRow(["status", "ENUM", "DEFAULT 'new'", "new / in_progress / closed"], [2000, 2000, 2526, 2500], false),
          dataRow(["priority", "INTEGER", "1–5, DEFAULT 3", "Приоритет обработки"], [2000, 2000, 2526, 2500], true),
          dataRow(["assigned_doctor_id", "INTEGER", "FK → users.id, NULLABLE", "Назначенный врач"], [2000, 2000, 2526, 2500], false),
          dataRow(["created_at", "DATETIME", "DEFAULT NOW", "Дата создания запроса"], [2000, 2000, 2526, 2500], true),
          dataRow(["updated_at", "DATETIME", "AUTO UPDATE", "Дата последнего изменения"], [2000, 2000, 2526, 2500], false),
        ]
      }),

      new Paragraph({ spacing: { before: 160 }, children: [] }),

      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun({ text: "2.2.5 Таблица AuditLogs (Журнал аудита)", bold: true, size: 24, font: "Times New Roman" })],
        spacing: { before: 200, after: 120 }
      }),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2000, 2000, 2526, 2500],
        rows: [
          headerRow(["Поле", "Тип", "Ограничения", "Описание"], [2000, 2000, 2526, 2500]),
          dataRow(["id", "INTEGER", "PK, AUTO", "Уникальный идентификатор"], [2000, 2000, 2526, 2500], false),
          dataRow(["user_id", "INTEGER", "FK → users.id", "Совершивший действие"], [2000, 2000, 2526, 2500], true),
          dataRow(["action", "VARCHAR(50)", "NOT NULL", "Тип действия (CREATE, UPDATE, DELETE, LOGIN)"], [2000, 2000, 2526, 2500], false),
          dataRow(["entity", "VARCHAR(50)", "NOT NULL", "Затронутая сущность (Patient, Request, User, Auth)"], [2000, 2000, 2526, 2500], true),
          dataRow(["description", "TEXT", "NULLABLE", "Подробное описание изменения"], [2000, 2000, 2526, 2500], false),
          dataRow(["ip_address", "VARCHAR(45)", "NULLABLE", "IP-адрес источника запроса"], [2000, 2000, 2526, 2500], true),
          dataRow(["created_at", "DATETIME", "DEFAULT NOW", "Дата и время события"], [2000, 2000, 2526, 2500], false),
        ]
      }),

      new Paragraph({ spacing: { before: 160 }, children: [] }),

      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun({ text: "2.2.6 API-эндпоинты", bold: true, size: 24, font: "Times New Roman" })],
        spacing: { before: 200, after: 120 }
      }),
      p("В рамках backend реализованы следующие группы эндпоинтов:"),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [1800, 3226, 4000],
        rows: [
          headerRow(["Метод", "Путь", "Описание"], [1800, 3226, 4000]),
          dataRow(["POST", "/auth/login", "Аутентификация, выдача JWT-токенов"], [1800, 3226, 4000], false),
          dataRow(["POST", "/auth/refresh", "Обновление access-токена"], [1800, 3226, 4000], true),
          dataRow(["GET", "/auth/me", "Профиль текущего пользователя"], [1800, 3226, 4000], false),
          dataRow(["GET/POST", "/users/", "Список и создание пользователей (admin)"], [1800, 3226, 4000], true),
          dataRow(["GET/PUT/DELETE", "/users/{id}", "Операции с пользователем (admin)"], [1800, 3226, 4000], false),
          dataRow(["GET/POST", "/patients/", "Список пациентов, добавление нового"], [1800, 3226, 4000], true),
          dataRow(["GET/PUT/DELETE", "/patients/{id}", "CRUD конкретного пациента"], [1800, 3226, 4000], false),
          dataRow(["GET/POST", "/requests/", "Список запросов, создание запроса"], [1800, 3226, 4000], true),
          dataRow(["GET/PUT/DELETE", "/requests/{id}", "CRUD конкретного запроса"], [1800, 3226, 4000], false),
          dataRow(["GET", "/dashboard/stats", "Сводная статистика для дашборда"], [1800, 3226, 4000], true),
          dataRow(["GET", "/audit/logs", "Журнал аудита с фильтрацией (admin)"], [1800, 3226, 4000], false),
        ]
      }),

      new Paragraph({ spacing: { before: 160 }, children: [] }),

      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun({ text: "2.2.7 Миграции и запуск backend", bold: true, size: 24, font: "Times New Roman" })],
        spacing: { before: 200, after: 120 }
      }),
      p("Управление схемой базы данных осуществляется через Alembic. Из каталога backend/ выполняются следующие команды:"),
      bullet("alembic upgrade head — применить все миграции;"),
      bullet("alembic downgrade -1 — откатить последнюю миграцию;"),
      bullet("alembic revision -m \"описание\" — создать новую миграцию."),
      p("Запуск приложения:"),
      bullet("pip install -r requirements.txt — установка зависимостей;"),
      bullet("alembic upgrade head — инициализация базы данных;"),
      bullet("python run.py — запуск API-сервера."),
      p("После запуска интерактивная документация API доступна по адресу /docs (Swagger UI) и /redoc (ReDoc)."),

      h2("2.3 Разработка пользовательского интерфейса"),
      p("Пользовательский интерфейс системы MedQuest разработан на React 18 с использованием TypeScript. Приложение построено на принципе Single Page Application (SPA) с клиентской маршрутизацией через React Router."),

      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun({ text: "2.3.1 Страница входа (Login)", bold: true, size: 24, font: "Times New Roman" })],
        spacing: { before: 200, after: 120 }
      }),
      p("Страница входа (рисунок 1) реализует форму аутентификации с полями Email и Пароль. Для удобства тестирования предусмотрены быстрые кнопки переключения между демо-аккаунтами трёх ролей. Левая панель содержит маркетинговое описание системы и основные преимущества. При успешной аутентификации access-токен сохраняется в памяти приложения, refresh-токен — в httpOnly cookie."),
      ...image('01-login-page.png', 600, 'Рисунок 1 — Страница входа в систему'),

      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun({ text: "2.3.2 Дашборд (Dashboard)", bold: true, size: 24, font: "Times New Roman" })],
        spacing: { before: 200, after: 120 }
      }),
      p("Главная страница системы (рисунок 2) отображает четыре ключевых показателя: общее число пациентов, количество активных запросов, новые запросы за сегодня и закрытые за день. Для каждого показателя отображается динамика изменения относительно предыдущего периода. Дополнительно представлены таблица последних запросов и график активности за неделю. Метрика закрытых за день запросов вычисляется по границам текущих суток в UTC."),
      ...image('12-dashboard-with-data.png', 600, 'Рисунок 2 — Панель управления с данными'),

      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun({ text: "2.3.3 Список пациентов (Patients)", bold: true, size: 24, font: "Times New Roman" })],
        spacing: { before: 200, after: 120 }
      }),
      p("Страница пациентов (рисунок 3) представляет таблицу с пагинацией, содержащую полное имя, дату рождения, контактные данные, адрес и дату регистрации. Поддерживается поиск по ФИО, телефону и email. Добавление нового пациента выполняется через модальное окно (рисунок 9) с валидацией обязательных полей. При переходе на карточку пациента открывается детальный профиль (рисунок 7) с историей всех запросов и медицинскими заметками."),
      ...image('10-patients-list.png', 600, 'Рисунок 3 — Список пациентов'),
      ...image('07-add-patient-modal.png', 500, 'Рисунок 4 — Модальное окно добавления пациента'),

      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun({ text: "2.3.4 Управление запросами (Requests)", bold: true, size: 24, font: "Times New Roman" })],
        spacing: { before: 200, after: 120 }
      }),
      p("Страница запросов (рисунок 4) обеспечивает просмотр всех обращений с возможностью фильтрации по статусу, приоритету и назначенному врачу. Каждая строка таблицы содержит данные пациента, заголовок, статус, звёздочный рейтинг приоритета, аватар врача и дату создания."),
      p("Страница детального просмотра запроса (рисунок 8) включает: описание обращения, блок смены статуса, историю изменений (таймлайн), назначение врача и аудит запроса в правой боковой панели. Создание нового запроса выполняется через модальное окно (рисунок 10) с полями выбора пациента, заголовка, описания, приоритета, статуса и опциональным назначением врача."),
      ...image('11-requests-list.png', 600, 'Рисунок 5 — Список медицинских запросов'),
      ...image('13-request-detail.png', 600, 'Рисунок 6 — Детальный просмотр запроса'),
      ...image('08-create-request-modal.png', 500, 'Рисунок 7 — Модальное окно создания запроса'),

      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun({ text: "2.3.5 Профиль пользователя (My Profile)", bold: true, size: 24, font: "Times New Roman" })],
        spacing: { before: 200, after: 120 }
      }),
      p("Страница профиля (рисунок 11) позволяет пользователю просматривать и редактировать персональные данные (ФИО, email), изменять пароль с проверкой его надёжности, а также просматривать историю активности своего аккаунта с указанием IP-адреса, браузера, платформы и статуса каждой сессии."),
      ...image('14-profile-page.png', 600, 'Рисунок 8 — Страница профиля пользователя'),

      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun({ text: "2.3.6 Управление пользователями (Users)", bold: true, size: 24, font: "Times New Roman" })],
        spacing: { before: 200, after: 120 }
      }),
      p("Страница управления пользователями (рисунок 9) доступна только администраторам. Она позволяет просматривать список всех пользователей системы, добавлять новых сотрудников, редактировать их данные и управлять статусом активности аккаунтов."),
      ...image('05-users.png', 600, 'Рисунок 9 — Управление пользователями'),
      ...image('09-add-user-modal.png', 500, 'Рисунок 10 — Модальное окно добавления пользователя'),

      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun({ text: "2.3.7 Журнал аудита (Audit Log)", bold: true, size: 24, font: "Times New Roman" })],
        spacing: { before: 200, after: 120 }
      }),
      p("Страница журнала аудита (рисунок 11) предоставляет администраторам полную историю всех действий в системе. Каждая запись содержит информацию о пользователе, типе действия, затронутой сущности, времени события и IP-адресе. Поддерживается фильтрация по типу действия, пользователю и временному диапазону."),
      ...image('06-audit.png', 600, 'Рисунок 11 — Журнал аудита системы'),

      h2("2.4 Настройка системы ролей и прав доступа"),
      p("В системе MedQuest реализована трёхуровневая ролевая модель, основанная на проверке JWT-токена на стороне сервера. Каждый запрос к защищённым эндпоинтам сопровождается валидацией токена и проверкой принадлежности пользователя к допустимой роли."),

      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [3026, 2000, 2000, 2000],
        rows: [
          headerRow(["Функциональность", "Администратор", "Регистратор", "Врач"], [3026, 2000, 2000, 2000]),
          dataRow(["Управление пользователями", "✓ Полный доступ", "✗", "✗"], [3026, 2000, 2000, 2000], false),
          dataRow(["Просмотр журнала аудита", "✓ Полный доступ", "✗", "✗"], [3026, 2000, 2000, 2000], true),
          dataRow(["Управление пациентами", "✓ Полный CRUD", "✓ Создание/просмотр", "✓ Только просмотр"], [3026, 2000, 2000, 2000], false),
          dataRow(["Управление запросами", "✓ Полный CRUD", "✓ Создание/редактирование", "✓ Свои запросы"], [3026, 2000, 2000, 2000], true),
          dataRow(["Назначение врача на запрос", "✓", "✓", "✗"], [3026, 2000, 2000, 2000], false),
          dataRow(["Просмотр статистики (Dashboard)", "✓", "✓", "✓"], [3026, 2000, 2000, 2000], true),
          dataRow(["Смена статуса запроса", "✓", "✓", "✓ (только свои)"], [3026, 2000, 2000, 2000], false),
          dataRow(["Экспорт данных в CSV", "✓", "✗", "✗"], [3026, 2000, 2000, 2000], true),
        ]
      }),

      new Paragraph({ spacing: { before: 160 }, children: [] }),
      p("На стороне frontend реализована защита маршрутов: компонент PrivateRoute проверяет наличие валидного токена и соответствие роли пользователя требованиям маршрута. При несоответствии выполняется редирект на страницу входа или страницу с сообщением об отсутствии доступа."),

      h2("2.5 Тестирование выполненных изменений"),
      p("Тестирование системы проводилось по нескольким направлениям:"),
      mixedPara([bold("Функциональное тестирование: "), run("каждый эндпоинт API проверен через интерактивную документацию Swagger UI (/docs). Тестировались корректные и граничные сценарии: попытки доступа без токена, с истёкшим токеном, с недостаточными правами.")]),
      mixedPara([bold("Тестирование ролевой модели: "), run("выполнен вход под каждой из трёх ролей и проверена корректность отображения элементов интерфейса и доступности функций.")]),
      mixedPara([bold("Тестирование пользовательских сценариев: "), run("отработаны четыре ключевых сценария: регистрация пациента, создание запроса, смена статуса врачом, просмотр аудита администратором.")]),
      mixedPara([bold("Валидация данных: "), run("проверена работа серверной валидации Pydantic — обязательные поля, форматы данных, уникальность email.")]),
      p("В результате тестирования выявлены и устранены следующие дефекты: некорректное вычисление метрики requests_closed_today при работе в часовом поясе UTC+5, ошибка отображения пагинации при фильтрации, проблема с обновлением access-токена при истечении сессии."),

      pageBreak(),

      // ══════════════════════════════════════════
      // ЖИЗНЕННЫЙ ЦИКЛ ЗАПРОСА
      // ══════════════════════════════════════════
      h1("3 ПРОЦЕСС ЖИЗНЕННОГО ЦИКЛА ЗАПРОСА"),
      p("Жизненный цикл запроса пациента в системе MedQuest включает три основных статуса и регулируется бизнес-правилами, реализованными на уровне backend."),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2500, 3026, 3500],
        rows: [
          headerRow(["Статус", "Инициатор перехода", "Условия"], [2500, 3026, 3500]),
          dataRow(["new → in_progress", "Регистратор / Администратор", "Назначение врача на запрос"], [2500, 3026, 3500], false),
          dataRow(["in_progress → closed", "Врач / Администратор", "Завершение обработки обращения"], [2500, 3026, 3500], true),
          dataRow(["closed → new", "Администратор", "Повторное открытие запроса"], [2500, 3026, 3500], false),
          dataRow(["any → any", "Администратор", "Административный переход без ограничений"], [2500, 3026, 3500], true),
        ]
      }),
      new Paragraph({ spacing: { before: 160 }, children: [] }),
      p("При каждом переходе между статусами автоматически создаётся запись в журнале аудита с указанием исполнителя, времени и описания изменения. История переходов отображается в виде хронологического таймлайна на странице детального просмотра запроса."),

      pageBreak(),

      // ══════════════════════════════════════════
      // БЕЗОПАСНОСТЬ
      // ══════════════════════════════════════════
      h1("4 БЕЗОПАСНОСТЬ"),

      h2("4.1 Реализованные механизмы защиты"),
      mixedPara([bold("JWT-аутентификация: "), run("access-токен с коротким временем жизни (15–30 минут) и refresh-токен (7–30 суток). Токены подписываются секретным ключом алгоритмом HS256.")]),
      mixedPara([bold("Хэширование паролей: "), run("использование библиотеки passlib с алгоритмом bcrypt и автоматическим добавлением соли. Пароли никогда не хранятся в открытом виде.")]),
      mixedPara([bold("Ролевой контроль доступа: "), run("декораторы зависимостей FastAPI проверяют роль при каждом запросе. Несанкционированные запросы возвращают HTTP 403 Forbidden.")]),
      mixedPara([bold("Аудит действий: "), run("все значимые операции (вход, создание, изменение, удаление записей) фиксируются в журнале с IP-адресом источника.")]),
      mixedPara([bold("Валидация входных данных: "), run("Pydantic-схемы автоматически отклоняют запросы с некорректными типами данных или нарушением ограничений.")]),
      mixedPara([bold("CORS-политика: "), run("настроена политика Cross-Origin Resource Sharing, разрешающая запросы только с доверенных источников.")]),

      pageBreak(),

      // ══════════════════════════════════════════
      // ЗАКЛЮЧЕНИЕ
      // ══════════════════════════════════════════
      h1("ЗАКЛЮЧЕНИЕ"),
      p("В ходе преддипломной практики была разработана функциональная CRM-система MedQuest для автоматизации регистратуры медицинского учреждения. Реализованный MVP охватывает полный жизненный цикл обращения пациента и обеспечивает необходимый уровень контроля доступа и прозрачности процессов."),

      h2("Достигнутые результаты"),
      bullet("Спроектирована и реализована база данных из 4 взаимосвязанных таблиц."),
      bullet("Разработан REST API (11 групп эндпоинтов) на FastAPI с JWT-аутентификацией."),
      bullet("Реализована система трёх ролей с гранулярным контролем доступа."),
      bullet("Разработан SPA-интерфейс на React + TypeScript с 6 основными страницами."),
      bullet("Внедрён полнофункциональный журнал аудита с фильтрацией и экспортом CSV."),
      bullet("Настроена система миграций Alembic для версионирования схемы БД."),

      h2("Приобретённые навыки"),
      bullet("Проектирование REST API с использованием FastAPI и SQLAlchemy ORM."),
      bullet("Реализация JWT-аутентификации с access/refresh токенами."),
      bullet("Разработка SPA-приложений на React + TypeScript."),
      bullet("Применение паттернов проектирования: Repository, Service Layer, Dependency Injection."),
      bullet("Работа с системой версионирования схемы БД через Alembic."),
      bullet("Проведение функционального тестирования API через Swagger UI."),

      h2("Возможные улучшения"),
      bullet("Переход с SQLite на PostgreSQL для production-среды."),
      bullet("Добавление системы уведомлений (WebSocket или push-уведомления)."),
      bullet("Реализация модуля комментариев к запросам для коммуникации внутри команды."),
      bullet("Внедрение автоматизированного тестирования (pytest для backend, Jest для frontend)."),
      bullet("Добавление финансового модуля для учёта услуг и платежей."),
      bullet("Контейнеризация приложения через Docker Compose для упрощения развёртывания."),

      pageBreak(),

      // ══════════════════════════════════════════
      // ТЕХНИЧЕСКИЕ ХАРАКТЕРИСТИКИ
      // ══════════════════════════════════════════
      h1("ТЕХНИЧЕСКИЕ ХАРАКТЕРИСТИКИ"),

      h2("Производительность"),
      p("Система обеспечивает время ответа API не более 200 мс для большинства операций при работе с базой данных до 10 000 записей. Асинхронная природа FastAPI позволяет эффективно обрабатывать конкурентные запросы."),

      h2("Развёртывание"),
      bullet("Операционная система: Linux (Ubuntu 20.04+) / Windows 10+."),
      bullet("Python: версия 3.9 и выше."),
      bullet("Node.js: версия 16 и выше (для сборки frontend)."),
      bullet("Минимальные требования: 1 vCPU, 512 МБ ОЗУ."),

      h2("Поддерживаемые браузеры"),
      bullet("Google Chrome 90+."),
      bullet("Mozilla Firefox 88+."),
      bullet("Microsoft Edge 90+."),
      bullet("Safari 14+."),

      pageBreak(),

      // ══════════════════════════════════════════
      // СПИСОК ИСТОЧНИКОВ
      // ══════════════════════════════════════════
      h1("СПИСОК ИСПОЛЬЗОВАННЫХ ИСТОЧНИКОВ"),
      numbered("FastAPI Documentation. — URL: https://fastapi.tiangolo.com/ (дата обращения: 01.11.2024)."),
      numbered("SQLAlchemy Documentation. — URL: https://docs.sqlalchemy.org/ (дата обращения: 01.11.2024)."),
      numbered("React Documentation. — URL: https://react.dev/ (дата обращения: 05.11.2024)."),
      numbered("Pydantic Documentation. — URL: https://docs.pydantic.dev/ (дата обращения: 05.11.2024)."),
      numbered("Alembic Documentation. — URL: https://alembic.sqlalchemy.org/ (дата обращения: 10.11.2024)."),
      numbered("JSON Web Tokens (JWT) — RFC 7519. — URL: https://datatracker.ietf.org/doc/html/rfc7519 (дата обращения: 10.11.2024)."),
      numbered("TypeScript Handbook. — URL: https://www.typescriptlang.org/docs/ (дата обращения: 12.11.2024)."),
      numbered("React Router Documentation. — URL: https://reactrouter.com/ (дата обращения: 12.11.2024)."),
      numbered("Axios Documentation. — URL: https://axios-http.com/docs/intro (дата обращения: 15.11.2024)."),
      numbered("OWASP REST Security Cheat Sheet. — URL: https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html (дата обращения: 15.11.2024)."),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  const outputPath = path.join(__dirname, "MedQuest_Prediplomny_Otchet.docx");
  fs.writeFileSync(outputPath, buffer);
  console.log("✓ Отчет успешно создан: " + outputPath);
});