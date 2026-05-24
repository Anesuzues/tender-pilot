"""Dependency-free generator of a minimal, valid text PDF for tests.

Builds a single- or multi-page PDF with real, extractable text content using
Helvetica and correctly computed cross-reference offsets, so pypdf can read it
back. Avoids pulling reportlab into the test deps.
"""
from __future__ import annotations


def _escape(text: str) -> str:
    return text.replace("\\", r"\\").replace("(", r"\(").replace(")", r"\)")


def _content_stream(lines: list[str]) -> bytes:
    ops = ["BT", "/F1 11 Tf", "72 760 Td", "13 TL"]
    for i, line in enumerate(lines):
        if i == 0:
            ops.append(f"({_escape(line)}) Tj")
        else:
            ops.append("T*")
            ops.append(f"({_escape(line)}) Tj")
    ops.append("ET")
    return ("\n".join(ops)).encode("latin-1", errors="replace")


def make_pdf(text: str, lines_per_page: int = 45) -> bytes:
    """Return PDF bytes containing ``text`` (split across pages by line count)."""
    all_lines = text.split("\n")
    pages = [
        all_lines[i : i + lines_per_page]
        for i in range(0, max(len(all_lines), 1), lines_per_page)
    ] or [[""]]

    objects: list[bytes] = []

    # Object numbering:
    # 1 = Catalog, 2 = Pages, 3 = Font,
    # then per page: a Page object and a Contents object.
    n_pages = len(pages)
    page_obj_nums = [4 + 2 * i for i in range(n_pages)]
    content_obj_nums = [5 + 2 * i for i in range(n_pages)]

    objects.append(b"<< /Type /Catalog /Pages 2 0 R >>")  # 1
    kids = " ".join(f"{p} 0 R" for p in page_obj_nums)
    objects.append(
        f"<< /Type /Pages /Kids [{kids}] /Count {n_pages} >>".encode()
    )  # 2
    objects.append(
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
    )  # 3

    for i, page_lines in enumerate(pages):
        page_dict = (
            f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
            f"/Resources << /Font << /F1 3 0 R >> >> "
            f"/Contents {content_obj_nums[i]} 0 R >>"
        ).encode()
        objects.append((page_obj_nums[i], page_dict))  # type: ignore
        stream = _content_stream(page_lines)
        content = (
            f"<< /Length {len(stream)} >>\nstream\n".encode()
            + stream
            + b"\nendstream"
        )
        objects.append((content_obj_nums[i], content))  # type: ignore

    # Normalize to (objnum, body) pairs in object-number order.
    fixed: dict[int, bytes] = {1: objects[0], 2: objects[1], 3: objects[2]}
    for item in objects[3:]:
        num, body = item  # type: ignore
        fixed[num] = body

    out = bytearray(b"%PDF-1.4\n")
    offsets: dict[int, int] = {}
    for num in sorted(fixed):
        offsets[num] = len(out)
        out += f"{num} 0 obj\n".encode() + fixed[num] + b"\nendobj\n"

    xref_pos = len(out)
    total = max(fixed) + 1
    out += f"xref\n0 {total}\n".encode()
    out += b"0000000000 65535 f \n"
    for num in range(1, total):
        out += f"{offsets[num]:010d} 00000 n \n".encode()
    out += (
        f"trailer\n<< /Size {total} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF".encode()
    )
    return bytes(out)
