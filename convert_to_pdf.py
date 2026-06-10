import os
import re
import sys
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def md_to_reportlab_html(text):
    # Escape HTML special chars
    text = text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    
    # Bold Italic: ***text*** -> <b><i>text</i></b>
    text = re.compile(r'\*\*\*(.*?)\*\*\*').sub(r'<b><i>\1</i></b>', text)
    # Bold: **text** -> <b>text</b>
    text = re.compile(r'\*\*([^\*]+?)\*\*').sub(r'<b>\1</b>', text)
    # Italic: *text* -> <i>text</i>
    text = re.compile(r'\*([^\*]+?)\*').sub(r'<i>\1</i>', text)
    # Inline code: `code` -> <font face="Courier" color="#991B1B">code</font>
    text = re.compile(r'`([^`]+?)`').sub(r'<font face="Courier" color="#B91C1C"><b>\1</b></font>', text)
    
    return text

def format_code_block(code_text):
    # Escape HTML special chars
    escaped = code_text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    # Replace spaces with non-breaking spaces
    escaped = escaped.replace(' ', '&nbsp;')
    # Replace tabs with 4 non-breaking spaces
    escaped = escaped.replace('\t', '&nbsp;&nbsp;&nbsp;&nbsp;')
    # Replace newlines with <br/>
    escaped = escaped.replace('\n', '<br/>')
    return escaped

def add_footer(canvas, doc):
    if doc.page == 1:
        # Suppress footer on cover page
        return
    canvas.saveState()
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(colors.HexColor('#64748B'))
    
    # Draw line above footer
    canvas.setStrokeColor(colors.HexColor('#E2E8F0'))
    canvas.setLineWidth(0.5)
    canvas.line(54, 45, doc.pagesize[0] - 54, 45)
    
    # Text on left, page number on right
    canvas.drawString(54, 30, "Virtual Chemistry Laboratory — Web Technology Report")
    canvas.drawRightString(doc.pagesize[0] - 54, 30, f"Page {doc.page}")
    canvas.restoreState()

def process_table_lines(table_lines, body_style, header_style):
    rows_data = []
    for line in table_lines:
        line = line.strip()
        if not line:
            continue
        if re.match(r'^\|[\s\-\:\|]+$', line):
            continue
        parts = line.split('|')
        if parts[0] == '':
            parts = parts[1:]
        if parts and parts[-1] == '':
            parts = parts[:-1]
        
        cells = [c.strip() for c in parts]
        rows_data.append(cells)
        
    if not rows_data:
        return None
        
    num_cols = max(len(row) for row in rows_data)
    for row in rows_data:
        while len(row) < num_cols:
            row.append('')
            
    # Convert all cell texts to Paragraph objects so they wrap nicely
    formatted_rows = []
    for row_idx, row in enumerate(rows_data):
        formatted_row = []
        for col_idx, text in enumerate(row):
            html_text = md_to_reportlab_html(text)
            if row_idx == 0:
                p = Paragraph(html_text, header_style)
            else:
                p = Paragraph(html_text, body_style)
            formatted_row.append(p)
        formatted_rows.append(formatted_row)
        
    # Table layout
    # Width of page printable area = 612 (width of letter) - 108 (margins) = 504
    col_width = 504.0 / num_cols
    col_widths = [col_width] * num_cols
    
    # Adjust widths for specific tables if necessary
    t = Table(formatted_rows, colWidths=col_widths)
    
    t_style = [
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E3A8A')),  # Navy header
    ]
    
    # Zebra striping for subsequent rows
    for r_idx in range(1, len(formatted_rows)):
        if r_idx % 2 == 1:
            t_style.append(('BACKGROUND', (0, r_idx), (-1, r_idx), colors.HexColor('#F8FAFC')))
            
    t.setStyle(TableStyle(t_style))
    return t

