const cluster = require("cluster");
const chalk = require("chalk");
const boxen = require("boxen");
const ip = require("ip");
const process = require("process");
const numCPUs = require("os").cpus().length;
require("dotenv").config({ path: `${__dirname}/../.env` });

const { HOST = "localhost", PORT = 8079 } = process.env;

function logServerStarted(opt = {}) {
  let message = chalk.green(
    `Running ${(opt.chalk || chalk.bold)(opt.type)} in ${chalk.bold(
      process.env.NODE_ENV || "development"
    )} mode\n\n`
  );

  const localURL = `http://${opt.host}:${opt.port}`;
  message += `- ${chalk.bold("Local:           ")} ${localURL}`;

  try {
    const url = `http://${ip.address()}:${opt.port}`;
    message += `\n- ${chalk.bold("On Your Network: ")} ${url}`;
  } catch (err) {
    /* ignore errors */
  }

  console.log(
    boxen(message, {
      padding: 1,
      borderColor: "green",
      margin: 1
    })
  );
}

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();// .on("listening", console.log);
  }

  logServerStarted({
    type: "Bornhack Metrics",
    host: HOST,
    port: PORT,
    chalk: chalk.bgMagenta.black
  });

  cluster.on("exit", worker => {
    console.log(`worker ${worker.process.pid} died`);
    if (worker.suicide === true) {
      console.log(`${new Date()} Worker committed suicide`);
      cluster.fork();
    }
  });
} else {
  require("./api.start.js");
  console.log(`worker ${process.pid} started`);
}
