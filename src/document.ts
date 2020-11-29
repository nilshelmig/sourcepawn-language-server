import { Tree } from "tree-sitter";
import { TextDocumentContentChangeEvent } from "vscode-languageserver";
import {
  Parse,
  ParseChange,
  All_function_definitions,
  Callback_implementations,
  Global_variables,
} from "./parser";

export default class Document {
  private ast: Tree;

  constructor(content: string) {
    this.ast = Parse(content);
  }

  applyChanges(changes: TextDocumentContentChangeEvent[]) {
    if (changes.length == 0) return;
    let oldTree;
    changes.forEach((change) => {
      if ("range" in change) {
        const startPosition = {
          row: change.range.start.line,
          column: change.range.start.character,
        };
        const endPosition = {
          row: change.range.end.line,
          column: change.range.end.character,
        };
        oldTree = this.ast.edit({
          startIndex: startPosition.column,
          oldEndIndex: endPosition.column,
          newEndIndex: endPosition.column,
          startPosition,
          oldEndPosition: endPosition,
          newEndPosition: endPosition,
        });

        this.ast = ParseChange(change.text, oldTree);
      } else {
        this.ast = Parse(change.text);
      }
    });
  }

  get defined_functions() {
    return All_function_definitions(this.ast);
  }

  get callback_implementations() {
    return Callback_implementations(this.ast);
  }

  get global_variables() {
    return Global_variables(this.ast);
  }
}
