import { Global_variables, Type, Variable, Range } from "../../src/parser";
import { AST_of, from, types } from "./AST_helpers";

function variable(name: string, type: Type, range: Range): Variable {
  return {
    range,
    type,
    name,
    hasInitialValue: false,
  };
}

function variable_with_initial_value(
  name: string,
  type: Type,
  range: Range
): Variable {
  return {
    range,
    type,
    name,
    hasInitialValue: true,
  };
}

test("parsing simple variable declarations", () => {
  let variables = Global_variables(
    AST_of(
      `int a;
      float b;
      bool c;
      char d;
      Action e;`
    )
  );

  expect(variables).toEqual([
    variable("a", types.int, from(0, 0).to(0, 6)),
    variable("b", types.float, from(1, 6).to(1, 14)),
    variable("c", types.bool, from(2, 6).to(2, 13)),
    variable("d", types.char, from(3, 6).to(3, 13)),
    variable("e", types.custom("Action"), from(4, 6).to(4, 15)),
  ]);
});

test("parsing variable with inital value", () => {
  let variables = Global_variables(
    AST_of(
      `int a = 2;
      float b = 7.14;
      bool c = true;
      char d = 'a';
      Action e = Plugin_Continue;`
    )
  );

  expect(variables).toEqual([
    variable_with_initial_value("a", types.int, from(0, 0).to(0, 10)),
    variable_with_initial_value("b", types.float, from(1, 6).to(1, 21)),
    variable_with_initial_value("c", types.bool, from(2, 6).to(2, 20)),
    variable_with_initial_value("d", types.char, from(3, 6).to(3, 19)),
    variable_with_initial_value(
      "e",
      types.custom("Action"),
      from(4, 6).to(4, 33)
    ),
  ]);
});

test("variable defined in function is not exposed as global variable", () => {
  let variables = Global_variables(
    AST_of(
      `void Test() {
        int a = 0;
      }`
    )
  );

  expect(variables).toHaveLength(0);
});

test("array variable", () => {
  let variables = Global_variables(
    AST_of(
      `int[] a;
      float[][] b;
      char c[];
      bool d[20];`
    )
  );

  expect(variables).toEqual([
    variable("a", types.dimensional(1, types.int), from(0, 0).to(0, 8)),
    variable("b", types.dimensional(2, types.float), from(1, 6).to(1, 18)),
    variable("c", types.dimensional(1, types.char), from(2, 6).to(2, 15)),
    variable("d", types.dimensional(1, types.bool), from(3, 6).to(3, 17)),
  ]);
});

test("array initalisation", () => {
  let variables = Global_variables(
    AST_of(
      `char[] text = "Hello world";
      int numbers[] = { 1, 2, 3 };
      float vec[3] = { 0.0, 14.2, 13.22 };
      bool client_has_stuff[MAXPLAYERS] = { true, ... };`
    )
  );

  expect(variables).toEqual([
    variable_with_initial_value(
      "text",
      types.dimensional(1, types.char),
      from(0, 0).to(0, 28)
    ),
    variable_with_initial_value(
      "numbers",
      types.dimensional(1, types.int),
      from(1, 6).to(1, 34)
    ),
    variable_with_initial_value(
      "vec",
      types.dimensional(1, types.float),
      from(2, 6).to(2, 42)
    ),
    variable_with_initial_value(
      "client_has_stuff",
      types.dimensional(1, types.bool),
      from(3, 6).to(3, 56)
    ),
  ]);
});

test("multiple variables in single statement", () => {
  let variables = Global_variables(
    AST_of(
      `int a, b;
      bool c, d = true;
      float e = 12.92, f = 1.2, g = 82.00;
      char h = 'c', i;
      char j[10] = "whatever!", k[256];`
    )
  );

  expect(variables).toEqual([
    variable("a", types.int, from(0, 4).to(0, 5)),
    variable("b", types.int, from(0, 7).to(0, 8)),
    variable("c", types.bool, from(1, 11).to(1, 12)),
    variable_with_initial_value("d", types.bool, from(1, 14).to(1, 22)),
    variable_with_initial_value("e", types.float, from(2, 12).to(2, 21)),
    variable_with_initial_value("f", types.float, from(2, 23).to(2, 30)),
    variable_with_initial_value("g", types.float, from(2, 32).to(2, 41)),
    variable_with_initial_value("h", types.char, from(3, 11).to(3, 18)),
    variable("i", types.char, from(3, 20).to(3, 21)),
    variable_with_initial_value(
      "j",
      types.dimensional(1, types.char),
      from(4, 11).to(4, 30)
    ),
    variable("k", types.dimensional(1, types.char), from(4, 32).to(4, 38)),
  ]);
});
