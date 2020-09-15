import {
  All_function_definitions,
  Function_definition,
  Type,
  Argument,
} from "../src/parser";

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

test("Parsing function declaration - no arguments", () => {
  const defined_functions = All_function_definitions(
    `void MyFunc1() {}
    int MyFunc2() {}
    float MyFunc3() {}
    char MyFunc4() {}
    bool MyFunc5() {}
    Handle MyFunc6() {}`
  );
  expect(defined_functions).toEqual([
    defined_function("MyFunc1", "void", no_arguments),
    defined_function("MyFunc2", "int", no_arguments),
    defined_function("MyFunc3", "float", no_arguments),
    defined_function("MyFunc4", "char", no_arguments),
    defined_function("MyFunc5", "bool", no_arguments),
    defined_function("MyFunc6", "Handle", no_arguments),
  ]);
});

test("Parsing function declaration - single argument", () => {
  const defined_functions = All_function_definitions(
    `void MyFunc1(int a) {}
    void MyFunc2(float a) {}
    void MyFunc3(char a) {}
    void MyFunc4(bool a) {}
    void MyFunc5(DataPack a) {}`
  );
  expect(defined_functions).toEqual([
    defined_function("MyFunc1", "void", [argument("a", "int")]),
    defined_function("MyFunc2", "void", [argument("a", "float")]),
    defined_function("MyFunc3", "void", [argument("a", "char")]),
    defined_function("MyFunc4", "void", [argument("a", "bool")]),
    defined_function("MyFunc5", "void", [argument("a", "DataPack")]),
  ]);
});

test("Parsing function declaration - single argument with default value", () => {
  const defined_functions = All_function_definitions(
    `void MyFunc(int a = 5) {}
    void MyFunc(float a = 2.0) {}
    void MyFunc(char a = 'c') {}
    void MyFunc(bool a = true) {}
    void MyFunc(Handle a = null) {}`
  );
  expect(defined_functions).toEqual([
    defined_function("MyFunc", "void", [
      argument_with_default("a", "int", "5"),
    ]),
    defined_function("MyFunc", "void", [
      argument_with_default("a", "float", "2.0"),
    ]),
    defined_function("MyFunc", "void", [
      argument_with_default("a", "char", "'c'"),
    ]),
    defined_function("MyFunc", "void", [
      argument_with_default("a", "bool", "true"),
    ]),
    defined_function("MyFunc", "void", [
      argument_with_default("a", "Handle", "null"),
    ]),
  ]);
});

test("Parsing function declaration - multiple arguments", () => {
  const defined_functions = All_function_definitions(
    "MyFunc(int a, float b, char c, bool d, Action e = Plugin_Handled) {}"
  );
  expect(defined_functions).toEqual([
    defined_function("MyFunc", "int", [
      argument("a", "int"),
      argument("b", "float"),
      argument("c", "char"),
      argument("d", "bool"),
      argument_with_default("e", "Action", "Plugin_Handled"),
    ]),
  ]);
});

test("Parsing old style function declaration - no arguments, implicit return type", () => {
  const defined_functions = All_function_definitions("MyFunc() {}");
  expect(defined_functions).toEqual([
    defined_function("MyFunc", "int", no_arguments),
  ]);
});

test("Parsing old style function declaration - no arguments, explicit return type", () => {
  const defined_functions = All_function_definitions(
    `_:MyFunc1() {}
    Float:MyFunc2() {}
    String:MyFunc3() {}
    bool:MyFunc4() {}
    Action:MyFunc5() {}`
  );
  expect(defined_functions).toEqual([
    defined_function("MyFunc1", "int", no_arguments),
    defined_function("MyFunc2", "float", no_arguments),
    defined_function("MyFunc3", "char", no_arguments),
    defined_function("MyFunc4", "bool", no_arguments),
    defined_function("MyFunc5", "Action", no_arguments),
  ]);
});

test("Parsing old style function declaration - single argument", () => {
  const defined_functions = All_function_definitions(
    `MyFunc1(a) {}
    MyFunc2(_:a)) {}
    MyFunc3(Float:a) {}
    MyFunc4(String:a) {}
    MyFunc5(bool:a) {}
    MyFunc6(Action:a) {}`
  );
  expect(defined_functions).toEqual([
    defined_function("MyFunc1", "int", [argument("a", "int")]),
    defined_function("MyFunc2", "int", [argument("a", "int")]),
    defined_function("MyFunc3", "int", [argument("a", "float")]),
    defined_function("MyFunc4", "int", [argument("a", "char")]),
    defined_function("MyFunc5", "int", [argument("a", "bool")]),
    defined_function("MyFunc6", "int", [argument("a", "Action")]),
  ]);
});
