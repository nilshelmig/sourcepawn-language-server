import Document from "./document";
import {
  createConnection,
  IConnection,
  CompletionItemKind,
} from "vscode-languageserver";

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

const docs: { [key: string]: Document } = {};
connection.onInitialized((_) => {
  connection.console.log("Started sourcepawn LS");
  connection.onCompletion((r) => {
    try {
      let funcs = docs[r.textDocument.uri].defined_functions;
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
  docs[params.textDocument.uri] = new Document(params.textDocument.text);
  connection.console.log(`Did open ${params.textDocument.uri}`);
});
connection.onDidChangeTextDocument((params) => {
  connection.console.log(`Did change ${params.textDocument.uri}`);
  docs[params.textDocument.uri].applyChanges(params.contentChanges);
});
connection.onDidCloseTextDocument((params) => {
  connection.console.log(`Did close ${params.textDocument.uri}`);
  delete docs[params.textDocument.uri];
});

connection.listen();
