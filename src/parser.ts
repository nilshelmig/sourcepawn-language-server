import Parser from "tree-sitter";
import SourcePawn from "tree-sitter-sourcepawn";

const parser = new Parser();
parser.setLanguage(SourcePawn);

export type SourcePawnType = "void" | "int" | "float" | "char" | "bool";
export type Type = SourcePawnType | string;

export interface Argument {
  readonly type: Type;
  readonly name: string;
  readonly defaultValue?: string;
}

export interface Function_definition {
  readonly returnType: Type;
  readonly name: string;
  readonly args: ReadonlyArray<Argument>;
}

export function All_function_definitions(
  code: string
): ReadonlyArray<Function_definition> {
  const ast = parser.parse(code);
  if (!ast.rootNode) return [];

  return ast.rootNode
    .descendantsOfType("function_declaration")
    .map(parse_function_definition)
    .filter(notNull);
}

function notNull<T>(element: T | null): element is T {
  return element != null;
}

function getFieldNode(
  field: string,
  node: Parser.SyntaxNode
): Parser.SyntaxNode | null {
  return (node as any)[field] as Parser.SyntaxNode;
}

function getFieldNodes(
  field: string,
  node: Parser.SyntaxNode
): Parser.SyntaxNode[] {
  return ((node as any)[field] as Parser.SyntaxNode[]) ?? [];
}

function parse_function_definition(
  node: Parser.SyntaxNode
): Function_definition | null {
  let args = node
    .descendantsOfType("argument_declarations")[0]
    .descendantsOfType("argument_declaration");

  let name = getFieldNode("nameNode", node)?.text;
  let returnTypeNode = getFieldNodes("returnTypeNodes", node)[0];
  let returnType =
    returnTypeNode?.childCount > 1
      ? returnTypeNode?.firstChild?.text
      : returnTypeNode?.text;
  return name != null
    ? {
        returnType: as_SourcePawnType(returnType) ?? returnType ?? "int",
        name,
        args: args.map(parse_argument).filter(notNull),
      }
    : null;
}

function as_SourcePawnType(input: string | undefined): SourcePawnType | null {
  switch (input) {
    case "void":
      return "void";

    case "Float":
    case "float":
      return "float";

    case "bool":
      return "bool";

    case "String":
    case "char":
      return "char";

    case "int":
    case "_":
    case null:
      return "int";

    default:
      return null;
  }
}

function parse_argument(node: Parser.SyntaxNode): Argument | null {
  const name = getFieldNode("nameNode", node)?.text;
  let typeNameNode = getFieldNode("argumentTypeNode", node)?.firstChild;
  const typeName =
    typeNameNode?.type === "symbol"
      ? typeNameNode.text
      : typeNameNode?.firstChild?.text;

  return name != null
    ? {
        type: as_SourcePawnType(typeName) ?? typeName ?? "int",
        name,
        defaultValue: getFieldNodes("defaultValueNodes", node)[1]?.text,
      }
    : null;
}
