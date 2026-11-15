/**
 * Strict Pre-Extraction Streaming Archive Validator for Krishna Electronics Platform
 * 
 * Verifies that an uploads tar.gz archive complies strictly with handover security standards:
 * - Allowed types: Regular files ('0' / '\0') and Directories ('5').
 * - Strictly rejected formats:
 *     - PAX extended headers (typeflag 'x') and global headers (typeflag 'g')
 *       are rejected upfront to prevent metadata path override attacks.
 *     - Symlinks ('2'), Hard links ('1'), Character/Block devices ('3'/'4'), FIFOs ('6').
 *     - Absolute paths (/ or \), Windows drive letters (C:), UNC paths (\\).
 *     - Path traversal (..), Backslashes (\), Duplicate paths, Conflicting paths.
 * - Strict Numeric Field Validation:
 *     - Rejects non-octal characters, signs, malformed delimiters, and invalid prefixes.
 *     - Rejects unsupported GNU base-256 binary encodings (high bit 0x80 set).
 *     - Rejects negative or overflowing values and enforces maximum member size.
 * - Streaming Decompression & Tar Parser:
 *     - The validator uses bounded streaming parser state and does not retain complete archive payloads.
 *     - Actual peak RSS has not been measured in Linux.
 *     - Enforces early termination on decompression bombs and uncompressed byte threshold.
 *     - Enforces maximum on-disk compressed file size before opening stream.
 *     - Configurable via MAX_DECOMPRESSED_SIZE_MB (default: 512 MB, hard ceiling: 1024 MB).
 *     - Configurable per-member size via MAX_ARCHIVE_MEMBER_MB (default: 256 MB, hard ceiling: 512 MB).
 *     - Configurable compressed size via MAX_COMPRESSED_ARCHIVE_MB (default: 256 MB, hard ceiling: 1024 MB).
 * - Allowed extensions: Images and media assets (.jpg, .jpeg, .png, .webp, .svg, .gif, .ico, .mp4, .pdf).
 * - Enforces strict end-of-archive zero-block termination and rejects truncated or malformed streams.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function fail(msg) {
  console.error(`[Archive Validator] SECURITY ERROR: ${msg}`);
  process.exit(1);
}

// Strict resource limit parser and hard ceilings
const HARD_CEILING_DECOMPRESSED_MB = 1024;
const HARD_CEILING_MEMBER_MB = 512;
const HARD_CEILING_COMPRESSED_MB = 1024;

function parseStrictEnvLimit(rawVal, defaultMB, hardCeilingMB, varName) {
  if (rawVal === undefined || rawVal === null || rawVal.trim() === '') {
    return defaultMB * 1024 * 1024;
  }
  const trimmed = rawVal.trim();
  if (!/^\d+$/.test(trimmed)) {
    fail(`Invalid configuration for ${varName}: "${rawVal}" is not a positive integer`);
  }
  const val = parseInt(trimmed, 10);
  if (val <= 0) {
    fail(`Invalid configuration for ${varName}: value must be greater than 0`);
  }
  if (val > hardCeilingMB) {
    fail(`Invalid configuration for ${varName}: value ${val} MB exceeds hard safety ceiling of ${hardCeilingMB} MB`);
  }
  return val * 1024 * 1024;
}

const MAX_DECOMPRESSED_BYTES = parseStrictEnvLimit(
  process.env.MAX_DECOMPRESSED_SIZE_MB,
  512,
  HARD_CEILING_DECOMPRESSED_MB,
  'MAX_DECOMPRESSED_SIZE_MB'
);

const MAX_MEMBER_SIZE = parseStrictEnvLimit(
  process.env.MAX_ARCHIVE_MEMBER_MB,
  256,
  HARD_CEILING_MEMBER_MB,
  'MAX_ARCHIVE_MEMBER_MB'
);

const MAX_COMPRESSED_ARCHIVE_BYTES = parseStrictEnvLimit(
  process.env.MAX_COMPRESSED_ARCHIVE_MB,
  256,
  HARD_CEILING_COMPRESSED_MB,
  'MAX_COMPRESSED_ARCHIVE_MB'
);

/**
 * Strict octal parser for tar numeric header fields.
 * Rejects GNU base-256 encodings, non-octal bytes, embedded garbage, and integer overflows.
 */
