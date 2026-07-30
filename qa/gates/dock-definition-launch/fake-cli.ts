const receipt = {
  argv: process.argv.slice(2),
  home: process.env.HOME ?? null,
  pid: process.pid,
};

console.log(JSON.stringify(receipt));
process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));
setInterval(() => {}, 1_000);
