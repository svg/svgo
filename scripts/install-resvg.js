import { createHash } from 'node:crypto';
import { execFile as execFileCallback } from 'node:child_process';
import fs from 'node:fs/promises';
import http from 'node:http';
import https from 'node:https';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

export const RESVG_VERSION = '0.48.1';

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const execFile = promisify(execFileCallback);
const releaseBaseUrl = `https://github.com/linebender/resvg/releases/download/v${RESVG_VERSION}`;
const DOWNLOAD_MAX_REDIRECTS = 5;
const DOWNLOAD_TIMEOUT_MS = 30_000;
const DOWNLOAD_MAX_BYTES = 100 * 1024 * 1024;

/**
 * @typedef {object} Release
 * @property {string} asset
 * @property {string} sha256
 * @property {'tar.gz' | 'zip'} format
 */

/** @type {Record<string, Release>} */
const releases = {
  'linux-x64': {
    asset: 'resvg-linux-x86_64.tar.gz',
    sha256: 'fa8c26495a187e592c501db15bf9e8a9fdc051d4b2b336b39703d5b59f912b9d',
    format: 'tar.gz',
  },
  'darwin-x64': {
    asset: 'resvg-macos-x86_64.zip',
    sha256: '0135923e443863db251a26bd78eabc6efb4b59d67b8cdc5469e3e1da26bc0ce2',
    format: 'zip',
  },
  'darwin-arm64': {
    asset: 'resvg-macos-aarch64.zip',
    sha256: '06440eb5aa14a28cbfc7e40ae39e1ffa71adc051b89fbaa913b4f1d9b905d09f',
    format: 'zip',
  },
};

/** @param {string} [root] */
export const getResvgPath = (root = repositoryRoot) =>
  path.join(root, '.tools', 'resvg', RESVG_VERSION, 'resvg');

/**
 * @param {string} platform
 * @param {string} arch
 * @returns {Release}
 */
export const selectRelease = (platform, arch) => {
  const release = releases[`${platform}-${arch}`];
  if (release == null) {
    throw new Error(
      `resvg does not publish a CLI binary for ${platform} ${arch}`,
    );
  }
  return release;
};

/**
 * @typedef {object} DownloadOptions
 * @property {number} [maxRedirects]
 * @property {number} [timeoutMs]
 * @property {number} [maxBytes]
 * @property {number} [redirects]
 */

/**
 * @param {string} url
 * @param {DownloadOptions} [options]
 * @returns {Promise<Buffer>}
 */
export const downloadArchive = (url, options = {}) =>
  new Promise((resolve, reject) => {
    const maxRedirects = options.maxRedirects ?? DOWNLOAD_MAX_REDIRECTS;
    const timeoutMs = options.timeoutMs ?? DOWNLOAD_TIMEOUT_MS;
    const maxBytes = options.maxBytes ?? DOWNLOAD_MAX_BYTES;
    const redirects = options.redirects ?? 0;
    const client = new URL(url).protocol === 'http:' ? http : https;
    const request = client.get(url, (response) => {
      const { statusCode = 0 } = response;
      if (
        statusCode >= 300 &&
        statusCode < 400 &&
        response.headers.location != null
      ) {
        response.resume();
        if (redirects >= maxRedirects) {
          reject(
            new Error(
              `Failed to download resvg: too many redirects (max ${maxRedirects})`,
            ),
          );
        } else {
          downloadArchive(new URL(response.headers.location, url).href, {
            maxRedirects,
            timeoutMs,
            maxBytes,
            redirects: redirects + 1,
          }).then(resolve, reject);
        }
        return;
      }
      if (statusCode < 200 || statusCode >= 300) {
        response.resume();
        reject(new Error(`Failed to download resvg: HTTP ${statusCode}`));
        return;
      }

      const contentLength = Number(response.headers['content-length']);
      if (Number.isFinite(contentLength) && contentLength > maxBytes) {
        response.resume();
        reject(
          new Error(
            `Failed to download resvg: archive exceeds ${maxBytes} bytes`,
          ),
        );
        return;
      }

      /** @type {Buffer[]} */
      const chunks = [];
      let bytes = 0;
      response.on('data', (chunk) => {
        bytes += chunk.length;
        if (bytes > maxBytes) {
          response.destroy(
            new Error(
              `Failed to download resvg: archive exceeds ${maxBytes} bytes`,
            ),
          );
        } else {
          chunks.push(chunk);
        }
      });
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    });
    request.setTimeout(timeoutMs, () => {
      request.destroy(
        new Error(
          `Failed to download resvg: request timed out after ${timeoutMs}ms`,
        ),
      );
    });
    request.on('error', reject);
  });

/**
 * @param {Buffer} archive
 * @param {string} destination
 * @param {Release['format']} format
 */
const extractArchive = async (archive, destination, format) => {
  const temporaryDirectory = await fs.mkdtemp(
    path.join(os.tmpdir(), 'resvg-archive-'),
  );
  const archivePath = path.join(temporaryDirectory, `resvg.${format}`);

  try {
    await fs.mkdir(destination, { recursive: true });
    await fs.writeFile(archivePath, archive);
    if (format === 'tar.gz') {
      await execFile('tar', ['-xzf', archivePath, '-C', destination]);
    } else {
      await execFile('unzip', ['-jo', archivePath, '-d', destination]);
    }
  } finally {
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }
};

/** @param {string} filePath */
const isExecutableFile = async (filePath) => {
  try {
    const stats = await fs.stat(filePath);
    return stats.isFile() && (stats.mode & 0o111) !== 0;
  } catch {
    return false;
  }
};

/**
 * @typedef {object} InstallOptions
 * @property {string} [root]
 * @property {Release} [release]
 * @property {(url: string) => Promise<Buffer>} [download]
 * @property {(archive: Buffer, destination: string, format: Release['format']) => Promise<void>} [extract]
 * @property {(path: string, mode: number) => Promise<void>} [chmod]
 * @property {(path: string) => Promise<boolean>} [isExecutable]
 */

/**
 * @param {InstallOptions} [options]
 * @returns {Promise<string>}
 */
export const installResvg = async (options = {}) => {
  const root = options.root ?? repositoryRoot;
  const resvgPath = getResvgPath(root);
  const destination = path.dirname(resvgPath);
  const isExecutable = options.isExecutable ?? isExecutableFile;

  if (await isExecutable(resvgPath)) {
    return resvgPath;
  }
  await fs.rm(destination, { recursive: true, force: true });

  const release =
    options.release ?? selectRelease(process.platform, process.arch);
  const download = options.download ?? downloadArchive;
  const extract = options.extract ?? extractArchive;
  const chmod = options.chmod ?? fs.chmod;
  const archive = await download(`${releaseBaseUrl}/${release.asset}`);
  const checksum = createHash('sha256').update(archive).digest('hex');

  if (checksum !== release.sha256) {
    throw new Error(`Checksum mismatch for ${release.asset}`);
  }

  try {
    await extract(archive, destination, release.format);

    const stats = await fs.stat(resvgPath).catch((caught) => {
      const error = /** @type {NodeJS.ErrnoException} */ (caught);
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    });
    if (stats == null || !stats.isFile()) {
      throw new Error(`resvg was not found after extracting ${release.asset}`);
    }

    await chmod(resvgPath, 0o755);
  } catch (error) {
    await fs.rm(destination, { recursive: true, force: true });
    throw error;
  }

  return resvgPath;
};

if (
  process.argv[1] != null &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
  console.log(await installResvg());
}
