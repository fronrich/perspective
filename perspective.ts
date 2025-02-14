import { Elysia, file } from "elysia";
import { join } from "path";
import { getAllFiles } from "get-all-files";

async function listFiles(dirPath: string): Promise<string[]> {
  const files: string[] = [];
  for await (const file of getAllFiles(dirPath, { resolve: false })) {
    files.push(file);
  }
  return files;
}

const makePathRelative = (path: string, root: string) => {
  const newPath = path.replace(root, "");
  return newPath;
};

export interface PerspectiveConfig {
  base: string;
  staticClientDir: string;
}

const usePerspectives = (root: string) => {
  /**
   * Host a static web app on your Elysia server.
   *
   * Use multiple perspectives to host multiple web
   * apps that share the same server
   *
   * # Usage
   *
   * ```ts
   * // index.ts
   * import { Elysia } from "elysia";
   *
   * new Elysia()
   *  .use(perspective({
   *    base: '/'
   *    root: __dirname,
   *    staticClientDir: 'views/portfolio'
   *  }))
   *  .use(perspective({
   *    base: '/store'
   *    root: __dirname,
   *    staticClientDir: 'views/store'
   *  }))
   *
   * ```
   * @param param0
   * @returns
   */
  const perspective = async ({
    base,
    staticClientDir,
  }: PerspectiveConfig): Promise<Elysia> => {
    const plugin = new Elysia();

    const target = join(root, staticClientDir);

    return listFiles(target)
      .then((files) => {
        try {
          // make sure core index.html exists
          if (files.find((file) => file.includes("index.html")) === undefined) {
            throw new Error("index.html not found");
          }

          // host index.html
          plugin.get(join(base, "*"), () => file(join(target, "index.html")));

          const nonCoreFiles = files.filter(
            (file) => !file.includes("index.html")
          );

          // host assets
          nonCoreFiles.forEach((filePath) => {
            const relPath = makePathRelative(
              filePath,
              join(root, staticClientDir)
            );
            const url = join(base, relPath);

            plugin.get(url, () => file(filePath));
          });
        } catch (error) {
          return error;
        }
      })
      .then(() => plugin);
  };
  return { perspective };
};

export default usePerspectives;
