import fs from "fs";
import path from "path";

export async function touch(filepath: string) {
  return new Promise((resolve, reject) => {
    const time = new Date();
    fs.utimes(filepath, time, time, (err) => {
      if (err) {
        return fs.open(filepath, "w", (err, fd) => {
          if (err) return reject(err);
          fs.close(fd, (err) => (err ? reject(err) : resolve(fd)));
        });
      }
      resolve();
    });
  });
}

export async function ensureExist(filepath: string) {
  const dirname = path.dirname(filepath);
  const dirstats = await fs.promises.stat(dirname).catch(() => null);
  if (!dirstats || !dirstats.isDirectory()) {
    await fs.promises.mkdir(dirname, { recursive: true });
  }

  await touch(filepath);
}
