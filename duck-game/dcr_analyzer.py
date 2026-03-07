#!/usr/bin/env python3
"""
DCR (Shockwave Director) 파일 정적 분석기
XFIR/RIFX 포맷 파싱
"""
import struct
import zlib
import sys
import os

def read_tag(data, offset, little_endian=True):
    """Read a 4-byte tag"""
    tag = data[offset:offset+4]
    if not little_endian:
        tag = tag[::-1]
    return tag.decode('ascii', errors='replace'), offset + 4

def read_uint32(data, offset, little_endian=True):
    fmt = '<I' if little_endian else '>I'
    val = struct.unpack_from(fmt, data, offset)[0]
    return val, offset + 4

def read_uint16(data, offset, little_endian=True):
    fmt = '<H' if little_endian else '>H'
    val = struct.unpack_from(fmt, data, offset)[0]
    return val, offset + 2

def analyze_dcr(filepath):
    with open(filepath, 'rb') as f:
        data = f.read()

    print(f"=== DCR 파일 분석: {os.path.basename(filepath)} ===")
    print(f"파일 크기: {len(data):,} bytes ({len(data)/1024:.1f} KB)")
    print()

    # Check header
    header = data[0:4]
    header_str = header.decode('ascii', errors='replace')

    if header_str == 'XFIR':
        little_endian = True
        print(f"포맷: XFIR (Little-Endian Director)")
    elif header_str == 'RIFX':
        little_endian = False
        print(f"포맷: RIFX (Big-Endian Director)")
    else:
        print(f"알 수 없는 헤더: {header.hex()} ({header_str})")
        return

    # File size
    file_size, _ = read_uint32(data, 4, little_endian)
    print(f"선언된 파일 크기: {file_size:,} bytes")

    # File type (MDGF = Director Movie, FGDM = same big endian)
    file_type = data[8:12].decode('ascii', errors='replace')
    print(f"파일 타입: {file_type}")

    # Parse version info from early bytes
    print()
    print("=== 버전 정보 ===")
    # Look for version string
    for i in range(12, min(100, len(data))):
        if data[i:i+2] in [b'8.', b'9.', b'10', b'11', b'12']:
            try:
                ver = data[i:i+10].decode('ascii', errors='replace')
                ver_clean = ''.join(c for c in ver if c.isdigit() or c == '.')
                if ver_clean:
                    print(f"  Director 버전: {ver_clean}")
                    break
            except:
                pass

    # Parse chunks
    print()
    print("=== 청크 분석 ===")
    offset = 12
    chunks = []
    chunk_types = {}

    while offset < len(data) - 8:
        try:
            tag_bytes = data[offset:offset+4]
            if len(tag_bytes) < 4:
                break

            if little_endian:
                tag = tag_bytes.decode('ascii', errors='replace')
            else:
                tag = tag_bytes[::-1].decode('ascii', errors='replace')

            chunk_size, _ = read_uint32(data, offset + 4, little_endian)

            # Sanity check
            if chunk_size > len(data) - offset:
                # Try to decompress if this looks like compressed data
                break

            chunk_data = data[offset+8:offset+8+chunk_size]
            chunks.append({
                'tag': tag,
                'offset': offset,
                'size': chunk_size,
                'data': chunk_data
            })

            if tag not in chunk_types:
                chunk_types[tag] = 0
            chunk_types[tag] += 1

            # Align to even boundary
            offset += 8 + chunk_size
            if offset % 2 == 1:
                offset += 1

        except Exception as e:
            print(f"  청크 파싱 오류 at offset {offset}: {e}")
            break

    print(f"  발견된 청크 수: {len(chunks)}")
    print()
    print("  청크 타입별 개수:")
    for tag, count in sorted(chunk_types.items(), key=lambda x: -x[1]):
        desc = get_chunk_description(tag)
        print(f"    {tag:8s} x{count:3d}  {desc}")

    print()
    print("=== 청크 상세 목록 (처음 50개) ===")
    for i, chunk in enumerate(chunks[:50]):
        desc = get_chunk_description(chunk['tag'])
        preview = ""
        # Try to get readable content
        try:
            text = chunk['data'][:60].decode('ascii', errors='replace')
            text = ''.join(c if c.isprintable() else '.' for c in text)
            preview = f" | {text}"
        except:
            pass
        print(f"  [{i:3d}] {chunk['tag']:8s} offset=0x{chunk['offset']:08X} size={chunk['size']:>8,}{preview}")

    # Try to find and extract Lingo scripts
    print()
    print("=== 스크립트/텍스트 추출 ===")
    extract_strings(data, chunks)

    # Try to decompress compressed sections
    print()
    print("=== 압축 데이터 분석 ===")
    find_compressed_data(data)

    return chunks