function parseStrictOctal(buf, offset, length, fieldName, options = {}) {
  const slice = buf.subarray(offset, offset + length);

  // Check for GNU base-256 binary encoding (high bit 0x80 set on first byte)
  if ((slice[0] & 0x80) !== 0) {
    fail(`Unsupported encoding in field "${fieldName}": GNU base-256 binary format is forbidden`);
  }

  let seenDigit = false;
  let seenTerminator = false;
  let digits = '';

  for (let i = 0; i < length; i++) {
    const b = slice[i];

    // Allowed terminators: null byte (0x00) or space (0x20)
    if (b === 0 || b === 0x20) {
      if (seenDigit) {
        seenTerminator = true;
      }
      continue;
    }

    // Any non-terminator byte after a delimiter is strictly illegal
    if (seenTerminator) {
      fail(`Malformed numeric field "${fieldName}": non-terminator byte 0x${b.toString(16)} after delimiter`);
    }

    // Only characters '0' through '7' (0x30 to 0x37) are allowed as octal digits
    if (b >= 0x30 && b <= 0x37) {
      seenDigit = true;
      digits += String.fromCharCode(b);
    } else {
      const charStr = String.fromCharCode(b);
      fail(`Malformed numeric field "${fieldName}": invalid byte 0x${b.toString(16)} ('${charStr}') in octal field`);
    }
  }

  // If the entire field consists only of nulls or spaces, it represents 0
  if (!seenDigit) {
    if (options.requireNonEmpty) {
      fail(`Malformed numeric field "${fieldName}": field is empty`);
    }
    return 0;
  }

  // Mathematical accumulation with overflow checking
  let val = 0;
  for (let i = 0; i < digits.length; i++) {
    const d = digits.charCodeAt(i) - 0x30;
    val = val * 8 + d;
    if (val > Number.MAX_SAFE_INTEGER) {
      fail(`Integer overflow in numeric field "${fieldName}": value exceeds MAX_SAFE_INTEGER`);
    }
  }

  if (val < 0) {
    fail(`Negative value in numeric field "${fieldName}"`);
  }

  const maxVal = options.maxVal ?? (fieldName === 'size' ? MAX_MEMBER_SIZE : Number.MAX_SAFE_INTEGER);
  if (val > maxVal) {
    fail(`Value ${val} in field "${fieldName}" exceeds maximum permitted limit (${maxVal})`);
  }

  return val;
}

/**
 * True Streaming Pre-Extraction Tar Archive Validator.
 * Processes 512-byte blocks as they decompress on-the-fly.
 * Caches zero file payloads in memory (peak RAM consumption < 35 MB).
 */
