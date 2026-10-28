#!/usr/bin/env node
/**
 * Dedicated local PostgreSQL cluster for this project (no Docker needed).
 *
 *   pnpm --filter @ig/api db:local init     # one time: create cluster + databases
 *   pnpm --filter @ig/api db:local start
 *   pnpm --filter @ig/api db:local stop
 *   pnpm --filter @ig/api db:local status
 *
 * Env overrides: PG_BIN (folder with pg_ctl), PG_DATA (cluster folder), PG_PORT (default 5434).
 */
import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";

const isWindows = process.platform === "win32";
const exe = (name) => (isWindows ? `${name}.exe` : name);

const PORT = process.env.PG_PORT ?? "5434";
const USER = "instagram";
const PASSWORD = "instagram_dev";
const DATABASES = ["instagram", "instagram_test"];

const appData = process.env.LOCALAPPDATA ?? join(homedir(), ".local", "share");
const ROOT = join(appData, "InstagramClone");
const DATA = process.env.PG_DATA ?? join(ROOT, "pgdata");
const LOG = join(ROOT, "postgres.log");

function findBin() {
  const candidates = [
    process.env.PG_BIN,
    join(appData, "PostgreSQL17", "pgsql", "bin"),
    "C:\\Program Files\\PostgreSQL\\17\\bin",
  ].filter(Boolean);
  const found = candidates.find((dir) => existsSync(join(dir, exe("pg_ctl"))));
  if (found) return found;
  // Fall back to PATH
  return "";
}

const BIN = findBin();
const tool = (name) => (BIN ? join(BIN, exe(name)) : name);

function run(name, args, options = {}) {
  return execFileSync(tool(name), args, { stdio: "inherit", ...options });
}

function isRunning() {
  try {
    execFileSync(tool("pg_ctl"), ["-D", DATA, "status"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function start() {
  if (isRunning()) return console.log(`PostgreSQL is already running on port ${PORT}`);
  // Detached + ignored stdio: the server must not keep this terminal attached
  const child = spawn(
    tool("pg_ctl"),
    ["-D", DATA, "-l", LOG, "-o", `-p ${PORT} -c listen_addresses=localhost`, "start"],
    { detached: true, stdio: "ignore", windowsHide: true }
  );
  child.unref();
  for (let i = 0; i < 30; i++) {
    try {
      execFileSync(tool("pg_isready"), ["-h", "localhost", "-p", PORT], { stdio: "ignore" });
      return console.log(`PostgreSQL started on port ${PORT} (log: ${LOG})`);
    } catch {
      execFileSync(process.execPath, ["-e", "setTimeout(()=>{},500)"]);
    }
  }
  throw new Error(`PostgreSQL did not start, see ${LOG}`);
}

function init() {
  if (existsSync(join(DATA, "PG_VERSION"))) {
    console.log(`Cluster already exists at ${DATA}`);
  } else {
    mkdirSync(ROOT, { recursive: true });
    const pwfile = join(tmpdir(), `ig-pw-${process.pid}`);
    writeFileSync(pwfile, PASSWORD);
    try {
      run("initdb", ["-D", DATA, "-U", USER, `--pwfile=${pwfile}`, "-E", "UTF8", "--locale=C", "--auth=scram-sha-256"]);
    } finally {
      rmSync(pwfile, { force: true });
    }
  }
  start();
  const env = { ...process.env, PGPASSWORD: PASSWORD };
  for (const db of DATABASES) {
    try {
      execFileSync(tool("createdb"), ["-h", "localhost", "-p", PORT, "-U", USER, db], { stdio: "pipe", env });
      console.log(`Created database ${db}`);
    } catch (error) {
      if (!String(error.stderr).includes("already exists")) throw error;
      console.log(`Database ${db} already exists`);
    }
  }
}

const commands = {
  init,
  start,
  stop: () => run("pg_ctl", ["-D", DATA, "stop", "-m", "fast"]),
  status: () => console.log(isRunning() ? `running on port ${PORT} (${DATA})` : "stopped"),
};

const command = process.argv[2];
if (!commands[command]) {
  console.error(`Usage: local-db.mjs <${Object.keys(commands).join("|")}>`);
  process.exit(1);
}
commands[command]();