def get_chunk_description(tag):
    descriptions = {
        'imap': 'Initial Map (초기 맵)',
        'mmap': 'Memory Map (메모리 맵)',
        'KEY*': 'Key Table (키 테이블)',
        'CAS*': 'Cast Association (캐스트 연결)',
        'CASt': 'Cast Member (캐스트 멤버)',
        'Lscr': 'Lingo Script (린고 스크립트)',
        'Lnam': 'Lingo Names (린고 이름)',
        'Lctx': 'Lingo Context (린고 컨텍스트)',
        'VWSC': 'Score (스코어)',
        'VWCF': 'Config (설정)',
        'VWFI': 'File Info (파일 정보)',
        'VWLB': 'Labels (라벨)',
        'DRCF': 'Director Config',
        'STXT': 'Styled Text (스타일 텍스트)',
        'BITD': 'Bitmap Data (비트맵)',
        'ALFA': 'Alpha Channel (알파)',
        'snd ': 'Sound (사운드)',
        'cusr': 'Cursor (커서)',
        'Thum': 'Thumbnail (썸네일)',
        'ediM': 'Media Edit Info',
        'SCRF': 'Score Reference',
        'Sord': 'Sort Order',
        'Fmap': 'Font Map',
        'CLUT': 'Color Lookup Table',
        'MCsL': 'Movie Cast List',
        'FXmp': 'FX Map',
        'revF': 'File Version',
        'rdcF': 'DCR Config',
    }
    return descriptions.get(tag, '')

def extract_strings(data, chunks):
    """Extract readable strings from the file"""
    # Look for text chunks
    text_found = 0
    for chunk in chunks:
        if chunk['tag'] in ['STXT', 'Lscr', 'Lnam', 'STR ']:
            try:
                # Try to find readable text in chunk data
                text = extract_readable_text(chunk['data'])
                if text and len(text) > 5:
                    print(f"  [{chunk['tag']}] offset=0x{chunk['offset']:08X}:")
                    for line in text[:5]:
                        print(f"    {line}")
                    text_found += 1
            except:
                pass

    if text_found == 0:
        # Fall back to scanning entire binary for Korean/ASCII strings
        print("  청크에서 텍스트를 찾지 못함. 전체 바이너리 스캔 중...")
        scan_for_strings(data)

def extract_readable_text(data):
    """Extract readable ASCII/UTF-8 strings from binary data"""
    strings = []
    current = []
    for byte in data:
        if 32 <= byte < 127:
            current.append(chr(byte))
        else:
            if len(current) >= 4:
                strings.append(''.join(current))
            current = []
    if len(current) >= 4:
        strings.append(''.join(current))
    return strings

