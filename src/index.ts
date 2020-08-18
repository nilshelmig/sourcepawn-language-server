import { createConnection, IConnection } from "vscode-languageserver";

const connection: IConnection = createConnection();

connection.onInitialize((_) => {
  return {
    capabilities: {
      completionProvider: {
        resolveProvider: true,
      },
    },
  };
});

connection.onInitialized((_) =>
  connection.console.log("Started sourcepawn LS")
);
connection.onDidOpenTextDocument((params) =>
  connection.console.log(`Did open ${params.textDocument.uri}`)
);

connection.listen();
