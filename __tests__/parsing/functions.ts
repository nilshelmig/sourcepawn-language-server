import {
  All_function_definitions,
  Function_definition,
  Type,
  Argument,
  Range,
} from "../../src/parser";

import {
  AST_of,
  from,
  types,
  argument,
  argument_with_default,
  no_arguments,
} from "./AST_helpers";

function defined_function(
  name: string,
  returnType: Type,
  args: ReadonlyArray<Argument>,
  range: Range
): Function_definition {
  return {
    range,
    returnType,
    name,
    args,
  };
}

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
    defined_function("MyFunc1", types.void, no_arguments, from(0, 0).to(0, 17)),
    defined_function("MyFunc2", types.int, no_arguments, from(1, 6).to(1, 22)),
    defined_function(
      "MyFunc3",
      types.float,
      no_arguments,
      from(2, 6).to(2, 24)
    ),
    defined_function("MyFunc4", types.char, no_arguments, from(3, 6).to(3, 23)),
    defined_function("MyFunc5", types.bool, no_arguments, from(4, 6).to(4, 23)),
    defined_function(
      "MyFunc6",
      types.custom("Handle"),
      no_arguments,
      from(5, 6).to(5, 25)
    ),
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
    defined_function(
      "MyFunc1",
      types.void,
      [argument("a", types.int)],
      from(0, 0).to(0, 22)
    ),
    defined_function(
      "MyFunc2",
      types.void,
      [argument("a", types.float)],
      from(1, 6).to(1, 30)
    ),
    defined_function(
      "MyFunc3",
      types.void,
      [argument("a", types.char)],
      from(2, 6).to(2, 29)
    ),
    defined_function(
      "MyFunc4",
      types.void,
      [argument("a", types.bool)],
      from(3, 6).to(3, 29)
    ),
    defined_function(
      "MyFunc5",
      types.void,
      [argument("a", types.custom("DataPack"))],
      from(4, 6).to(4, 33)
    ),
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
    defined_function(
      "MyFunc",
      types.void,
      [argument_with_default("a", types.int, "5")],
      from(0, 0).to(0, 25)
    ),
    defined_function(
      "MyFunc",
      types.void,
      [argument_with_default("a", types.float, "2.0")],
      from(1, 6).to(1, 35)
    ),
    defined_function(
      "MyFunc",
      types.void,
      [argument_with_default("a", types.char, "'c'")],
      from(2, 6).to(2, 34)
    ),
    defined_function(
      "MyFunc",
      types.void,
      [argument_with_default("a", types.bool, "true")],
      from(3, 6).to(3, 35)
    ),
    defined_function(
      "MyFunc",
      types.void,
      [argument_with_default("a", types.custom("Handle"), "null")],
      from(4, 6).to(4, 37)
    ),
  ]);
});

test("Parsing function declaration - multiple arguments", () => {
  const defined_functions = All_function_definitions(
    AST_of(
      "MyFunc(int a, float b, char c, bool d, Action e = Plugin_Handled) {}"
    )
  );
  expect(defined_functions).toEqual([
    defined_function(
      "MyFunc",
      types.int,
      [
        argument("a", types.int),
        argument("b", types.float),
        argument("c", types.char),
        argument("d", types.bool),
        argument_with_default("e", types.custom("Action"), "Plugin_Handled"),
      ],
      from(0, 0).to(0, 68)
    ),
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
    defined_function(
      "MyFunc1",
      types.void,
      [argument("vec", types.dimensional(1, types.float))],
      from(0, 0).to(0, 29)
    ),
    defined_function(
      "MyFunc2",
      types.void,
      [argument("vecs", types.dimensional(2, types.float))],
      from(1, 6).to(1, 40)
    ),
    defined_function(
      "MyFunc3",
      types.void,
      [argument("str", types.dimensional(1, types.char))],
      from(2, 6).to(2, 33)
    ),
  ]);
});

test("Parsing old style function declaration - no arguments, implicit return type", () => {
  const defined_functions = All_function_definitions(AST_of("MyFunc() {}"));
  expect(defined_functions).toEqual([
    defined_function("MyFunc", types.int, no_arguments, from(0, 0).to(0, 11)),
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
    defined_function("MyFunc1", types.int, no_arguments, from(0, 0).to(0, 14)),
    defined_function(
      "MyFunc2",
      types.float,
      no_arguments,
      from(1, 6).to(1, 24)
    ),
    defined_function("MyFunc3", types.char, no_arguments, from(2, 6).to(2, 25)),
    defined_function("MyFunc4", types.bool, no_arguments, from(3, 6).to(3, 23)),
    defined_function(
      "MyFunc5",
      types.custom("Action"),
      no_arguments,
      from(4, 6).to(4, 25)
    ),
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
    defined_function(
      "MyFunc1",
      types.int,
      [argument("a", types.int)],
      from(0, 0).to(0, 13)
    ),
    defined_function(
      "MyFunc2",
      types.int,
      [argument("a", types.int)],
      from(1, 6).to(1, 22)
    ),
    defined_function(
      "MyFunc3",
      types.int,
      [argument("a", types.float)],
      from(2, 6).to(2, 25)
    ),
    defined_function(
      "MyFunc4",
      types.int,
      [argument("a", types.char)],
      from(3, 6).to(3, 26)
    ),
    defined_function(
      "MyFunc5",
      types.int,
      [argument("a", types.bool)],
      from(4, 6).to(4, 24)
    ),
    defined_function(
      "MyFunc6",
      types.int,
      [argument("a", types.custom("Action"))],
      from(5, 6).to(5, 26)
    ),
  ]);
});
