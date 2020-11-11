import {
  Parse,
  Argument,
  Type,
  SourcePawnType,
  BuiltInType,
  CustomType,
  DimensionalType,
  Range,
} from "../../src/parser";

export function argument(name: string, type: Type): Argument {
  return {
    name,
    type,
    defaultValue: undefined,
  };
}

export function argument_with_default(
  name: string,
  type: Type,
  defaultValue: string
): Argument {
  return {
    name,
    type,
    defaultValue,
  };
}

export function AST_of(code: string) {
  return Parse(code);
}

export function from(startRow, startColumn) {
  return {
    to: (endRow, endColumn): Range => ({
      start: { line: startRow, character: startColumn },
      end: { line: endRow, character: endColumn },
    }),
  };
}

export const no_arguments: ReadonlyArray<Argument> = [];
export const types = {
  void: { typeCase: 1, type: SourcePawnType.Void } as BuiltInType,
  int: { typeCase: 1, type: SourcePawnType.Int } as BuiltInType,
  float: { typeCase: 1, type: SourcePawnType.Float } as BuiltInType,
  char: { typeCase: 1, type: SourcePawnType.Char } as BuiltInType,
  bool: { typeCase: 1, type: SourcePawnType.Bool } as BuiltInType,
  custom: (type: string): CustomType => ({ typeCase: 2, type }),
  dimensional: (
    depth: number,
    type: BuiltInType | CustomType
  ): DimensionalType => ({ typeCase: 3, depth, type }),
};