def main():
    pdf_path = "Web_Technology_Report.pdf"
    md_path = "Web_Technology_Report.md"
    
    # Setup document
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        rightMargin=54, # 0.75 in
        leftMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    
    styles = getSampleStyleSheet()
    
    # Styled paragraph parameters
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=26,
        leading=32,
        textColor=colors.HexColor('#1E3A8A'),
        alignment=1, # Center
        spaceAfter=15
    )
    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=18,
        textColor=colors.HexColor('#0F766E'),
        alignment=1, # Center
        spaceAfter=25
    )
    h2_style = ParagraphStyle(
        'Heading2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=colors.HexColor('#1E3A8A'),
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )
    h3_style = ParagraphStyle(
        'Heading3',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#0F766E'),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )
    h4_style = ParagraphStyle(
        'Heading4',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#334155'),
        spaceBefore=8,
        spaceAfter=3,
        keepWithNext=True
    )
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#334155'),
        spaceAfter=7
    )
    bullet_style = ParagraphStyle(
        'Bullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#334155'),
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=3
    )
    
    # Table text styles
    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.white
    )
    table_body_style = ParagraphStyle(
        'TableBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor('#334155')
    )
    
    # Code block styles
    code_body_style = ParagraphStyle(
        'CodeBody',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#1E293B')
    )

    story = []
    
    # Read Markdown
    with open(md_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
        
    state = "normal"
    buffer = []
    is_cover = True
    
    def flush_text_buffer(buf):
        if not buf:
            return
        text = " ".join([line.strip() for line in buf])
        if text:
            html_text = md_to_reportlab_html(text)
            p = Paragraph(html_text, body_style)
            story.append(p)
        buf.clear()
        
    for line in lines:
        line_stripped = line.strip()
        
        # 1. State: Code block
        if state == "code_block":
            if line_stripped.startswith("```"):
                # Render code block
                code_text = "".join(buffer).rstrip()
                formatted = format_code_block(code_text)
                p = Paragraph(formatted, code_body_style)
                
                # Single cell table for borders and background
                code_table = Table([[p]], colWidths=[504.0])
                code_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
                    ('TOPPADDING', (0, 0), (-1, -1), 8),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                    ('LEFTPADDING', (0, 0), (-1, -1), 10),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 10),
                ]))
                story.append(code_table)
                story.append(Spacer(1, 6))
                
                buffer.clear()
                state = "normal"
            else:
                buffer.append(line)
            continue
            
        # 2. State: Table
        if state == "table":
            if line_stripped.startswith("|"):
                buffer.append(line)
            else:
                table_element = process_table_lines(buffer, table_body_style, table_header_style)
                if table_element:
                    story.append(table_element)
                buffer.clear()
                state = "normal"
                # Fall through to standard processing
            if state != "normal":
                continue
                
        # 3. State: Normal
        if line_stripped.startswith("```"):
            flush_text_buffer(buffer)
            state = "code_block"
            continue
            
        if line_stripped.startswith("|"):
            flush_text_buffer(buffer)
            state = "table"
            buffer.append(line)
            continue
            
        # Heading 1
        if line_stripped.startswith("# "):
            flush_text_buffer(buffer)
            heading_text = line_stripped[2:]
            if is_cover:
                story.append(Spacer(1, 80))
                story.append(Paragraph(heading_text, title_style))
            else:
                p = Paragraph(heading_text, ParagraphStyle('H1', parent=h2_style, fontSize=18, leading=22, spaceBefore=20))
                story.append(p)
            continue
            
        # Heading 2
        if line_stripped.startswith("## "):
            flush_text_buffer(buffer)
            heading_text = line_stripped[3:]
            if is_cover:
                story.append(Paragraph(heading_text, subtitle_style))
            else:
                story.append(Paragraph(heading_text, h2_style))
            continue
            
        # Heading 3
        if line_stripped.startswith("### "):
            flush_text_buffer(buffer)
            heading_text = line_stripped[4:]
            story.append(Paragraph(heading_text, h3_style))
            continue
            
        # Heading 4
        if line_stripped.startswith("#### "):
            flush_text_buffer(buffer)
            heading_text = line_stripped[5:]
            story.append(Paragraph(heading_text, h4_style))
            continue
            
        # Page breaks
        if "page-break-after: always;" in line_stripped or "<div style=\"page-break-after: always;\">" in line_stripped:
            flush_text_buffer(buffer)
            story.append(PageBreak())
            is_cover = False
            continue
            
        # Horizontal rule
        if line_stripped == "---":
            flush_text_buffer(buffer)
            # Add line
            line_table = Table([['']], colWidths=[504.0], rowHeights=[1])
            line_table.setStyle(TableStyle([
                ('LINEBELOW', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
                ('TOPPADDING', (0, 0), (-1, -1), 0),
            ]))
            story.append(Spacer(1, 5))
            story.append(line_table)
            story.append(Spacer(1, 5))
            continue
            
        # Lists
        if line_stripped.startswith("- ") or line_stripped.startswith("* "):
            flush_text_buffer(buffer)
            cleaned = re.sub(r'^[\-\*]\s+', '', line_stripped)
            html_text = f"&bull; {md_to_reportlab_html(cleaned)}"
            story.append(Paragraph(html_text, bullet_style))
            continue
            
        if re.match(r'^\d+\.\s+', line_stripped):
            flush_text_buffer(buffer)
            cleaned = re.sub(r'^\d+\.\s+', '', line_stripped)
            num = re.match(r'^(\d+)\.', line_stripped).group(1)
            html_text = f"{num}. {md_to_reportlab_html(cleaned)}"
            story.append(Paragraph(html_text, bullet_style))
            continue
            
        # Blank line
        if not line_stripped:
            flush_text_buffer(buffer)
            continue
            
        buffer.append(line)
        
    # Final cleanup
    if state == "code_block":
        code_text = "".join(buffer).rstrip()
        formatted = format_code_block(code_text)
        story.append(Paragraph(formatted, code_body_style))
    elif state == "table":
        table_element = process_table_lines(buffer, table_body_style, table_header_style)
        if table_element:
            story.append(table_element)
    else:
        flush_text_buffer(buffer)
        
    # Build Document
    doc.build(story, onFirstPage=lambda c, d: None, onLaterPages=add_footer)
    print("PDF generation complete!")

if __name__ == "__main__":
    main()
