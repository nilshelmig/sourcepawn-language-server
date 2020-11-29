import Parser from "tree-sitter";
import SourcePawn from "tree-sitter-sourcepawn";

const parser = new Parser();
parser.setLanguage(SourcePawn);

export type Position = { line: number; character: number };
export type Range = { start: Position; end: Position };

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
  readonly range: Range;
  readonly returnType: Type;
  readonly name: string;
  readonly args: ReadonlyArray<Argument>;
}

export interface Callback_implementation {
  readonly range: Range;
  readonly returnType: Type;
  readonly name: string;
  readonly args: ReadonlyArray<Argument>;
}

export interface Variable {
  readonly range: Range;
  readonly type: Type;
  readonly name: string;
  readonly hasInitialValue: boolean;
}

export function Parse(code: string) {
  return parser.parse(code);
}

export function ParseChange(change: string, oldTree: Parser.Tree) {
  return parser.parse(change, oldTree);
}

export function All_function_definitions(
  ast: Parser.Tree
): ReadonlyArray<Function_definition> {
  return ast.rootNode
    .descendantsOfType("function_declaration")
    .map(parse_function_definition)
    .filter(notNull);
}

export function Callback_implementations(
  ast: Parser.Tree
): ReadonlyArray<Callback_implementation> {
  return ast.rootNode
    .descendantsOfType("callback_implementation")
    .map(parse_callback_implementation)
    .filter(notNull);
}

export function Global_variables(ast: Parser.Tree): ReadonlyArray<Variable> {
  return ast.rootNode.children
    .filter((_) => _.type === "variable_declaration_statement")
    .map(parse_variable_declarations)
    .reduce((acc, val) => acc.concat(val), []);
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

function as_Position(point: Parser.Point): Position {
  return { line: point.row, character: point.column };
}

function parse_function_definition(
  node: Parser.SyntaxNode
): Function_definition | null {
  let args = getFieldNode("argumentsNode", node)?.children || [];
  let name = getFieldNode("nameNode", node)?.text;
  let returnTypeNode = getFieldNodes("returnTypeNodes", node)[0];
  let returnType =
    returnTypeNode?.childCount > 1
      ? returnTypeNode?.firstChild?.text
      : returnTypeNode?.text;
  return name != null
    ? {
        range: {
          start: as_Position(node.startPosition),
          end: as_Position(node.endPosition),
        },
        returnType: parseType(returnType) || {
          typeCase: 1,
          type: SourcePawnType.Int,
        },
        name,
        args: args.map(parse_argument).filter(notNull),
      }
    : null;
}

function parse_callback_implementation(
  node: Parser.SyntaxNode
): Callback_implementation | null {
  let args = getFieldNode("argumentsNode", node)?.children || [];
  let name = getFieldNode("nameNode", node)?.text;
  let returnTypeNode = getFieldNodes("returnTypeNodes", node)[0];
  let returnType =
    returnTypeNode?.childCount > 1
      ? returnTypeNode?.firstChild?.text
      : returnTypeNode?.text;
  return name != null
    ? {
        range: {
          start: as_Position(node.startPosition),
          end: as_Position(node.endPosition),
        },
        returnType: parseType(returnType) || {
          typeCase: 1,
          type: SourcePawnType.Int,
        },
        name,
        args: args.map(parse_argument).filter(notNull),
      }
    : null;
}

function parse_variable_declarations(
  node: Parser.SyntaxNode
): ReadonlyArray<Variable> {
  let typeNode = getFieldNode("typeNode", node);
  let type: Type = (typeNode && extractType(typeNode)) || {
    typeCase: 1,
    type: SourcePawnType.Int,
  };
  const dimensions = typeNode?.descendantsOfType("dimension").length || 0;
  if (dimensions > 0) type = { typeCase: 3, depth: dimensions, type };

  let vars = node
    .descendantsOfType("variable_declaration")
    .map((n) => parse_variable_declaration(n, type))
    .filter(notNull);

  return vars.length == 1
    ? [
        {
          ...vars[0],
          range: {
            start: as_Position(node.startPosition),
            end: as_Position(node.endPosition),
          },
        },
      ]
    : vars;
}

function parse_variable_declaration(
  node: Parser.SyntaxNode,
  initialType: Type
): Variable | null {
  const name = getFieldNode("nameNode", node)?.text;
  const dimension =
    node.descendantsOfType("dimension").length +
    node.descendantsOfType("fixed_dimension").length;
  const type: Type =
    dimension > 0
      ? initialType.typeCase === 3
        ? expandDimensionalType(initialType, dimension + 1)
        : ({
            typeCase: 3,
            depth: dimension,
            type: initialType,
          } as DimensionalType)
      : initialType;
  const hasInitialValue = getFieldNodes("initialValueNodes", node).length !== 0;

  return name != null
    ? {
        name,
        type,
        range: {
          start: as_Position(node.startPosition),
          end: as_Position(node.endPosition),
        },
        hasInitialValue,
      }
    : null;
}

function expandDimensionalType(
  type: DimensionalType,
  depth: number
): DimensionalType {
  return {
    typeCase: 3,
    depth,
    type: type.type,
  };
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
  const typeNode = getFieldNode("typeNode", node);
  const type = typeNode && extractType(typeNode);

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
                type,
              } as DimensionalType)
            : type || { typeCase: 1, type: SourcePawnType.Int },
        name,
        defaultValue: getFieldNodes("defaultValueNodes", node)[1]?.text,
      }
    : null;
}

function extractType(node: Parser.SyntaxNode): BuiltInType | CustomType | null {
  let typeNameNode = node?.firstChild;
  const typeName =
    typeNameNode?.type === "symbol"
      ? typeNameNode.text
      : typeNameNode?.firstChild?.text;

  return parseType(typeName);
}