def scan_for_strings(data):
    """Scan binary data for meaningful strings"""
    strings = []
    current = []
    start = 0

    for i, byte in enumerate(data):
        if 32 <= byte < 127:
            if not current:
                start = i
            current.append(chr(byte))
        else:
            if len(current) >= 6:
                s = ''.join(current)
                # Filter out garbage
                if any(c.isalpha() for c in s):
                    strings.append((start, s))
            current = []

    # Also try EUC-KR / CP949 decoding for Korean
    korean_strings = find_korean_strings(data)

    # Print interesting strings
    keywords = ['duck', 'farm', 'egg', 'feed', 'shop', 'money', 'score',
                'game', 'start', 'click', 'button', 'menu', 'level',
                'buy', 'sell', 'item', 'play', 'sound', 'music',
                'sprite', 'cast', 'member', 'script', 'handler',
                'on ', 'end ', 'if ', 'then', 'set ', 'put ',
                'mouseDown', 'mouseUp', 'enterFrame', 'exitFrame',
                'go to', 'global', 'property', 'new', 'repeat']

    print(f"  발견된 ASCII 문자열: {len(strings)}개")
    interesting = []
    for offset, s in strings:
        s_lower = s.lower()
        if any(kw in s_lower for kw in keywords) or len(s) > 20:
            interesting.append((offset, s))

    print(f"  게임 관련 문자열: {len(interesting)}개")
    for offset, s in interesting[:50]:
        print(f"    0x{offset:08X}: {s[:100]}")

    if korean_strings:
        print(f"\n  한국어 문자열: {len(korean_strings)}개")
        for offset, s in korean_strings[:30]:
            print(f"    0x{offset:08X}: {s[:100]}")

def find_korean_strings(data):
    """Find Korean (EUC-KR/CP949) strings in binary data"""
    korean_strings = []
    i = 0
    while i < len(data) - 1:
        # EUC-KR range: first byte 0xA1-0xFE, second byte 0xA1-0xFE
        # CP949 extended: first byte 0x81-0xFE
        if 0x81 <= data[i] <= 0xFE and 0x41 <= data[i+1] <= 0xFE:
            start = i
            korean_bytes = bytearray()
            while i < len(data) - 1:
                if 0x81 <= data[i] <= 0xFE and 0x41 <= data[i+1] <= 0xFE:
                    korean_bytes.extend(data[i:i+2])
                    i += 2
                elif 32 <= data[i] < 127:
                    korean_bytes.append(data[i])
                    i += 1
                else:
                    break

            if len(korean_bytes) >= 4:
                try:
                    decoded = korean_bytes.decode('cp949', errors='ignore')
                    if len(decoded) >= 2:
                        korean_strings.append((start, decoded))
                except:
                    pass
        else:
            i += 1

    return korean_strings

def find_compressed_data(data):
    """Find and try to decompress zlib-compressed sections"""
    # Look for zlib headers (0x78 0x9C, 0x78 0xDA, 0x78 0x01)
    zlib_headers = []
    for i in range(len(data) - 2):
        if data[i] == 0x78 and data[i+1] in (0x9C, 0xDA, 0x01, 0x5E):
            zlib_headers.append(i)

    print(f"  zlib 압축 헤더 발견: {len(zlib_headers)}개")

    decompressed_total = 0
    all_decompressed = bytearray()

    for idx, pos in enumerate(zlib_headers[:20]):
        try:
            # Try to decompress
            decompressed = zlib.decompress(data[pos:pos+min(len(data)-pos, 500000)])
            size = len(decompressed)
            decompressed_total += size
            all_decompressed.extend(decompressed)

            # Preview
            preview = decompressed[:80]
            text = preview.decode('ascii', errors='replace')
            text = ''.join(c if c.isprintable() else '.' for c in text)
            print(f"  [{idx}] offset=0x{pos:08X}: 압축해제 {size:,} bytes | {text}")
        except Exception as e:
            pass

    print(f"\n  총 압축해제 데이터: {decompressed_total:,} bytes")

    # Save decompressed data for further analysis
    if all_decompressed:
        outpath = os.path.splitext(filepath)[0] + '_decompressed.bin'
        with open(outpath, 'wb') as f:
            f.write(all_decompressed)
        print(f"  압축해제 데이터 저장: {outpath}")

        # Scan decompressed data for strings
        print("\n=== 압축해제 데이터 내 문자열 ===")
        scan_for_strings(bytes(all_decompressed))

if __name__ == '__main__':
    filepath = sys.argv[1] if len(sys.argv) > 1 else '/Users/yangsoyeon/temp/duck_farm.dcr'
    analyze_dcr(filepath)
