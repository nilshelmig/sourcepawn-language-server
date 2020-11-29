import Document from "./document";
import {
  createConnection,
  IConnection,
  CompletionItem,
  CompletionItemKind,
  SymbolKind,
  SymbolInformation,
} from "vscode-languageserver";
import path from "path";
import { Dependency, IncludeType } from "./parser";
import fs from "fs";
import findUp from "find-up";

const connection: IConnection = createConnection();
let sourcemod_include_dir;

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
      const dependencies = resolveDeps(doc);
      connection.console.info(`${dependencies}`);
      return completions_of(doc).concat(
        dependencies
          .map(completions_of)
          .reduce((acc, val) => acc.concat(val), [])
      );
    } catch (error) {
      connection.console.error(`${error}`);
    }
  });
  connection.onDocumentSymbol((req) => {
    const doc = docs[req.textDocument.uri];
    const dependencies = resolveDeps(doc);
    return symbols_of(doc).concat(
      dependencies.map(symbols_of).reduce((acc, val) => acc.concat(val), [])
    );
  });
});
connection.onDidOpenTextDocument((params) => {
  const doc = new Document(params.textDocument.uri, params.textDocument.text);
  docs[params.textDocument.uri] = doc;
  connection.console.log(`Did open ${params.textDocument.uri}`);
  read_dependencies_from(doc);
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

function read_dependencies_from(doc: Document) {
  const docPath = path.normalize(doc.URI.replace("file://", ""));
  dependencies_uris(docPath, doc.dependencies).forEach(
    ([dependency, required]) => {
      if (docs[dependency] !== undefined) return;

      try {
        let content = fs.readFileSync(dependency).toString();
        let depDoc = new Document(`file://${dependency}`, content);
        docs[dependency] = depDoc;
        connection.console.log(`Did open ${dependency} as dependency`);
        read_dependencies_from(depDoc);
      } catch (error) {
        if (required) {
          connection.console.error(
            `Failed to load file "${dependency}". ${error}`
          );
        } else {
          connection.console.warn(
            `Couldn't read optional file"${dependency}". ${error}`
          );
        }
      }
    }
  );
}

function resolveDeps(doc: Document) {
  return dependencies_uris(doc.URI, doc.dependencies)
    .map(([uri, _]) => {
      let d = docs[uri];
      return d && [d].concat(resolveDeps(d));
    })
    .reduce((acc, val) => acc.concat(val), []);
}

function dependencies_uris(
  parentPath: string,
  dependencies: ReadonlyArray<Dependency>
): ReadonlyArray<[string, boolean]> {
  return dependencies
    .map((dependency): [string, boolean] | undefined => {
      let inc =
        dependency.includeType === IncludeType.Global_Include
          ? (() => {
              if (sourcemod_include_dir == null)
                sourcemod_include_dir = find_include_folder(parentPath);
              if (sourcemod_include_dir === null) {
                connection.console.error("Can't find include directory!");
                return undefined;
              }
              return path.join(sourcemod_include_dir, dependency.path);
            })()
          : path.relative(parentPath, dependency.path);
      return inc !== undefined ? [inc, dependency.required] : undefined;
    })
    .filter(notUndefined);
}

function find_include_folder(start: string): string | undefined {
  return findUp.sync("include", { type: "directory", cwd: start });
}

function notUndefined<T>(element: T | undefined): element is T {
  return element !== undefined;
}

function completions_of(doc: Document) {
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
}

function symbols_of(doc: Document) {
  return doc.defined_functions
    .map(
      (fun) =>
        ({
          name: fun.name,
          kind: SymbolKind.Function,
          location: {
            uri: doc.URI,
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
              uri: doc.URI,
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
              uri: doc.URI,
              range: variable.range,
            },
          } as SymbolInformation)
      )
    );
}
