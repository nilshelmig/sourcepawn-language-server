import Document from "./document";
import {
  createConnection,
  IConnection,
  CompletionItem,
  CompletionItemKind,
  SymbolKind,
  SymbolInformation,
} from "vscode-languageserver";

const connection: IConnection = createConnection();

connection.onInitialize((_) => {
  return {
    capabilities: {
      completionProvider: {
        resolveProvider: false,
      },
      documentSymbolProvider: true,
    },
  };
});

const docs: { [key: string]: Document } = {};
connection.onInitialized((_) => {
  connection.console.log("Started sourcepawn LS");
  connection.onCompletion((req) => {
    try {
      const doc = docs[req.textDocument.uri];
      return doc.defined_functions
        .map(
          (fun) =>
            ({
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
            } as CompletionItem)
        )
        .concat(
          doc.global_variables.map(
            (variable) =>
              ({
                label: variable.name,
                kind: CompletionItemKind.Variable,
              } as CompletionItem)
          )
        );
    } catch (error) {
      connection.console.error(`${error}`);
    }
  });
  connection.onDocumentSymbol((req) => {
    const doc = docs[req.textDocument.uri];
    return doc.defined_functions
      .map(
        (fun) =>
          ({
            name: fun.name,
            kind: SymbolKind.Function,
            location: {
              uri: req.textDocument.uri,
              range: fun.range,
            },
          } as SymbolInformation)
      )
      .concat(
        doc.callback_implementations.map(
          (callback) =>
            ({
              name: callback.name,
              kind: SymbolKind.Method,
              location: {
                uri: req.textDocument.uri,
                range: callback.range,
              },
            } as SymbolInformation)
        )
      )
      .concat(
        doc.global_variables.map(
          (variable) =>
            ({
              name: variable.name,
              kind: SymbolKind.Variable,
              location: {
                uri: req.textDocument.uri,
                range: variable.range,
              },
            } as SymbolInformation)
        )
      );
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
