import Parser from "tree-sitter";
import SourcePawn from "tree-sitter-sourcepawn";

const parser = new Parser();
parser.setLanguage(SourcePawn);

export enum SourcePawnType {
  Void,
  Int,
  Float,
  Char,
  Bool,
}
export type BuiltInType = { typeCase: 1; type: SourcePawnType };
export type CustomType = { typeCase: 2; type: string };
export type DimensionalType = {
  typeCase: 3;
  depth: number;
  type: BuiltInType | CustomType;
};
export type Type = BuiltInType | CustomType | DimensionalType;

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
        returnType: parseType(returnType) || {
          typeCase: 1,
          type: SourcePawnType.Int,
        },
        name,
        args: args.map(parse_argument).filter(notNull),
      }
    : null;
}

function parseType(input: string | undefined): BuiltInType | CustomType | null {
  return input === undefined
    ? null
    : parseBuiltInType(input) || { typeCase: 2, type: input };
}

function parseBuiltInType(input: string | undefined): BuiltInType | null {
  switch (input) {
    case "void":
      return { typeCase: 1, type: SourcePawnType.Void };

    case "Float":
    case "float":
      return { typeCase: 1, type: SourcePawnType.Float };

    case "bool":
      return { typeCase: 1, type: SourcePawnType.Bool };

    case "String":
    case "char":
      return { typeCase: 1, type: SourcePawnType.Char };

    case "int":
    case "_":
    case null:
      return { typeCase: 1, type: SourcePawnType.Int };

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

  const dimension =
    node.descendantsOfType("dimension").length +
    node.descendantsOfType("fixed_dimension").length;

  return name != null
    ? {
        type:
          dimension > 0
            ? ({
                typeCase: 3,
                depth: dimension,
                type: parseType(typeName),
              } as DimensionalType)
            : parseType(typeName) || { typeCase: 1, type: SourcePawnType.Int },
        name,
        defaultValue: getFieldNodes("defaultValueNodes", node)[1]?.text,
      }
    : null;
}