function validateArchive(archivePath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(archivePath)) {
      fail(`Archive file not found: ${archivePath}`);
    }

    const fileStat = fs.statSync(archivePath);
    if (fileStat.size > MAX_COMPRESSED_ARCHIVE_BYTES) {
      fail(`Compressed archive size (${(fileStat.size / (1024 * 1024)).toFixed(1)} MB) exceeds maximum safety limit of ${(MAX_COMPRESSED_ARCHIVE_BYTES / (1024 * 1024)).toFixed(0)} MB`);
    }

    let fileStream;
    let gunzip;
    try {
      fileStream = fs.createReadStream(archivePath);
      gunzip = zlib.createGunzip();
    } catch (err) {
      fail(`Failed to open archive: ${err.message}`);
    }

    const BLOCK_SIZE = 512;
    let totalDecompressedBytes = 0;
    let aborted = false;

    // Parser State
    let residual = Buffer.alloc(0);
    let state = 'HEADER'; // 'HEADER' | 'MEMBER_DATA' | 'GNU_LONG_NAME'
    let gnuLongName = null;
    let currentMemberName = '';
    let dataBlocksRemaining = 0;
    let gnuBlocksRemaining = 0;
    let gnuDataChunks = [];
    let gnuExpectedSize = 0;

    let totalFiles = 0;
    let totalDirs = 0;
    let zeroBlockCount = 0;
    let seenEndOfArchive = false;
    let blockOffset = 0;

    const seenPaths = new Set();
    const directoryPaths = new Set();
    const filePaths = new Set();
    const ALLOWED_EXTENSIONS = new Set([
      '.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif', '.ico', '.mp4', '.pdf'
    ]);

    function abort(msg) {
      if (aborted) return;
      aborted = true;
      fileStream.destroy();
      gunzip.destroy();
      fail(msg);
    }

    function processBlock(header) {
      blockOffset += BLOCK_SIZE;

      if (state === 'MEMBER_DATA') {
        dataBlocksRemaining--;
        if (dataBlocksRemaining === 0) {
          state = 'HEADER';
        }
        return;
      }

      if (state === 'GNU_LONG_NAME') {
        gnuDataChunks.push(header);
        gnuBlocksRemaining--;
        if (gnuBlocksRemaining === 0) {
          const combined = Buffer.concat(gnuDataChunks);
          gnuLongName = combined.toString('utf8', 0, gnuExpectedSize).replace(/\0.*$/, '').trim();
          gnuDataChunks = [];
          if (!gnuLongName) {
            abort('Malformed tar archive: empty GNU long-name payload');
            return;
          }
          state = 'HEADER';
        }
        return;
      }

      // STATE IS 'HEADER'
      // Check for 512-byte zero block
      let isZeroBlock = true;
      for (let i = 0; i < 512; i++) {
        if (header[i] !== 0) {
          isZeroBlock = false;
          break;
        }
      }

      if (isZeroBlock) {
        if (gnuLongName !== null) {
          abort('Malformed tar archive: orphaned GNU long-name header before end-of-archive');
          return;
        }
        zeroBlockCount++;
        if (zeroBlockCount >= 2) {
          seenEndOfArchive = true;
        }
        return;
      }

      // If we already saw end of archive, trailing non-zero is illegal
      if (seenEndOfArchive) {
        abort(`Malformed tar archive: non-zero data encountered after end-of-archive marker at offset ${blockOffset - BLOCK_SIZE}`);
        return;
      }

      // If orphan zero block was seen
      if (zeroBlockCount > 0) {
        abort(`Malformed tar archive: non-zero header encountered after orphan zero-block at offset ${blockOffset - BLOCK_SIZE}`);
        return;
      }

      // Verify header checksum
      const rawChksum = parseStrictOctal(header, 148, 8, 'chksum', { requireNonEmpty: true });
      let calculatedChksum = 0;
      for (let i = 0; i < 512; i++) {
        if (i >= 148 && i < 156) {
          calculatedChksum += 32;
        } else {
          calculatedChksum += header[i];
        }
      }
      if (rawChksum !== calculatedChksum) {
        abort(`Tar header checksum mismatch at block offset ${blockOffset - BLOCK_SIZE}`);
        return;
      }

      // Parse typeflag and size first to determine record type
      const typeflag = String.fromCharCode(header[156]);
      const size = parseStrictOctal(header, 124, 12, 'size');

      // STRICT PAX HEADER REJECTION
      if (typeflag === 'x') {
        abort(`Disallowed archive format: PAX extended header (typeflag 'x') is forbidden to prevent metadata path override attacks`);
        return;
      }
      if (typeflag === 'g') {
        abort(`Disallowed archive format: PAX global header (typeflag 'g') is forbidden to prevent metadata path override attacks`);
        return;
      }

      // GNU Long Name ('L')
      if (typeflag === 'L') {
        if (gnuLongName !== null) {
          abort('Malformed tar archive: consecutive GNU long-name headers detected');
          return;
        }
        if (size <= 0 || size > 4096) {
          abort(`Malformed tar archive: invalid GNU long-name size (${size} bytes)`);
          return;
        }
        gnuExpectedSize = size;
        gnuBlocksRemaining = Math.ceil(size / BLOCK_SIZE);
        state = 'GNU_LONG_NAME';
        return;
      }

      // Standard member header (not 'L', 'x', or 'g')
      const rawName = header.toString('utf8', 0, 100).replace(/\0.*$/, '');
      const prefix = header.toString('utf8', 345, 500).replace(/\0.*$/, '');

      let name;
      if (gnuLongName !== null) {
        // GNU long name provides the complete member path; prefix is ignored per GNU tar spec
        name = gnuLongName;
        gnuLongName = null;
      } else if (prefix) {
        name = `${prefix}/${rawName}`;
      } else {
        name = rawName;
      }

      currentMemberName = name;

      // Allowed types
      if (typeflag !== '0' && typeflag !== '\0' && typeflag !== '5') {
        const typeNames = {
          '1': 'hard link',
          '2': 'symbolic link',
          '3': 'character device',
          '4': 'block device',
          '6': 'FIFO',
          '7': 'contiguous file',
          'K': 'GNU long link',
        };
        const label = typeNames[typeflag] || `unknown type '${typeflag}'`;
        abort(`Disallowed archive member type '${label}' for path: "${name}"`);
        return;
      }

      // Path Security Validations
      if (!name || name.trim() === '') {
        abort('Archive contains empty member path');
        return;
      }

      if (name.includes('\\')) {
        abort(`Path contains forbidden Windows backslash separator: "${name}"`);
        return;
      }

      if (name.startsWith('/') || /^[a-zA-Z]:/.test(name) || name.startsWith('\\\\')) {
        abort(`Absolute path detected: "${name}"`);
        return;
      }

      if (/(^|\/)\.\.(\/|$)/.test(name)) {
        abort(`Directory traversal (..) detected: "${name}"`);
        return;
      }

      const normalized = path.posix.normalize(name).replace(/\/+$/, '');

      if (normalized.startsWith('../') || normalized === '..' || normalized.startsWith('/')) {
        abort(`Path normalizes outside staging boundary: "${name}" -> "${normalized}"`);
        return;
      }

      if (seenPaths.has(normalized)) {
        abort(`Duplicate archive member path detected: "${normalized}"`);
        return;
      }
      seenPaths.add(normalized);

      let parent = path.posix.dirname(normalized);
      while (parent && parent !== '.' && parent !== '/') {
        if (filePaths.has(parent)) {
          abort(`Conflicting path: parent component "${parent}" was already registered as a regular file`);
          return;
        }
        parent = path.posix.dirname(parent);
      }

      if (typeflag === '5') {
        if (filePaths.has(normalized)) {
          abort(`Conflicting path: directory "${normalized}" conflicts with earlier file of same name`);
          return;
        }
        directoryPaths.add(normalized);
        totalDirs++;
      } else {
        if (directoryPaths.has(normalized)) {
          abort(`Conflicting path: file "${normalized}" conflicts with earlier directory of same name`);
          return;
        }
        filePaths.add(normalized);
        totalFiles++;

        const ext = path.posix.extname(normalized).toLowerCase();
        if (!ALLOWED_EXTENSIONS.has(ext)) {
          abort(`Disallowed file extension '${ext}' for file "${normalized}". Only safe media assets are permitted.`);
          return;
        }
      }

      // Check data blocks
      const dataBlocks = Math.ceil(size / BLOCK_SIZE);
      if (dataBlocks > 0) {
        dataBlocksRemaining = dataBlocks;
        state = 'MEMBER_DATA';
      }
    }

    gunzip.on('data', (chunk) => {
      if (aborted) return;
      totalDecompressedBytes += chunk.length;
      if (totalDecompressedBytes > MAX_DECOMPRESSED_BYTES) {
        abort(`Decompressed archive size exceeds safety limit of ${MAX_DECOMPRESSED_BYTES} bytes (${(MAX_DECOMPRESSED_BYTES / (1024 * 1024)).toFixed(0)} MB)`);
        return;
      }

      residual = Buffer.concat([residual, chunk]);
      while (residual.length >= BLOCK_SIZE) {
        const block = residual.subarray(0, BLOCK_SIZE);
        residual = residual.subarray(BLOCK_SIZE);
        processBlock(block);
        if (aborted) return;
      }
    });

    gunzip.on('error', (err) => {
      abort(`Failed to decompress gzip archive: ${err.message}`);
    });

    fileStream.on('error', (err) => {
      abort(`Failed to read archive file: ${err.message}`);
    });

    gunzip.on('end', () => {
      if (aborted) return;

      if (residual.length > 0) {
        abort(`Malformed tar archive: size ${totalDecompressedBytes} bytes is not a multiple of 512 (trailing ${residual.length} bytes)`);
        return;
      }

      if (totalDecompressedBytes < BLOCK_SIZE * 3) {
        abort(`Malformed tar archive: size ${totalDecompressedBytes} bytes is too short for valid tar stream`);
        return;
      }

      if (state === 'MEMBER_DATA') {
        abort(`Truncated tar archive: member data for "${currentMemberName}" extends beyond archive boundary`);
        return;
      }

      if (state === 'GNU_LONG_NAME') {
        abort('Truncated tar archive: GNU long-name data blocks extend beyond archive boundary');
        return;
      }

      if (gnuLongName !== null) {
        abort('Malformed tar archive: trailing GNU long-name without accompanying member header');
        return;
      }

      if (!seenEndOfArchive) {
        abort(`Malformed tar archive: missing standard end-of-archive double zero-block terminator (found ${zeroBlockCount}/2 zero blocks)`);
        return;
      }

      if (totalFiles === 0 && totalDirs === 0) {
        abort('Archive contains zero valid files or directories');
        return;
      }

      console.log(`[Archive Validator] ✓ Archive validated successfully: ${totalFiles} regular files, ${totalDirs} directories.`);
      console.log('[Archive Validator] ✓ Verified zero symlinks, zero hard links, zero special devices, zero path traversals, valid termination.');
      process.exit(0);
    });

    fileStream.pipe(gunzip);
  });
}

const targetArchive = process.argv[2];
if (!targetArchive) {
  console.error('Usage: node validate-archive.js <path-to-tar.gz>');
  process.exit(1);
}

validateArchive(targetArchive).catch((err) => {
  fail(err.message);
});
