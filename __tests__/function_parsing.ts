import {
  Parse,
  All_function_definitions,
  Function_definition,
  Type,
  CustomType,
  BuiltInType,
  DimensionalType,
  Argument,
  SourcePawnType,
} from "../src/parser";

function AST_of(code: string) {
  return Parse(code);
}

function defined_function(
  name: string,
  returnType: Type,
  args: ReadonlyArray<Argument>
): Function_definition {
  return {
    returnType,
    name,
    args,
  };
}

function argument(name: string, type: Type): Argument {
  return {
    name,
    type,
    defaultValue: undefined,
  };
}

function argument_with_default(
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

const no_arguments: ReadonlyArray<Argument> = [];
const types = {
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

test("Parsing function declaration - no arguments", () => {
  const defined_functions = All_function_definitions(
    AST_of(
      `void MyFunc1() {}
      int MyFunc2() {}
      float MyFunc3() {}
      char MyFunc4() {}
      bool MyFunc5() {}
      Handle MyFunc6() {}`
    )
  );
  expect(defined_functions).toEqual([
    defined_function("MyFunc1", types.void, no_arguments),
    defined_function("MyFunc2", types.int, no_arguments),
    defined_function("MyFunc3", types.float, no_arguments),
    defined_function("MyFunc4", types.char, no_arguments),
    defined_function("MyFunc5", types.bool, no_arguments),
    defined_function("MyFunc6", types.custom("Handle"), no_arguments),
  ]);
});

test("Parsing function declaration - single argument", () => {
  const defined_functions = All_function_definitions(
    AST_of(
      `void MyFunc1(int a) {}
      void MyFunc2(float a) {}
      void MyFunc3(char a) {}
      void MyFunc4(bool a) {}
      void MyFunc5(DataPack a) {}`
    )
  );
  expect(defined_functions).toEqual([
    defined_function("MyFunc1", types.void, [argument("a", types.int)]),
    defined_function("MyFunc2", types.void, [argument("a", types.float)]),
    defined_function("MyFunc3", types.void, [argument("a", types.char)]),
    defined_function("MyFunc4", types.void, [argument("a", types.bool)]),
    defined_function("MyFunc5", types.void, [
      argument("a", types.custom("DataPack")),
    ]),
  ]);
});

test("Parsing function declaration - single argument with default value", () => {
  const defined_functions = All_function_definitions(
    AST_of(
      `void MyFunc(int a = 5) {}
      void MyFunc(float a = 2.0) {}
      void MyFunc(char a = 'c') {}
      void MyFunc(bool a = true) {}
      void MyFunc(Handle a = null) {}`
    )
  );
  expect(defined_functions).toEqual([
    defined_function("MyFunc", types.void, [
      argument_with_default("a", types.int, "5"),
    ]),
    defined_function("MyFunc", types.void, [
      argument_with_default("a", types.float, "2.0"),
    ]),
    defined_function("MyFunc", types.void, [
      argument_with_default("a", types.char, "'c'"),
    ]),
    defined_function("MyFunc", types.void, [
      argument_with_default("a", types.bool, "true"),
    ]),
    defined_function("MyFunc", types.void, [
      argument_with_default("a", types.custom("Handle"), "null"),
    ]),
  ]);
});

test("Parsing function declaration - multiple arguments", () => {
  const defined_functions = All_function_definitions(
    AST_of(
      "MyFunc(int a, float b, char c, bool d, Action e = Plugin_Handled) {}"
    )
  );
  expect(defined_functions).toEqual([
    defined_function("MyFunc", types.int, [
      argument("a", types.int),
      argument("b", types.float),
      argument("c", types.char),
      argument("d", types.bool),
      argument_with_default("e", types.custom("Action"), "Plugin_Handled"),
    ]),
  ]);
});

test("Parsing function declaration - argument with dimension", () => {
  const defined_functions = All_function_definitions(
    AST_of(
      `void MyFunc1(float vec[3]) {}
      void MyFunc2(float vecs[16][3]) {}
      void MyFunc3(char[] str) {}`
    )
  );
  expect(defined_functions).toEqual([
    defined_function("MyFunc1", types.void, [
      argument("vec", types.dimensional(1, types.float)),
    ]),
    defined_function("MyFunc2", types.void, [
      argument("vecs", types.dimensional(2, types.float)),
    ]),
    defined_function("MyFunc3", types.void, [
      argument("str", types.dimensional(1, types.char)),
    ]),
  ]);
});

test("Parsing old style function declaration - no arguments, implicit return type", () => {
  const defined_functions = All_function_definitions(AST_of("MyFunc() {}"));
  expect(defined_functions).toEqual([
    defined_function("MyFunc", types.int, no_arguments),
  ]);
});

test("Parsing old style function declaration - no arguments, explicit return type", () => {
  const defined_functions = All_function_definitions(
    AST_of(
      `_:MyFunc1() {}
      Float:MyFunc2() {}
      String:MyFunc3() {}
      bool:MyFunc4() {}
      Action:MyFunc5() {}`
    )
  );
  expect(defined_functions).toEqual([
    defined_function("MyFunc1", types.int, no_arguments),
    defined_function("MyFunc2", types.float, no_arguments),
    defined_function("MyFunc3", types.char, no_arguments),
    defined_function("MyFunc4", types.bool, no_arguments),
    defined_function("MyFunc5", types.custom("Action"), no_arguments),
  ]);
});

test("Parsing old style function declaration - single argument", () => {
  const defined_functions = All_function_definitions(
    AST_of(
      `MyFunc1(a) {}
      MyFunc2(_:a)) {}
      MyFunc3(Float:a) {}
      MyFunc4(String:a) {}
      MyFunc5(bool:a) {}
      MyFunc6(Action:a) {}`
    )
  );
  expect(defined_functions).toEqual([
    defined_function("MyFunc1", types.int, [argument("a", types.int)]),
    defined_function("MyFunc2", types.int, [argument("a", types.int)]),
    defined_function("MyFunc3", types.int, [argument("a", types.float)]),
    defined_function("MyFunc4", types.int, [argument("a", types.char)]),
    defined_function("MyFunc5", types.int, [argument("a", types.bool)]),
    defined_function("MyFunc6", types.int, [
      argument("a", types.custom("Action")),
    ]),
  ]);
});
