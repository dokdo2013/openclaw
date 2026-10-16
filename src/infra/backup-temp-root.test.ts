import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { isPathInside } from "@openclaw/fs-safe/path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { chooseBackupTempRoot } from "./backup-create.js";

describe("chooseBackupTempRoot", () => {
  let root: string | undefined;
  afterEach(async () => {
    vi.restoreAllMocks();
    if (root) {
      await fs.rm(root, { recursive: true, force: true });
    }
  });

  it("stages offsite scratch outside a source that contains tmpdir", async () => {
    root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "oc-temp-root-")));
    const state = path.join(root, "state");
    const nestedTmp = path.join(state, "tmp");
    await fs.mkdir(nestedTmp, { recursive: true });
    vi.spyOn(os, "tmpdir").mockReturnValue(nestedTmp);
    const assets = [{ kind: "state", sourcePath: state }] as unknown as Parameters<
      typeof chooseBackupTempRoot
    >[0]["assets"];

    const chosen = await chooseBackupTempRoot({ assets });

    expect(chosen).toBe(root);
    expect(isPathInside(state, chosen)).toBe(false);
  });
});
