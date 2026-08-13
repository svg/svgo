import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { jest } from '@jest/globals';
import {
  downloadArchive,
  getResvgPath,
  installResvg,
  selectRelease,
} from './install-resvg.js';

const listen = async (handler) => {
  const server = http.createServer(handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return {
    server,
    url: `http://127.0.0.1:${port}`,
  };
};

const close = (server) =>
  new Promise((resolve, reject) =>
    server.close((error) => (error == null ? resolve() : reject(error))),
  );

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

describe('downloadArchive', () => {
  let server;

  afterEach(async () => {
    if (server != null) {
      await close(server);
      server = undefined;
    }
  });

  test('downloads through a relative redirect', async () => {
    const listening = await listen((request, response) => {
      if (request.url === '/archive') {
        response.end('archive');
      } else {
        response.writeHead(302, { location: '/archive' }).end();
      }
    });
    server = listening.server;

    await expect(downloadArchive(`${listening.url}/release`)).resolves.toEqual(
      Buffer.from('archive'),
    );
  });

  test('rejects non-successful responses', async () => {
    const listening = await listen((_request, response) => {
      response.writeHead(503).end('unavailable');
    });
    server = listening.server;

    await expect(downloadArchive(listening.url)).rejects.toThrow(
      'Failed to download resvg: HTTP 503',
    );
  });

  test('limits redirects', async () => {
    const listening = await listen((_request, response) => {
      response.writeHead(302, { location: '/again' }).end();
    });
    server = listening.server;

    await expect(
      downloadArchive(listening.url, { maxRedirects: 2 }),
    ).rejects.toThrow('Failed to download resvg: too many redirects (max 2)');
  });

  test('times out stalled requests', async () => {
    const listening = await listen(() => {});
    server = listening.server;

    await expect(
      downloadArchive(listening.url, { timeoutMs: 20 }),
    ).rejects.toThrow('Failed to download resvg: request timed out after 20ms');
  });

  test('rejects an oversized content-length', async () => {
    const listening = await listen((_request, response) => {
      response.writeHead(200, { 'content-length': '8' }).end('archive!');
    });
    server = listening.server;

    await expect(
      downloadArchive(listening.url, { maxBytes: 7 }),
    ).rejects.toThrow('Failed to download resvg: archive exceeds 7 bytes');
  });

  test('rejects an oversized streamed response', async () => {
    const listening = await listen((_request, response) => {
      response.writeHead(200);
      response.write('archive');
      response.end('!');
    });
    server = listening.server;

    await expect(
      downloadArchive(listening.url, { maxBytes: 7 }),
    ).rejects.toThrow('Failed to download resvg: archive exceeds 7 bytes');
  });
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
    await fs.chmod(resvgPath, 0o755);
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

  test('retries after extraction leaves a partial resvg', async () => {
    const archive = Buffer.from('verified archive');
    const release = {
      asset: 'resvg-test.tar.gz',
      format: 'tar.gz',
      sha256: createHash('sha256').update(archive).digest('hex'),
    };
    let attempt = 0;
    const extract = async (_buffer, destination) => {
      await fs.mkdir(destination, { recursive: true });
      const resvgPath = path.join(destination, 'resvg');
      if (attempt++ === 0) {
        await fs.writeFile(resvgPath, 'partial');
        throw new Error('extraction failed');
      }
      await fs.writeFile(resvgPath, 'complete');
    };
    const options = {
      root,
      release,
      download: async () => archive,
      extract,
    };

    await expect(installResvg(options)).rejects.toThrow('extraction failed');
    await expect(installResvg(options)).resolves.toBe(getResvgPath(root));
    await expect(fs.readFile(getResvgPath(root), 'utf8')).resolves.toBe(
      'complete',
    );
  });

  test('retries after chmod fails', async () => {
    const archive = Buffer.from('verified archive');
    const release = {
      asset: 'resvg-test.tar.gz',
      format: 'tar.gz',
      sha256: createHash('sha256').update(archive).digest('hex'),
    };
    const extract = async (_buffer, destination) => {
      await fs.mkdir(destination, { recursive: true });
      await fs.writeFile(path.join(destination, 'resvg'), 'binary');
    };
    let attempt = 0;
    const chmod = async (resvgPath, mode) => {
      if (attempt++ === 0) {
        throw new Error('chmod failed');
      }
      await fs.chmod(resvgPath, mode);
    };
    const options = {
      root,
      release,
      download: async () => archive,
      extract,
      chmod,
    };

    await expect(installResvg(options)).rejects.toThrow('chmod failed');
    await expect(installResvg(options)).resolves.toBe(getResvgPath(root));
    const stats = await fs.stat(getResvgPath(root));
    expect(stats.mode & 0o111).toBe(0o111);
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
