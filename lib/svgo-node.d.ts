import { Config, optimize } from './svgo';

export { optimize };

/**
 * If you write a tool on top of svgo you might need a way to load svgo config.
 *
 * You can also specify relative or absolute path and customize current working directory.
 */
export declare function loadConfig(
  configFile: string,
  cwd?: string,
): Promise<Config>;
export declare function loadConfig(
  configFile?: null,
  cwd?: string,
): Promise<Config | null>;
