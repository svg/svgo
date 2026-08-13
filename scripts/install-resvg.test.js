import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { jest } from '@jest/globals';
import { getResvgPath, installResvg, selectRelease } from './install-resvg.js';

test.each([
  [
    'linux',
    'x64',
    'resvg-linux-x86_64.tar.gz',
    'fa8c26495a187e592c501db15bf9e8a9fdc051d4b2b336b39703d5b59f912b9d',
  ],
  [
    'darwin',
    'x64',
    'resvg-macos-x86_64.zip',
    '0135923e443863db251a26bd78eabc6efb4b59d67b8cdc5469e3e1da26bc0ce2',
  ],
  [
    'darwin',
    'arm64',
    'resvg-macos-aarch64.zip',
    '06440eb5aa14a28cbfc7e40ae39e1ffa71adc051b89fbaa913b4f1d9b905d09f',
  ],
])('selects %s %s', (platform, arch, asset, sha256) => {
  expect(selectRelease(platform, arch)).toMatchObject({ asset, sha256 });
});

test('rejects unsupported targets', () => {
  expect(() => selectRelease('win32', 'x64')).toThrow(
    'resvg does not publish a CLI binary for win32 x64',
  );
});

describe('installResvg', () => {
  let root;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'install-resvg-test-'));
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  test('downloads, verifies, extracts, and enables resvg', async () => {
    const archive = Buffer.from('verified archive');
    const release = {
      asset: 'resvg-test.tar.gz',
      format: 'tar.gz',
      sha256: createHash('sha256').update(archive).digest('hex'),
    };
    const download = jest.fn(async () => archive);
    const extract = jest.fn(async (_buffer, destination) => {
      await fs.mkdir(destination, { recursive: true });
      await fs.writeFile(path.join(destination, 'resvg'), 'binary');
    });
    const chmod = jest.fn(async () => {});

    await expect(
      installResvg({ root, release, download, extract, chmod }),
    ).resolves.toBe(path.join(root, '.tools/resvg/0.48.1/resvg'));
    expect(download).toHaveBeenCalledWith(
      'https://github.com/linebender/resvg/releases/download/v0.48.1/resvg-test.tar.gz',
    );
    expect(chmod).toHaveBeenCalledWith(expect.stringMatching(/resvg$/), 0o755);
  });

  test('returns an existing resvg without downloading it again', async () => {
    const resvgPath = getResvgPath(root);
    await fs.mkdir(path.dirname(resvgPath), { recursive: true });
    await fs.writeFile(resvgPath, 'binary');
    const download = jest.fn();

    await expect(installResvg({ root, download })).resolves.toBe(resvgPath);
    expect(download).not.toHaveBeenCalled();
  });

  test('rejects a checksum mismatch before extraction', async () => {
    const extract = jest.fn();
    const release = {
      asset: 'resvg-test.tar.gz',
      format: 'tar.gz',
      sha256: 'incorrect checksum',
    };

    await expect(
      installResvg({
        root,
        release,
        download: async () => Buffer.from('corrupt archive'),
        extract,
      }),
    ).rejects.toThrow('Checksum mismatch for resvg-test.tar.gz');
    expect(extract).not.toHaveBeenCalled();
  });

  test('propagates download errors', async () => {
    const downloadError = new Error('download failed');

    await expect(
      installResvg({
        root,
        download: async () => {
          throw downloadError;
        },
      }),
    ).rejects.toBe(downloadError);
  });

  test('propagates extraction errors', async () => {
    const archive = Buffer.from('verified archive');
    const extractionError = new Error('extraction failed');

    await expect(
      installResvg({
        root,
        release: {
          asset: 'resvg-test.tar.gz',
          format: 'tar.gz',
          sha256: createHash('sha256').update(archive).digest('hex'),
        },
        download: async () => archive,
        extract: async () => {
          throw extractionError;
        },
      }),
    ).rejects.toBe(extractionError);
  });

  test('rejects extraction that does not create resvg', async () => {
    const archive = Buffer.from('verified archive');

    await expect(
      installResvg({
        root,
        release: {
          asset: 'resvg-test.tar.gz',
          format: 'tar.gz',
          sha256: createHash('sha256').update(archive).digest('hex'),
        },
        download: async () => archive,
        extract: async (_buffer, destination) => {
          await fs.mkdir(destination, { recursive: true });
        },
      }),
    ).rejects.toThrow('resvg was not found after extracting resvg-test.tar.gz');
  });
});
