/* eslint-disable no-throw-literal */

import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { graphqlExpress, graphiqlExpress } from "apollo-server-express";
import chalk from "chalk";
import _ from "lodash";
import { escape as mongoEscape } from "mongo-escape";

import schema from "./schema";

import db from "./db";

const app = express();
app.use("/graphql", cors(), bodyParser.json(), graphqlExpress({ schema }));
app.use(
  "/graphiql",
  graphiqlExpress({
    endpointURL: "/graphql",
  }),
);
app.use("/submit", cors(), bodyParser.json({ limit: "50mb" }));
app.post("/submit", async (request, response) => {
  try {
    const teamSecret = request.headers["x-bornhack-metrics-teamsecret"];
    if (!teamSecret) {
      throw { message: "BornHack team secret header missing.", status: 401 };
    }

    const teamDocument = await db.teams.findOne({ secret: teamSecret });
    if (!teamDocument) {
      throw { message: "BornHack team secret header invalid.", status: 403 };
    }

    const { collection, documents } = request.body;
    if (!collection) {
      throw {
        message: "Request body must include `collection` field.",
        status: 400,
      };
    }
    if (!_.isString(collection)) {
      throw {
        message: "Request body field `collection` must be a string.",
        status: 400,
      };
    }
    if (!documents) {
      throw {
        message: "Request body must include `documents` field.",
        status: 400,
      };
    }
    if (
      !_.isArray(documents) ||
      !documents.length ||
      !_.every(documents, _.isObject) ||
      !_.every(documents, _.property("id"))
    ) {
      throw {
        message: `Request body field \`documents\` must be an array of objects with an \`id\` field.
          The \`id\` field is unique and any existing document with the same \`id\` in the given collection will be overwritten.`,
        status: 400,
      };
    }

    const upsertResults = await Promise.all(
      documents.map(document => {
        const newDocument = { ...document };
        delete newDocument._id;
        mongoEscape(newDocument);

        return db
          .collection(`${teamDocument.slug}_${collection}`)
          .update({ id: newDocument.id }, newDocument, {
            upsert: true,
          });
      }),
    );

    response.status(200).json({
      message: "Upserted your documents!",
      upsertResults: upsertResults.map(upsertResult => {
        delete upsertResult.upserted;
        return upsertResult;
      }),
    });
  } catch (error) {
    if (error.status === 401) {
      response.setHeader("WWW-Authenticate", "Arbitrary");
    }
    response.status(error.status).json(error);
  }
});

const { HOST = "localhost", PORT = 8079, NODE_ENV } = process.env;

const server = app.listen(PORT, HOST, () => {
  console.log(`Bornhack Metrics server PID: ${process.pid} running`);
});

// Gracefulness
server.on("connection", socket => {
  socket.setTimeout(5 * 1000);
});
process.on("SIGINT", () => {
  console.log("graceful shutdown express");
  server.close(() => {
    console.log("closed express");
  });
});
