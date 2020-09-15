import {
  createConnection,
  IConnection,
  CompletionItemKind,
} from "vscode-languageserver";

import { All_function_definitions } from "./parser";

const connection: IConnection = createConnection();

connection.onInitialize((_) => {
  return {
    capabilities: {
      completionProvider: {
        resolveProvider: false,
      },
    },
  };
});

const docs = {};
connection.onInitialized((_) => {
  connection.console.log("Started sourcepawn LS");
  connection.onCompletion((r) => {
    let text = docs[r.textDocument.uri];

    try {
      let funcs = All_function_definitions(text);
      return funcs.map((fun) => ({
        label: fun.name,
        kind: CompletionItemKind.Function,
        detail: `${fun.returnType} (${fun.args
          .map(
            (a) =>
              `${a.type} ${a.name}${
                a.defaultValue ? ` = ${a.defaultValue}` : ""
              }`
          )
          .join(", ")})`,
      }));
    } catch (error) {
      connection.console.error(`${error}`);
    }
  });
});
connection.onDidOpenTextDocument((params) => {
  docs[params.textDocument.uri] = params.textDocument.text;
  connection.console.log(`Did open ${params.textDocument.uri}`);
});

connection.listen();
